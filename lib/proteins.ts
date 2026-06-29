import type { ApiError } from "./molecules";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export type ProteinCleanupResult = {
  artifact_id: string;
  status: "cleaned_not_docking_ready";
  target: { pdb_id: "2ITY"; chain_id: "A" };
  cleaned_pdb: string;
  selection_report: {
    selected_model: number;
    selected_chain: "A";
    source_model_count: number;
    source_chain_ids: string[];
    source_atom_count: number;
    retained_residue_count: number;
    retained_atom_count: number;
    alternate_location_groups_resolved: number;
    alternate_location_atoms_discarded: number;
  };
  removal_report: {
    total_atoms_removed: number;
    other_chain_atoms_excluded: number;
    water_atoms_observed: number;
    deposited_ire_atoms_observed: number;
    other_heterogen_atoms_observed: number;
  };
  assumptions: string[];
  warnings: string[];
  provenance: {
    source: string;
    source_url: string;
    source_format: string;
    source_sha256: string;
    output_sha256: string;
    tool: string;
    tool_version: string;
    preset: string;
    generated_at: string;
  };
  manifest: Record<string, unknown>;
};

export type ProteinReceptorPreparationResult = {
  artifact_id: string;
  status: "docking_input_prepared_no_docking";
  target: { pdb_id: "2ITY"; chain_id: "A" };
  prepared_receptor_pdb: string;
  receptor_pdbqt: string;
  preparation_report: {
    started_from_artifact_id: string;
    input_status: string;
    retained_residue_count: number;
    retained_heavy_atom_count: number;
    prepared_atom_count: number;
    hydrogens_added: number;
    pdbqt_atom_records: number;
    meeko_json_available: boolean;
  };
  protonation_report: {
    method: string;
    assumed_ph: number;
    force_field: string;
    hydrogens_added: number;
    prepared_atom_count: number;
    heavy_atom_count: number;
    total_charge: number;
    chain_ids_preserved_in_prepared_pdb: boolean;
    chain_ids_preserved_in_pdbqt: boolean;
  };
  assumptions: string[];
  warnings: string[];
  provenance: {
    source: string;
    source_url: string;
    source_sha256: string;
    cleaned_artifact_id: string;
    cleaned_pdb_sha256: string;
    prepared_pdb_sha256: string;
    receptor_pdbqt_sha256: string;
    tool_pdb2pqr: string;
    tool_pdb2pqr_version: string | null;
    tool_propka: string;
    tool_propka_version: string | null;
    tool_meeko: string;
    tool_meeko_version: string | null;
    tool_gemmi: string;
    tool_gemmi_version: string;
    preset: string;
    generated_at: string;
    manifest_sha256: string;
  };
  manifest: Record<string, unknown>;
};

export type RcsbImportResult = {
  artifact_id: string;
  status: "deposited_unprepared";
  pdb_id: string;
  coordinate_format: "mmcif";
  coordinates: string;
  structure_summary: {
    title: string;
    experimental_method: string | null;
    resolution_angstrom: number | null;
    model_count: number;
    chain_ids: string[];
    polymer_residue_count: number;
    atom_count: number;
    deposited_components: string[];
    example_residue: {
      residue_name: string;
      residue_number: number;
      insertion_code: string | null;
      chain: string;
    };
  };
  warnings: string[];
  provenance: {
    source: string;
    source_url: string;
    coordinate_url: string;
    source_sha256: string;
    tool: string;
    tool_version: string;
    retrieved_at: string;
  };
};

export async function importRcsbProtein(
  pdbId: string,
  signal?: AbortSignal,
): Promise<RcsbImportResult> {
  const timeoutController = new AbortController();
  const timeout = globalThis.setTimeout(() => timeoutController.abort(), 60_000);
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal;
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/proteins/import/rcsb`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdb_id: pdbId.trim().toUpperCase() }),
      signal: combinedSignal,
    });
  } catch {
    if (timeoutController.signal.aborted) {
      throw new Error("Protein import took longer than one minute. Please retry.");
    }
    throw new Error("The calculation service cannot reach RCSB right now. Please retry shortly.");
  } finally {
    globalThis.clearTimeout(timeout);
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(body.detail ?? "The RCSB protein could not be imported.");
  }
  return (await response.json()) as RcsbImportResult;
}

export async function cleanEgfrChainA(signal?: AbortSignal): Promise<ProteinCleanupResult> {
  const timeoutController = new AbortController();
  const timeout = globalThis.setTimeout(() => timeoutController.abort(), 60_000);
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal;

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/proteins/2ity/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: combinedSignal,
    });
  } catch {
    if (timeoutController.signal.aborted) {
      throw new Error("EGFR cleanup took longer than one minute. Please retry.");
    }
    throw new Error("The calculation service is unavailable. Please wait a moment and retry.");
  } finally {
    globalThis.clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(body.detail ?? "EGFR Chain A could not be cleaned.");
  }
  return (await response.json()) as ProteinCleanupResult;
}

export async function prepareEgfrDockingInputReceptor(
  signal?: AbortSignal,
): Promise<ProteinReceptorPreparationResult> {
  const timeoutController = new AbortController();
  const timeout = globalThis.setTimeout(() => timeoutController.abort(), 90_000);
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal;

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/proteins/2ity/prepare-receptor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: combinedSignal,
    });
  } catch {
    if (timeoutController.signal.aborted) {
      throw new Error("EGFR receptor preparation took longer than expected. Please retry.");
    }
    throw new Error("The calculation service is unavailable. Please wait a moment and retry.");
  } finally {
    globalThis.clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(body.detail ?? "EGFR receptor could not be prepared.");
  }
  return (await response.json()) as ProteinReceptorPreparationResult;
}
