import type { DrugDesign101ModuleId } from "@/data/drug-design-101-modules";
import type { CompoundCandidate } from "@/lib/compound-library";
import type { Experiment } from "@/lib/experiments/experiment-model";

export type ContextualCoaching = {
  observation: string;
  interpretation: string;
  prompt: string;
  boundary: string;
};

export function getContextualCoaching(
  moduleId: DrugDesign101ModuleId,
  experiment: Experiment,
  candidates: CompoundCandidate[],
): ContextualCoaching | null {
  const conformer = experiment.ligand?.conformer;
  switch (moduleId) {
    case "proteins-drug-targets": {
      const count = experiment.workflow.residuesInspected.length;
      if (!count) return null;
      const latest = experiment.workflow.residuesInspected[count - 1];
      return {
        observation: `You selected residue ${latest.chain}:${latest.residueNumber} in deposited 2ITY coordinates.`,
        interpretation: "The structure supports its chain, residue number, and observed atoms; the lesson explains its context separately.",
        prompt: "Which part came from coordinates, and which part came from curated teaching?",
        boundary: "Residue selection does not test a ligand or detect a binding pocket.",
      };
    }
    case "binding-pockets": {
      const curated = experiment.workflow.residuesInspected.find((item) =>
        [745, 788, 793].includes(item.residueNumber),
      );
      if (!curated) return null;
      return {
        observation: `You inspected ${curated.chain}:${curated.residueNumber}, one of the lesson's curated EGFR residues.`,
        interpretation: "It provides real structural context near the deposited ligand region, but no specific contact was calculated.",
        prompt: "What chemical evidence would you need before naming an interaction type?",
        boundary: "The pocket context is curated; it was not found automatically.",
      };
    }
    case "how-drugs-are-designed":
      if (!conformer || candidates.length === 0) return null;
      return {
        observation: `Your current conformer has molecular weight ${conformer.molecularWeight.toFixed(1)} Da and calculated cLogP ${conformer.logp.toFixed(2)}.`,
        interpretation: "These descriptors describe different aspects of the same candidate, so a change can create a tradeoff.",
        prompt: "Which one property would you change deliberately, and what else would you recheck?",
        boundary: "Descriptors do not establish activity, toxicity, efficacy, or clinical viability.",
      };
    case "molecular-docking": {
      const docking = experiment.target.dockingLesson;
      if (!docking) return null;
      const score = docking.scoreTable[0]?.vinaScoreKcalMol;
      return {
        observation: `Vina returned ${docking.scoreTable.length} poses${score == null ? "" : ` with a top model score of ${score.toFixed(2)} kcal/mol`}.`,
        interpretation: "The poses are alternative modeled placements ranked inside one curated run.",
        prompt: "Which uncertainty would you investigate before trusting this hypothesis?",
        boundary: "The Vina score is not measured affinity and does not prove binding or activity.",
      };
    }
    case "evaluating-candidates":
    case "design-challenge":
      if (candidates.length < 2) return null;
      return {
        observation: `You have ${candidates.length} valid saved candidates with calculated descriptor evidence.`,
        interpretation: "Their supported differences reveal tradeoffs; they do not create a universal ranking.",
        prompt: "What additional experiment would most reduce uncertainty in your choice?",
        boundary: "Compound Canvas does not infer toxicity, efficacy, safety, or a best drug.",
      };
    default:
      return null;
  }
}
