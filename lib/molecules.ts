export type ConformerRequest = {
  smiles?: string;
  molfile?: string;
  seed?: number;
};

export type ConformerResult = {
  canonical_smiles: string;
  molfile: string;
  sdf: string;
  atom_count: number;
  heavy_atom_count: number;
  molecular_formula: string;
  molecular_weight: number;
  logp: number;
  hydrogen_bond_donors: number;
  hydrogen_bond_acceptors: number;
  rotatable_bonds: number;
  conformer_method: "ETKDGv3";
  force_field: "MMFF94" | "UFF";
  energy_kcal_mol: number | null;
  explicit_hydrogens: boolean;
  seed: number;
  warnings: string[];
};

export type ApiError = {
  detail?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export async function checkMoleculeService(signal?: AbortSignal): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`, { signal, cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

export async function generateConformer(
  request: ConformerRequest,
  signal?: AbortSignal,
): Promise<ConformerResult> {
  let response: Response;
  const timeoutController = new AbortController();
  const timeout = globalThis.setTimeout(() => timeoutController.abort(), 60_000);
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    response = await fetch(`${API_URL}/api/molecules/conformers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: combinedSignal,
    });
  } catch (cause) {
    if (timeoutController.signal.aborted) {
      throw new Error(
        "The 3D calculation took longer than one minute. Try a smaller molecule or retry.",
      );
    }
    throw new Error(
      "The molecule calculation service is unavailable. Please wait a moment and retry.",
    );
  } finally {
    globalThis.clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(body.detail ?? "The molecule could not be converted to 3D.");
  }

  return (await response.json()) as ConformerResult;
}
