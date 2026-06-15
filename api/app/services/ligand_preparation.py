from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import UTC, datetime
from importlib.metadata import PackageNotFoundError, version
from typing import Literal

from rdkit import Chem, rdBase
from rdkit.Chem import AllChem, Descriptors, rdMolDescriptors

from .conformer import MoleculeError

MAX_HEAVY_ATOMS = 60
MAX_CONFORMERS = 5


@dataclass(frozen=True)
class FragmentReport:
    original_fragment_count: int
    selected_fragment_index: int
    selected_heavy_atoms: int
    removed_fragments: list[dict[str, int | str]]


@dataclass(frozen=True)
class StereochemistryReport:
    assigned_centers: list[dict[str, int | str]]
    possible_unassigned_centers: list[dict[str, int | str]]


@dataclass(frozen=True)
class HydrogenReport:
    atoms_before_hydrogens: int
    atoms_after_hydrogens: int
    explicit_hydrogens_added: int


@dataclass(frozen=True)
class ConformerReport:
    requested_conformers: int
    generated_conformers: int
    selected_conformer_id: int
    force_field: Literal["MMFF94", "UFF"]
    energies_kcal_mol: list[dict[str, float | int]]


@dataclass(frozen=True)
class LigandPreparationResult:
    artifact_id: str
    canonical_isomeric_smiles: str
    molecular_formula: str
    molecular_weight: float
    formal_charge: int
    fragment_report: FragmentReport
    stereochemistry_report: StereochemistryReport
    hydrogen_report: HydrogenReport
    conformer_report: ConformerReport
    prepared_sdf: str
    pdbqt: str | None
    pdbqt_available: bool
    provenance: dict[str, str | None]
    warnings: list[str]


def _parse_structure(smiles: str | None, molfile: str | None) -> Chem.Mol:
    if bool(smiles) == bool(molfile):
        raise MoleculeError("Provide exactly one of smiles or molfile.")

    mol = (
        Chem.MolFromSmiles(smiles, sanitize=True)
        if smiles
        else Chem.MolFromMolBlock(molfile or "", sanitize=True, removeHs=False)
    )
    if mol is None:
        raise MoleculeError(
            "The structure could not be read by the calculation service. Check atom valences, bond orders, and ring closures."
        )
    if mol.GetNumAtoms() == 0:
        raise MoleculeError("The structure is empty.")
    if mol.GetNumHeavyAtoms() > MAX_HEAVY_ATOMS:
        raise MoleculeError(
            f"Ligand preparation currently supports molecules with at most {MAX_HEAVY_ATOMS} heavy atoms."
        )
    return mol


def _largest_fragment(mol: Chem.Mol) -> tuple[Chem.Mol, FragmentReport, list[str]]:
    fragments = Chem.GetMolFrags(mol, asMols=True, sanitizeFrags=True)
    if not fragments:
        raise MoleculeError("The structure is empty.")

    fragment_rows = [
        {
            "index": index,
            "heavy_atoms": fragment.GetNumHeavyAtoms(),
            "smiles": Chem.MolToSmiles(fragment, isomericSmiles=True, canonical=True),
        }
        for index, fragment in enumerate(fragments)
    ]
    selected_index, selected = max(
        enumerate(fragments),
        key=lambda item: (item[1].GetNumHeavyAtoms(), item[1].GetNumAtoms()),
    )
    removed = [
        row
        for row in fragment_rows
        if int(row["index"]) != selected_index
    ]
    warnings: list[str] = []
    if removed:
        warnings.append(
            "The molecule had multiple pieces. Compound Canvas prepared the largest fragment and did not prepare the smaller fragments or salts."
        )
    return (
        selected,
        FragmentReport(
            original_fragment_count=len(fragments),
            selected_fragment_index=selected_index,
            selected_heavy_atoms=selected.GetNumHeavyAtoms(),
            removed_fragments=removed,
        ),
        warnings,
    )


def _stereochemistry_report(mol: Chem.Mol) -> tuple[StereochemistryReport, list[str]]:
    centers = Chem.FindMolChiralCenters(
        mol,
        includeUnassigned=True,
        useLegacyImplementation=False,
    )
    assigned: list[dict[str, int | str]] = []
    unassigned: list[dict[str, int | str]] = []
    for atom_index, label in centers:
        atom = mol.GetAtomWithIdx(atom_index)
        row: dict[str, int | str] = {
            "atom_index": atom_index,
            "element": atom.GetSymbol(),
            "assignment": label,
        }
        if label == "?":
            unassigned.append(row)
        else:
            assigned.append(row)

    warnings = []
    if unassigned:
        warnings.append(
            "Some stereochemistry is not specified. This drawing may represent more than one possible 3D molecule."
        )
    return (
        StereochemistryReport(
            assigned_centers=assigned,
            possible_unassigned_centers=unassigned,
        ),
        warnings,
    )


def _minimize_conformers(
    mol: Chem.Mol,
    *,
    conformer_count: int,
    seed: int,
) -> tuple[ConformerReport, int]:
    params = AllChem.ETKDGv3()
    params.randomSeed = seed
    params.enforceChirality = True
    params.clearConfs = True
    conformer_ids = list(AllChem.EmbedMultipleConfs(mol, numConfs=conformer_count, params=params))
    if not conformer_ids:
        raise MoleculeError(
            "RDKit could not generate a stable 3D starting shape for ligand preparation."
        )

    force_field: Literal["MMFF94", "UFF"] = "UFF"
    energies: list[dict[str, float | int]] = []
    if AllChem.MMFFHasAllMoleculeParams(mol):
        force_field = "MMFF94"
        properties = AllChem.MMFFGetMoleculeProperties(mol, mmffVariant="MMFF94")
        for conformer_id in conformer_ids:
            field = AllChem.MMFFGetMoleculeForceField(mol, properties, confId=conformer_id)
            if field is not None:
                field.Minimize(maxIts=500)
                energies.append(
                    {
                        "conformer_id": conformer_id,
                        "energy_kcal_mol": round(float(field.CalcEnergy()), 4),
                    }
                )
    else:
        for conformer_id in conformer_ids:
            field = AllChem.UFFGetMoleculeForceField(mol, confId=conformer_id)
            if field is not None:
                field.Minimize(maxIts=500)
                energies.append(
                    {
                        "conformer_id": conformer_id,
                        "energy_kcal_mol": round(float(field.CalcEnergy()), 4),
                    }
                )

    if not energies:
        selected = int(conformer_ids[0])
    else:
        selected = int(min(energies, key=lambda item: float(item["energy_kcal_mol"]))["conformer_id"])

    return (
        ConformerReport(
            requested_conformers=conformer_count,
            generated_conformers=len(conformer_ids),
            selected_conformer_id=selected,
            force_field=force_field,
            energies_kcal_mol=energies,
        ),
        selected,
    )


def _package_version(package: str) -> str | None:
    try:
        return version(package)
    except PackageNotFoundError:
        return None


def _write_pdbqt(mol: Chem.Mol) -> tuple[str | None, list[str]]:
    warnings: list[str] = []
    try:
        from meeko import MoleculePreparation, PDBQTWriterLegacy

        preparator = MoleculePreparation()
        setups = preparator.prepare(mol)
        pdbqt_string, ok, message = PDBQTWriterLegacy.write_string(setups[0])
        if not ok:
            warnings.append(
                "Meeko could not create a PDBQT docking-format file for this molecule. The prepared SDF is still available."
            )
            if message:
                warnings.append(f"Meeko message: {message}")
            return None, warnings
        return pdbqt_string, warnings
    except Exception:
        warnings.append(
            "Meeko PDBQT generation is unavailable for this molecule. The prepared SDF is still available."
        )
        return None, warnings


def prepare_ligand(
    *,
    smiles: str | None = None,
    molfile: str | None = None,
    conformer_count: int = MAX_CONFORMERS,
    seed: int = 61453,
) -> LigandPreparationResult:
    conformer_count = max(1, min(conformer_count, MAX_CONFORMERS))
    source = _parse_structure(smiles, molfile)
    selected_fragment, fragment_report, warnings = _largest_fragment(source)
    if selected_fragment.GetNumHeavyAtoms() > MAX_HEAVY_ATOMS:
        raise MoleculeError(
            f"The selected ligand fragment has more than {MAX_HEAVY_ATOMS} heavy atoms."
        )

    canonical_smiles = Chem.MolToSmiles(
        selected_fragment,
        isomericSmiles=True,
        canonical=True,
    )
    formal_charge = Chem.GetFormalCharge(selected_fragment)
    if formal_charge != 0:
        warnings.append(
            f"The prepared ligand has a formal charge of {formal_charge:+d}. Charge may be correct, but it strongly affects future docking calculations."
        )

    stereo_report, stereo_warnings = _stereochemistry_report(selected_fragment)
    warnings.extend(stereo_warnings)
    warnings.append(
        "Protonation was not predicted from pH. Hydrogens were added from the drawn molecule using RDKit rules."
    )
    warnings.append(
        "This prepared ligand is a future docking input. Compound Canvas has not docked it, scored it, or predicted binding."
    )

    molecule_with_hydrogens = Chem.AddHs(selected_fragment)
    hydrogen_report = HydrogenReport(
        atoms_before_hydrogens=selected_fragment.GetNumAtoms(),
        atoms_after_hydrogens=molecule_with_hydrogens.GetNumAtoms(),
        explicit_hydrogens_added=(
            molecule_with_hydrogens.GetNumAtoms() - selected_fragment.GetNumAtoms()
        ),
    )

    conformer_report, selected_conformer_id = _minimize_conformers(
        molecule_with_hydrogens,
        conformer_count=conformer_count,
        seed=seed,
    )
    Chem.AssignStereochemistry(molecule_with_hydrogens, force=True, cleanIt=True)

    prepared = Chem.Mol(molecule_with_hydrogens, False, selected_conformer_id)
    prepared.SetProp("_Name", "Compound Canvas prepared ligand")
    prepared.SetProp("canonical_isomeric_smiles", canonical_smiles)
    prepared.SetProp("preparation_method", "RDKit ETKDGv3 conformer ensemble + force-field minimization + Meeko PDBQT")
    prepared.SetIntProp("formal_charge", formal_charge)
    prepared.SetProp("force_field", conformer_report.force_field)
    prepared.SetIntProp("selected_conformer_id", selected_conformer_id)

    prepared_sdf = Chem.MolToMolBlock(prepared, confId=selected_conformer_id) + "\n$$$$\n"
    pdbqt, pdbqt_warnings = _write_pdbqt(prepared)
    warnings.extend(pdbqt_warnings)

    generated_at = datetime.now(UTC).isoformat()
    input_hash = hashlib.sha256((molfile or smiles or "").encode("utf-8")).hexdigest()
    artifact_id = f"ligprep_{input_hash[:12]}_{seed}"

    return LigandPreparationResult(
        artifact_id=artifact_id,
        canonical_isomeric_smiles=canonical_smiles,
        molecular_formula=rdMolDescriptors.CalcMolFormula(selected_fragment),
        molecular_weight=round(Descriptors.MolWt(selected_fragment), 3),
        formal_charge=formal_charge,
        fragment_report=fragment_report,
        stereochemistry_report=stereo_report,
        hydrogen_report=hydrogen_report,
        conformer_report=conformer_report,
        prepared_sdf=prepared_sdf,
        pdbqt=pdbqt,
        pdbqt_available=pdbqt is not None,
        provenance={
            "rdkit_version": rdBase.rdkitVersion,
            "meeko_version": _package_version("meeko"),
            "method": "RDKit ETKDGv3 ensemble, force-field minimization, Meeko ligand PDBQT preparation when available",
            "generated_at": generated_at,
            "input_sha256": input_hash,
        },
        warnings=warnings,
    )
