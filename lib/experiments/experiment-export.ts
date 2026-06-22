import type { Experiment } from "./experiment-model";

export function serializeExperimentSummary(experiment: Experiment) {
  return JSON.stringify(experiment, null, 2);
}

export function experimentFilename(experiment: Experiment) {
  return `compound-canvas-${experiment.id}.json`;
}

export function isBeginnerWorkflowComplete(experiment: Experiment) {
  return Boolean(
    experiment.target.kind === "curated" &&
      experiment.target.pdbId === "2ITY" &&
      experiment.workflow.conformerGenerated.status === "complete" &&
      experiment.workflow.ligandPrepared.status === "complete" &&
      experiment.workflow.proteinCoordinatesLoaded.status === "complete" &&
      experiment.workflow.residuesInspected.length > 0,
  );
}

export function studentReportFilename(experiment: Experiment) {
  return `compound-canvas-learning-report-${experiment.id}.txt`;
}

export function serializeStudentLearningReport(experiment: Experiment) {
  const ligandName = experiment.ligand?.name ?? "the selected molecule";
  const conformer = experiment.ligand?.conformer;
  const preparation = experiment.ligand?.preparation;
  const proteinCleanup = experiment.target.preparation;
  const residues =
    experiment.workflow.residuesInspected.length > 0
      ? experiment.workflow.residuesInspected
          .map((residue) => `${residue.chain}:${residue.residueNumber}`)
          .join(", ")
      : "none recorded";

  return [
    "Compound Canvas Beginner Results Report",
    "=======================================",
    "",
    `Project: ${experiment.title}`,
    `Molecule: ${ligandName}`,
    `Protein target: ${experiment.target.pdbId} (${experiment.target.name})`,
    `Generated: ${new Date(experiment.updatedAt).toLocaleString()}`,
    "",
    "1. What you did",
    "- Generated a real 3D conformer with RDKit.",
    "- Explored a real EGFR protein structure from 2ITY.",
    "- Prepared a ligand artifact for future docking.",
    proteinCleanup
      ? `- Cleaned EGFR 2ITY Chain A into a receptor precursor containing ${proteinCleanup.selectionReport.retainedResidueCount} residues and ${proteinCleanup.selectionReport.retainedAtomCount} deposited atoms.`
      : "- No receptor-cleanup artifact was recorded.",
    "",
    "2. What this means",
    conformer
      ? `- RDKit converted the molecule into one plausible 3D shape (${conformer.molecularFormula}, ${conformer.molecularWeight.toFixed(2)} g/mol).`
      : "- No conformer was recorded in this browser-local report.",
    `- You inspected coordinate-backed EGFR evidence: ${residues}.`,
    preparation
      ? `- Ligand preparation added ${preparation.hydrogenReport.explicitHydrogensAdded} explicit hydrogens, recorded formal charge ${preparation.formalCharge}, and produced prepared SDF${preparation.pdbqtAvailable ? " plus PDBQT" : ""} artifacts.`
      : "- No ligand-preparation artifact was recorded in this browser-local report.",
    "",
    "3. What was NOT done",
    "- No docking was run.",
    "- No binding prediction was made.",
    "- No affinity score was calculated.",
    "- No activity prediction was made.",
    "- The ligand was not placed into EGFR by Compound Canvas.",
    "- The receptor was not protonated, charged, repaired, or made docking-ready.",
    "",
    "4. Where this fits in real drug discovery",
    "Molecule design -> Structure generation -> Ligand preparation -> Receptor cleanup -> Docking-ready protein preparation -> Docking -> Experimental validation",
    "",
    proteinCleanup
      ? "Compound Canvas created separate ligand and cleaned receptor artifacts. Full protein preparation, docking, and experimental validation remain future steps."
      : "Protein cleanup, full protein preparation, docking, and experimental validation remain future steps.",
    "",
    "5. Why caffeine was used",
    "- Caffeine is familiar and small enough for a fast beginner workflow.",
    "- It is an educational example for learning molecular structure.",
    "- It is not being presented as an EGFR drug candidate.",
    "",
    "6. Scientific honesty statement",
    "This report describes learning actions and generated artifacts. It is not evidence that the molecule treats disease, binds EGFR, or has biological activity.",
    "",
  ].join("\n");
}
