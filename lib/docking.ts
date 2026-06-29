import type { ApiError } from "./molecules";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export type DockingLessonRequest = {
  ligand_artifact_id: string;
  ligand_pdbqt: string;
  receptor_artifact_id: string;
  receptor_pdbqt: string;
};

export type DockingLessonResult = {
  artifact_id: string;
  status: "docking_estimate_curated_box";
  engine: "AutoDock Vina";
  engine_version: string | null;
  target: { pdb_id: "2ITY"; chain_id: "A" };
  box: {
    center: { x: number; y: number; z: number };
    size: { x: number; y: number; z: number };
  };
  poses: Array<{
    rank: number;
    vina_score_kcal_mol: number;
    rmsd_lower_bound: number | null;
    rmsd_upper_bound: number | null;
    pdbqt: string;
    sdf: string | null;
  }>;
  pose_pdbqt: string;
  pose_sdf: string | null;
  score_table: Array<{
    rank: number;
    vina_score_kcal_mol: number | null;
    rmsd_lower_bound: number | null;
    rmsd_upper_bound: number | null;
  }>;
  docking_log: string;
  assumptions: string[];
  warnings: string[];
  provenance: {
    engine: string;
    engine_version: string | null;
    preset: string;
    generated_at: string;
    receptor_artifact_id: string;
    receptor_pdbqt_sha256: string;
    ligand_artifact_id: string;
    ligand_pdbqt_sha256: string;
    pose_pdbqt_sha256: string;
    source_pdb_id: string;
    source_chain: string;
    site_definition: string;
    exhaustiveness: number;
    num_poses: number;
    seed: number;
    manifest_sha256: string;
  };
  manifest: Record<string, unknown>;
};

export async function runCuratedEgfrDockingLesson(
  request: DockingLessonRequest,
  signal?: AbortSignal,
): Promise<DockingLessonResult> {
  const timeoutController = new AbortController();
  const timeout = globalThis.setTimeout(() => timeoutController.abort(), 150_000);
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal;

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/docking/2ity/vina`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: combinedSignal,
    });
  } catch {
    if (timeoutController.signal.aborted) {
      throw new Error("The curated docking lesson took longer than expected. Please retry later.");
    }
    throw new Error("The calculation service is unavailable. Please wait a moment and retry.");
  } finally {
    globalThis.clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(body.detail ?? "The curated docking lesson could not be completed.");
  }

  return (await response.json()) as DockingLessonResult;
}
