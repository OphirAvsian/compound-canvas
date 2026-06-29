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

export function dockingLessonReportFilename(experiment: Experiment) {
  return `compound-canvas-docking-lesson-report-${experiment.id}.txt`;
}

export function serializeDockingLessonReport(experiment: Experiment) {
  const ligandName = experiment.ligand?.name ?? "the selected molecule";
  const dockingLesson = experiment.target.dockingLesson;
  const topScore = dockingLesson?.scoreTable[0]?.vinaScoreKcalMol;
  const poseCount = dockingLesson?.scoreTable.length ?? 0;

  return [
    "Compound Canvas Docking Lesson Report",
    "======================================",
    "",
    `Project: ${experiment.title}`,
    `Molecule: ${ligandName}`,
    `Protein target: ${experiment.target.pdbId} (${experiment.target.name})`,
    `Generated: ${new Date(experiment.updatedAt).toLocaleString()}`,
    "",
    "1. What Vina did",
    dockingLesson
      ? `AutoDock Vina tested possible placements of the prepared ligand inside one curated EGFR teaching box. The box was centered on the deposited gefitinib site in 2ITY; Compound Canvas did not automatically detect a pocket.`
      : "No docking lesson result is recorded in this browser-local experiment.",
    "",
    "2. Why there are multiple poses",
    dockingLesson
      ? `The lesson requested ${poseCount} candidate poses so you can see that docking is a search through possible placements, not one guaranteed answer.`
      : "No pose table is available because the docking lesson has not been run.",
    "",
    "3. What the score means",
    dockingLesson
      ? `The top Vina model score was ${topScore?.toFixed(2) ?? "n/a"} kcal/mol. Within this one controlled run, more negative scores are often treated as more favorable model estimates.`
      : "No Vina score is available.",
    "",
    "4. What the score does NOT mean",
    "- It is not a measured binding affinity.",
    "- It is not proof that the molecule binds EGFR.",
    "- It is not an activity, safety, efficacy, or drug-candidacy prediction.",
    "- It should not be compared casually across unrelated proteins, boxes, or preparation methods.",
    "",
    "5. Why docking is not proof",
    "Docking uses simplified models of shape, charge, flexibility, water, and protonation. The real cell is more complicated. A docking estimate can help form a hypothesis, but experiments are needed to test it.",
    "",
    "6. What scientists would do next",
    "- Inspect the pose visually.",
    "- Check whether key contacts make chemical sense.",
    "- Compare against controls and known ligands.",
    "- Repeat calculations with carefully documented assumptions.",
    "- Test the hypothesis experimentally.",
    "",
    "7. Scientific honesty statement",
    "This report describes a curated educational docking estimate. It is not evidence that the molecule treats disease, binds EGFR in the lab, or has biological activity.",
    "",
  ].join("\n");
}

export function serializeStudentLearningReport(experiment: Experiment) {
  const ligandName = experiment.ligand?.name ?? "the selected molecule";
  const conformer = experiment.ligand?.conformer;
  const preparation = experiment.ligand?.preparation;
  const proteinCleanup = experiment.target.preparation;
  const receptorPreparation = experiment.target.receptorPreparation;
  const dockingLesson = experiment.target.dockingLesson;
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
    receptorPreparation
      ? `- Prepared a curated EGFR docking-input receptor artifact with ${receptorPreparation.protonationReport.hydrogensAdded} hydrogens added at pH ${receptorPreparation.protonationReport.assumedPh}.`
      : "- No docking-input receptor artifact was recorded.",
    dockingLesson
      ? `- Ran a curated AutoDock Vina docking lesson with a top Vina score of ${dockingLesson.scoreTable[0]?.vinaScoreKcalMol?.toFixed(2) ?? "n/a"} kcal/mol.`
      : "- No curated docking lesson was recorded.",
    "",
    "2. What this means",
    conformer
      ? `- RDKit converted the molecule into one plausible 3D shape (${conformer.molecularFormula}, ${conformer.molecularWeight.toFixed(2)} g/mol).`
      : "- No conformer was recorded in this browser-local report.",
    `- You inspected coordinate-backed EGFR evidence: ${residues}.`,
    preparation
      ? `- Ligand preparation added ${preparation.hydrogenReport.explicitHydrogensAdded} explicit hydrogens, recorded formal charge ${preparation.formalCharge}, and produced prepared SDF${preparation.pdbqtAvailable ? " plus PDBQT" : ""} artifacts.`
      : "- No ligand-preparation artifact was recorded in this browser-local report.",
    receptorPreparation
      ? `- Receptor preparation produced prepared receptor PDB and PDBQT files. The PDBQT is an input format for future docking, not a docking result.`
      : "- No receptor-preparation artifact was recorded in this browser-local report.",
    dockingLesson
      ? "- Docking placed the prepared ligand into a curated EGFR teaching box and returned approximate Vina pose scores. These are model estimates, not experimental binding measurements."
      : "- No docking estimate was recorded in this browser-local report.",
    dockingLesson
      ? `- The docking lesson returned ${dockingLesson.scoreTable.length} candidate poses so you could learn that docking is a search over possibilities, not one guaranteed answer.`
      : "",
    "",
    "3. What was NOT done",
    dockingLesson ? "- No experimental docking validation was performed." : "- No docking was run.",
    "- No binding prediction was made.",
    "- No measured affinity score was calculated.",
    "- No activity prediction was made.",
    dockingLesson
      ? "- The ligand was placed only into a curated computational teaching box, not experimentally observed in EGFR."
      : "- The ligand was not placed into EGFR by Compound Canvas.",
    receptorPreparation
      ? dockingLesson
        ? "- The docking estimate does not include interaction analysis, protein flexibility modeling, activity prediction, or medicinal chemistry ranking."
        : "- The receptor was prepared as a docking input, but it was not docked, scored, repaired, minimized, or tested against the ligand."
      : "- The receptor was not protonated, charged, repaired, or made docking-ready.",
    "",
    "4. Where this fits in real drug discovery",
    "Molecule design -> Structure generation -> Ligand preparation -> Receptor cleanup -> Docking-ready protein preparation -> Docking -> Experimental validation",
    "",
    proteinCleanup
      ? receptorPreparation
        ? dockingLesson
          ? "Compound Canvas created separate ligand, cleaned receptor, docking-input receptor, and curated docking estimate artifacts. Experimental validation remains a future step."
          : "Compound Canvas created separate ligand, cleaned receptor, and docking-input receptor artifacts. Docking and experimental validation remain future steps."
        : "Compound Canvas created separate ligand and cleaned receptor artifacts. Full protein preparation, docking, and experimental validation remain future steps."
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
