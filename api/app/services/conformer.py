from dataclasses import dataclass

from rdkit import Chem
from rdkit.Chem import AllChem, Descriptors, Lipinski, rdMolDescriptors


class MoleculeError(ValueError):
    """Raised when a submitted structure cannot be processed safely."""


@dataclass(frozen=True)
class ConformerResult:
    canonical_smiles: str
    molfile: str
    sdf: str
    atom_count: int
    heavy_atom_count: int
    molecular_formula: str
    molecular_weight: float
    logp: float
    hydrogen_bond_donors: int
    hydrogen_bond_acceptors: int
    rotatable_bonds: int
    force_field: str
    energy_kcal_mol: float | None
    seed: int


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
            "The structure could not be read. Check atom valences, bond orders, and ring closures."
        )
    if mol.GetNumAtoms() == 0:
        raise MoleculeError("The structure is empty.")
    if mol.GetNumHeavyAtoms() > 150:
        raise MoleculeError("Phase 1 supports molecules with at most 150 heavy atoms.")
    if len(Chem.GetMolFrags(mol)) != 1:
        raise MoleculeError("Use one connected molecule at a time; salts and mixtures are not supported yet.")
    return mol


def generate_conformer(
    *,
    smiles: str | None = None,
    molfile: str | None = None,
    seed: int = 61453,
) -> ConformerResult:
    source = _parse_structure(smiles, molfile)
    canonical_smiles = Chem.MolToSmiles(source, isomericSmiles=True, canonical=True)
    source_2d = Chem.Mol(source)
    if source_2d.GetNumConformers() == 0:
        AllChem.Compute2DCoords(source_2d)

    molecule = Chem.AddHs(source)
    params = AllChem.ETKDGv3()
    params.randomSeed = seed
    params.useRandomCoords = False
    params.enforceChirality = True
    params.clearConfs = True

    conformer_id = AllChem.EmbedMolecule(molecule, params)
    if conformer_id < 0:
        raise MoleculeError(
            "RDKit could not generate a stable 3D starting shape for this molecule."
        )

    force_field = "UFF"
    energy: float | None = None
    if AllChem.MMFFHasAllMoleculeParams(molecule):
        force_field = "MMFF94"
        properties = AllChem.MMFFGetMoleculeProperties(molecule, mmffVariant="MMFF94")
        field = AllChem.MMFFGetMoleculeForceField(molecule, properties, confId=conformer_id)
        if field is not None:
            field.Minimize(maxIts=500)
            energy = float(field.CalcEnergy())
    else:
        field = AllChem.UFFGetMoleculeForceField(molecule, confId=conformer_id)
        if field is not None:
            field.Minimize(maxIts=500)
            energy = float(field.CalcEnergy())

    molecule.SetProp("_Name", "Compound Canvas conformer")
    molecule.SetProp("canonical_smiles", canonical_smiles)
    molecule.SetProp("conformer_method", "ETKDGv3")
    molecule.SetProp("force_field", force_field)
    molecule.SetIntProp("random_seed", seed)
    if energy is not None:
        molecule.SetDoubleProp("energy_kcal_mol", energy)

    return ConformerResult(
        canonical_smiles=canonical_smiles,
        molfile=Chem.MolToMolBlock(source_2d),
        sdf=Chem.MolToMolBlock(molecule) + "\n$$$$\n",
        atom_count=molecule.GetNumAtoms(),
        heavy_atom_count=source.GetNumHeavyAtoms(),
        molecular_formula=rdMolDescriptors.CalcMolFormula(source),
        molecular_weight=round(Descriptors.MolWt(source), 3),
        logp=round(Descriptors.MolLogP(source), 3),
        hydrogen_bond_donors=Lipinski.NumHDonors(source),
        hydrogen_bond_acceptors=Lipinski.NumHAcceptors(source),
        rotatable_bonds=Lipinski.NumRotatableBonds(source),
        force_field=force_field,
        energy_kcal_mol=round(energy, 4) if energy is not None else None,
        seed=seed,
    )
