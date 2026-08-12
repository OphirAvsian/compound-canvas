"use client";

import { ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { LessonDecision } from "@/components/learning/LessonDecision";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getDrugDesign101Module, type DrugDesign101ModuleId } from "@/data/drug-design-101-modules";
import type { CompoundCandidate } from "@/lib/compound-library";
import type { Experiment } from "@/lib/experiments/experiment-model";
import type { DrugDesign101Progress, ModuleLearningProgress } from "@/lib/drug-design-101/progress";
import type { LessonDecisionOption } from "@/lib/lesson-interactions";
import { getContextualCoaching } from "@/lib/drug-design-101/coaching";

type AdvancedModuleId = Exclude<DrugDesign101ModuleId, "what-is-a-drug" | "molecules-3d-shape">;
type AppArea = "molecule" | "protein" | "experiment";

type ModuleLesson = {
  eyebrow: string;
  intro: string;
  concepts: Array<{ title: string; body: string }>;
  demoTitle: string;
  demoPrompt: string;
  demoSteps: string[];
  prediction: { title: string; prompt: string; options: LessonDecisionOption[]; boundary: string };
  assessment: { title: string; prompt: string; options: LessonDecisionOption[]; boundary: string };
  activityArea: AppArea;
  activityTitle: string;
  activityBody: string;
};

const lessons: Record<AdvancedModuleId, ModuleLesson> = {
  "proteins-drug-targets": {
    eyebrow: "From molecules to biology",
    intro: "Proteins are folded chains of amino acids. Their 3D shapes let them do jobs in cells, which makes many proteins useful drug targets.",
    concepts: [
      { title: "Primary", body: "The amino-acid sequence: the protein's letter-by-letter recipe." },
      { title: "Secondary", body: "Local patterns such as alpha helices and beta sheets." },
      { title: "Tertiary", body: "The full folded 3D structure formed by those connected regions." },
      { title: "EGFR", body: "A signaling protein used here as a real, curated teaching target." },
    ],
    demoTitle: "Unfold a protein's structure levels",
    demoPrompt: "Reveal how one amino-acid chain becomes a folded molecular machine.",
    demoSteps: ["Amino-acid sequence", "Helices and sheets", "Folded protein shape"],
    prediction: {
      title: "Why can protein shape matter to a molecule?",
      prompt: "Choose the explanation that connects structure to a testable drug-design hypothesis.",
      options: [
        { id: "shape-sites", label: "The folded shape creates regions where molecules may interact.", preferred: true, feedback: "Yes. Protein shape and chemistry create possible interaction sites." },
        { id: "all-same", label: "All proteins have the same shape, so the target does not matter.", feedback: "Proteins fold into different shapes and perform different jobs." },
        { id: "proof", label: "Seeing a protein structure proves a molecule binds it.", feedback: "Coordinates provide structural context, not proof of binding." },
      ],
      boundary: "This is curated teaching content. No binding calculation happens here.",
    },
    assessment: {
      title: "What did residue inspection establish?",
      prompt: "Interpret the evidence from the real 2ITY structure.",
      options: [
        { id: "coordinate-fact", label: "It identified an amino acid and its atoms in deposited coordinates.", preferred: true, feedback: "Exactly. Residue identity, chain, number, and observed atoms come from the structure." },
        { id: "activity-proof", label: "It proved that caffeine changes EGFR activity.", feedback: "Residue inspection does not test a ligand or biological activity." },
        { id: "automatic-pocket", label: "It automatically detected the best binding pocket.", feedback: "The lesson residues are curated; no automatic pocket detection was run." },
      ],
      boundary: "2ITY is experimental coordinate data. The plain-language explanation is curated.",
    },
    activityArea: "protein",
    activityTitle: "Inspect real EGFR coordinates",
    activityBody: "Open Protein Lab, let 2ITY load, then select at least one real residue. Return here to interpret what you observed.",
  },
  "binding-pockets": {
    eyebrow: "Where molecules may interact",
    intro: "A binding pocket is a shaped region on a protein. A ligand may fit there through both geometry and chemistry, not shape alone.",
    concepts: [
      { title: "Hydrogen bonding", body: "Directional attraction involving suitable donors and acceptors." },
      { title: "Hydrophobic contact", body: "Nonpolar surfaces can prefer contact away from water." },
      { title: "Electrostatics", body: "Opposite charges attract; like charges repel." },
      { title: "Other close contacts", body: "Pi and van der Waals effects can also contribute when geometry supports them." },
    ],
    demoTitle: "Find the curated teaching region",
    demoPrompt: "Advance from the protein surface to the author-selected EGFR pocket context.",
    demoSteps: ["Protein surface", "Curated pocket region", "Nearby teaching residues"],
    prediction: {
      title: "What makes a pocket potentially relevant?",
      prompt: "Pick the answer that keeps shape and chemistry together.",
      options: [
        { id: "shape-chemistry", label: "Its shape and chemical environment may complement a ligand.", preferred: true, feedback: "Right. Both geometry and chemical groups influence plausible placement." },
        { id: "largest-hole", label: "The largest visible hole is always the best drug site.", feedback: "Size alone cannot establish biological relevance or chemical compatibility." },
        { id: "manual-docking", label: "Dragging a ligand into it counts as docking.", feedback: "Manual placement is an illustration. Docking software performs a computational search." },
      ],
      boundary: "The highlighted 2ITY region is curated, not automatically detected.",
    },
    assessment: {
      title: "Which interaction claim is safe?",
      prompt: "Use only evidence Compound Canvas actually has at this step.",
      options: [
        { id: "context-only", label: "These residues provide curated pocket context, but specific ligand contacts were not calculated.", preferred: true, feedback: "Correct. Context is useful without inventing interaction types." },
        { id: "hbond-proven", label: "Every nearby oxygen forms a hydrogen bond.", feedback: "Hydrogen bonds require suitable geometry and chemistry; proximity alone is not enough." },
        { id: "binding-proven", label: "A molecule shown in the pocket must bind in an experiment.", feedback: "A visual placement is not experimental binding evidence." },
      ],
      boundary: "No interaction detection, affinity prediction, or biological test is performed.",
    },
    activityArea: "protein",
    activityTitle: "Revisit the real EGFR pocket context",
    activityBody: "Inspect Lys745, Leu788, or Met793 in 2ITY. These residues were selected by the lesson author, not by pocket-detection software.",
  },
  "how-drugs-are-designed": {
    eyebrow: "The design cycle",
    intro: "Drug design is an iterative loop: design, predict, test, learn, modify, and repeat. A useful change can improve one property while worsening another.",
    concepts: [
      { title: "Design", body: "Choose a molecular change for a clear reason." },
      { title: "Predict", body: "Use computation to form a hypothesis, not a verdict." },
      { title: "Test", body: "Compare the hypothesis with calculations and ultimately experiments." },
      { title: "Learn and modify", body: "Use the evidence to choose the next change." },
    ],
    demoTitle: "Follow one design iteration",
    demoPrompt: "Step through a simplified cycle without changing your saved experiment.",
    demoSteps: ["Add a polar group", "Check changed properties", "Choose the next question"],
    prediction: {
      title: "A modification lowers cLogP but raises molecular weight. What happened?",
      prompt: "Choose the strongest scientific interpretation.",
      options: [
        { id: "tradeoff", label: "The change created a tradeoff that needs more investigation.", preferred: true, feedback: "Exactly. Medicinal chemistry balances several properties rather than maximizing one." },
        { id: "winner", label: "The molecule is now definitely a better drug.", feedback: "One favorable descriptor change cannot establish overall drug quality." },
        { id: "failure", label: "Any property tradeoff means the design failed.", feedback: "Tradeoffs are normal. The next experiment should clarify which balance matters." },
      ],
      boundary: "This example is illustrative. Your real descriptors appear in Experiment after Generate 3D.",
    },
    assessment: {
      title: "What should a scientist do next?",
      prompt: "One metric improved and another moved in an uncertain direction.",
      options: [
        { id: "next-question", label: "Record the tradeoff and choose a focused next calculation or experiment.", preferred: true, feedback: "Good reasoning. An explicit next question keeps the design loop evidence-driven." },
        { id: "declare-drug", label: "Declare the candidate a drug because one number improved.", feedback: "Descriptors do not prove viability, safety, efficacy, or activity." },
        { id: "ignore", label: "Ignore the other property because it is inconvenient.", feedback: "Ignoring conflicting evidence hides the very tradeoff the design cycle should investigate." },
      ],
      boundary: "Computed properties support hypotheses; they do not replace laboratory evidence.",
    },
    activityArea: "experiment",
    activityTitle: "Evaluate and save a real candidate",
    activityBody: "Open Experiment to inspect the calculated descriptors from your conformer and save at least one candidate in this browser.",
  },
  "molecular-docking": {
    eyebrow: "A computational search",
    intro: "Docking searches many possible ligand poses inside a defined receptor region and scores the modeled placements using simplifying assumptions.",
    concepts: [
      { title: "Ligand", body: "The prepared molecule being positioned." },
      { title: "Receptor", body: "The prepared protein input." },
      { title: "Pose", body: "One predicted placement and orientation." },
      { title: "Score", body: "A model value used to rank poses within this controlled run." },
    ],
    demoTitle: "Watch a docking search concept",
    demoPrompt: "Advance through manual placement, computational search, and alternative pose estimates.",
    demoSteps: ["Ligand near pocket", "Search orientations", "Rank five pose estimates"],
    prediction: {
      title: "What is different about real docking?",
      prompt: "Compare manual placement with the computational lesson.",
      options: [
        { id: "search", label: "Docking searches many placements and scores modeled poses.", preferred: true, feedback: "Yes. Manual movement teaches the idea; Vina performs the actual search." },
        { id: "trajectory", label: "Docking simulates the physical path a ligand takes through the body.", feedback: "Docking is not molecular dynamics and does not calculate a physical arrival trajectory." },
        { id: "proof", label: "Docking proves the ligand binds and works in cells.", feedback: "A docking estimate is not measured binding, activity, efficacy, or safety." },
      ],
      boundary: "The demo is illustrative. The real activity uses the existing curated 2ITY AutoDock Vina workflow.",
    },
    assessment: {
      title: "How should the Vina score be read?",
      prompt: "Choose the interpretation that matches the calculation's limits.",
      options: [
        { id: "within-run", label: "It helps rank poses within this controlled docking run, with uncertainty.", preferred: true, feedback: "Correct. Lower scores here are model rankings, not measured affinity." },
        { id: "affinity", label: "It is the experimentally measured binding affinity.", feedback: "Vina scores are calculated estimates, not experimental affinity measurements." },
        { id: "drug", label: "The lowest score identifies the best drug.", feedback: "Docking cannot establish activity, safety, efficacy, or overall candidate quality." },
      ],
      boundary: "Caffeine is an educational example, not an EGFR inhibitor candidate.",
    },
    activityArea: "experiment",
    activityTitle: "Run the real curated docking lesson",
    activityBody: "Prepare the ligand and curated receptor, then run AutoDock Vina in Experiment. The fixed box comes from deposited gefitinib context, not automatic pocket detection.",
  },
  "evaluating-candidates": {
    eyebrow: "No single-number winner",
    intro: "Candidate evaluation compares multiple measured or calculated properties. Molecular weight, lipophilicity, hydrogen bonding, and flexibility each tell only part of the story.",
    concepts: [
      { title: "Molecular weight", body: "A size measure, not a quality score." },
      { title: "cLogP", body: "A calculated oily-versus-watery preference estimate." },
      { title: "H-bond counts", body: "Potential donor and acceptor groups, not guaranteed protein interactions." },
      { title: "Rotatable bonds", body: "A simple clue about molecular flexibility." },
    ],
    demoTitle: "Compare one tradeoff at a time",
    demoPrompt: "Reveal how two candidates can differ without declaring a universal winner.",
    demoSteps: ["Compare size", "Compare lipophilicity", "Choose the next test"],
    prediction: {
      title: "Candidate A is lighter; Candidate B has lower cLogP. Which is better?",
      prompt: "Choose the answer a careful scientist would give.",
      options: [
        { id: "depends", label: "It depends on the design goal and other evidence; compare the tradeoff.", preferred: true, feedback: "Exactly. Both observations can matter, and neither defines a universal winner." },
        { id: "lighter", label: "Candidate A is automatically better because it is lighter.", feedback: "Lower molecular weight can help some goals but does not settle the whole decision." },
        { id: "logp", label: "Candidate B is automatically better because its cLogP is lower.", feedback: "Lipophilicity needs balance; lower is not always better." },
      ],
      boundary: "Compound Canvas does not predict toxicity, permeability, efficacy, hERG, or full ADMET.",
    },
    assessment: {
      title: "What does a fair comparison conclude?",
      prompt: "You have real descriptor differences for two saved candidates.",
      options: [
        { id: "evidence-next", label: "Describe supported differences and name the next evidence needed.", preferred: true, feedback: "Good. A comparison should expose tradeoffs and uncertainty, not manufacture a winner." },
        { id: "one-number", label: "Choose whichever candidate wins one preferred number.", feedback: "One descriptor cannot represent the full biological and chemical problem." },
        { id: "clinical", label: "Use these descriptors to predict which candidate will succeed clinically.", feedback: "These descriptors cannot predict clinical efficacy or safety." },
      ],
      boundary: "The comparison uses real calculated descriptors but offers curated interpretation.",
    },
    activityArea: "experiment",
    activityTitle: "Save and compare two real candidates",
    activityBody: "Use Compound Library to save two conformer-backed candidates, then inspect the supported descriptor differences. No universal winner is declared.",
  },
  "design-challenge": {
    eyebrow: "Final evidence challenge",
    intro: "Your team is investigating EGFR and must choose which saved candidate is worth investigating further. You are selecting a hypothesis, not creating a drug.",
    concepts: [
      { title: "Structure", body: "Use a real conformer and explicit preparation artifacts." },
      { title: "Target context", body: "Use real 2ITY coordinates and curated pocket context." },
      { title: "Model evidence", body: "Treat docking and descriptors as limited computational evidence." },
      { title: "Decision", body: "Choose a candidate and state what should be tested next." },
    ],
    demoTitle: "Assemble an evidence chain",
    demoPrompt: "Review the minimum evidence before making a cautious recommendation.",
    demoSteps: ["Molecule and target", "Preparation and docking", "Properties and limitations"],
    prediction: {
      title: "What is the goal of this challenge?",
      prompt: "Choose the honest decision your team can make with these tools.",
      options: [
        { id: "investigate", label: "Select a candidate worth investigating further and explain why.", preferred: true, feedback: "Correct. This is a next-experiment decision, not a drug approval decision." },
        { id: "create-drug", label: "Prove that you created a safe and effective drug.", feedback: "The workflow cannot establish safety, efficacy, or clinical usefulness." },
        { id: "score-winner", label: "Pick the lowest docking score and ignore all other evidence.", feedback: "A docking score is one uncertain model output, not a complete decision rule." },
      ],
      boundary: "The challenge summarizes existing evidence. It adds no new scientific calculation.",
    },
    assessment: {
      title: "What makes your final recommendation scientific?",
      prompt: "Choose the reasoning pattern that preserves uncertainty.",
      options: [
        { id: "reason-limits-next", label: "Use supported evidence, name tradeoffs and limitations, then propose a next experiment.", preferred: true, feedback: "Exactly. A defensible hypothesis states both its evidence and what remains unknown." },
        { id: "certainty", label: "Describe the selected candidate as an effective EGFR drug.", feedback: "That claim would require extensive experimental and clinical evidence." },
        { id: "hide-conflict", label: "Leave out evidence that does not support the choice.", feedback: "Scientific reasoning must acknowledge conflicting evidence and uncertainty." },
      ],
      boundary: "Completion demonstrates interpretation of this educational workflow, not professional or clinical qualification.",
    },
    activityArea: "experiment",
    activityTitle: "Choose a candidate worth investigating further",
    activityBody: "Review two saved candidates, the curated docking estimate, calculated descriptors, and known limitations. Select one candidate below and explain the kind of reasoning you used.",
  },
};

function realActivityState(moduleId: AdvancedModuleId, experiment: Experiment, candidates: CompoundCandidate[]) {
  const workflow = experiment.workflow;
  switch (moduleId) {
    case "proteins-drug-targets":
      return { ready: workflow.proteinCoordinatesLoaded.status === "complete" && workflow.residuesInspected.length > 0, detail: `${workflow.residuesInspected.length} coordinate-backed residue${workflow.residuesInspected.length === 1 ? "" : "s"} inspected` };
    case "binding-pockets":
      return { ready: workflow.residuesInspected.some((item) => [745, 788, 793].includes(item.residueNumber)), detail: "Inspect Lys745, Leu788, or Met793 in the curated 2ITY lesson" };
    case "how-drugs-are-designed":
      return { ready: Boolean(experiment.ligand?.conformer) && candidates.length > 0, detail: `${candidates.length} conformer-backed candidate${candidates.length === 1 ? "" : "s"} saved` };
    case "molecular-docking":
      return { ready: workflow.ligandPrepared.status === "complete" && workflow.receptorPrepared.status === "complete" && workflow.dockingLessonRun.status === "complete", detail: workflow.dockingLessonRun.status === "complete" ? "Curated AutoDock Vina estimate recorded" : "Ligand, receptor, and docking evidence still needed" };
    case "evaluating-candidates":
      return { ready: candidates.length >= 2, detail: `${candidates.length} valid candidate${candidates.length === 1 ? "" : "s"} saved for comparison` };
    case "design-challenge":
      return { ready: candidates.length >= 2 && workflow.dockingLessonRun.status === "complete", detail: "Two candidates plus curated docking evidence are available" };
  }
}

export function DrugDesign101AdvancedModule({
  moduleId,
  progress,
  experiment,
  candidates,
  onUpdate,
  onComplete,
  onNavigate,
}: {
  moduleId: AdvancedModuleId;
  progress: DrugDesign101Progress;
  experiment: Experiment;
  candidates: CompoundCandidate[];
  onUpdate: (update: Partial<ModuleLearningProgress>) => void;
  onComplete: () => void;
  onNavigate: (area: AppArea) => void;
}) {
  const module = getDrugDesign101Module(moduleId)!;
  const lesson = lessons[moduleId];
  const learning = progress.moduleLearning[moduleId] ?? { demoStep: 0 };
  const evidence = realActivityState(moduleId, experiment, candidates);
  const coaching = getContextualCoaching(moduleId, experiment, candidates);
  const assessmentCorrect = lesson.assessment.options.find((item) => item.id === learning.assessmentAnswerId)?.preferred;
  const predictionCorrect = lesson.prediction.options.find((item) => item.id === learning.predictionAnswerId)?.preferred;
  const challengeCandidateSelected = moduleId !== "design-challenge" || Boolean(learning.selectedCandidateId);
  const canComplete = Boolean(assessmentCorrect && evidence.ready && challengeCandidateSelected);

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-[#d9d8d2] bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="neutral">Module {module.number} of 8</StatusBadge>
          <StatusBadge status={evidence.ready ? "real" : "neutral"}>{evidence.ready ? "Real activity recorded" : lesson.eyebrow}</StatusBadge>
        </div>
        <h2 className="mt-4 text-[34px] font-semibold leading-tight tracking-[-0.055em] text-ink md:text-[48px]">{module.title}</h2>
        <p className="mt-3 max-w-3xl text-[18px] leading-8 text-[#52635a]">{lesson.intro}</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {lesson.concepts.map((concept, index) => (
          <article key={concept.title} className="rounded-3xl border border-[#deddd7] bg-white p-4 shadow-sm">
            <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#39765b]">Concept {index + 1}</span>
            <h3 className="mt-2 text-[19px] font-semibold text-ink">{concept.title}</h3>
            <p className="mt-2 text-[14px] leading-7 text-[#52635a]">{concept.body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[2rem] border border-[#d9d8d2] bg-white p-5 shadow-sm md:p-6">
        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#39765b]">Interactive demo</p>
        <h3 className="mt-2 text-[24px] font-semibold tracking-[-0.04em]">{lesson.demoTitle}</h3>
        <p className="mt-2 text-[15px] leading-7 text-[#52635a]">{lesson.demoPrompt}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {lesson.demoSteps.map((step, index) => (
            <div key={step} className={`rounded-2xl border p-4 text-[14px] font-semibold transition ${index <= learning.demoStep ? "border-[#86bda1] bg-[#f0faf4] text-[#2f6f54]" : "border-[#e1e0da] bg-[#f7f6f1] text-[#89918d]"}`}>
              <span className="mr-2 text-[12px]">{index + 1}</span>{step}
            </div>
          ))}
        </div>
        <button type="button" disabled={learning.demoStep >= 2} onClick={() => onUpdate({ demoStep: learning.demoStep + 1 })} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-[14px] font-semibold text-white disabled:bg-[#8c9791]">
          {learning.demoStep >= 2 ? "Demo complete" : "Show next idea"}<ArrowRight className="h-4 w-4" />
        </button>
        <p className="mt-3 text-[12px] leading-6 text-[#68736d]">Illustrative teaching sequence only. It does not mutate your experiment or simulate molecular dynamics.</p>
      </section>

      <LessonDecision {...lesson.prediction} selectedId={learning.predictionAnswerId ?? null} onSelect={(predictionAnswerId) => onUpdate({ predictionAnswerId: predictionAnswerId ?? undefined })} />

      <section className="rounded-[2rem] border border-[#d9d8d2] bg-[#fbfaf6] p-5 shadow-sm md:p-6">
        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#39765b]">Real activity</p>
        <h3 className="mt-2 text-[24px] font-semibold tracking-[-0.04em]">{lesson.activityTitle}</h3>
        <p className="mt-2 max-w-3xl text-[15px] leading-7 text-[#52635a]">{lesson.activityBody}</p>
        <div className={`mt-4 rounded-2xl border p-4 text-[14px] leading-6 ${evidence.ready ? "border-[#b7d9c7] bg-[#f0faf4] text-[#2f6f54]" : "border-[#deddd7] bg-white text-[#65716b]"}`}>
          <strong>{evidence.ready ? "Evidence recorded: " : "Still needed: "}</strong>{evidence.detail}
        </div>
        {coaching && (
          <div className="mt-4 grid gap-2 rounded-2xl border border-[#cfdcd4] bg-white p-4 text-[13px] leading-6 text-[#52635a] sm:grid-cols-2">
            <p><strong className="text-ink">Observation:</strong> {coaching.observation}</p>
            <p><strong className="text-ink">Interpretation:</strong> {coaching.interpretation}</p>
            <p><strong className="text-ink">Next question:</strong> {coaching.prompt}</p>
            <p><strong className="text-ink">Boundary:</strong> {coaching.boundary}</p>
          </div>
        )}
        {moduleId === "design-challenge" && candidates.length > 0 && (
          <div className="mt-4">
            <p className="text-[13px] font-semibold text-ink">Candidate worth investigating further</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {candidates.map((candidate) => (
                <button key={candidate.id} type="button" aria-pressed={learning.selectedCandidateId === candidate.id} onClick={() => onUpdate({ selectedCandidateId: candidate.id })} className={`min-h-12 rounded-xl border px-4 py-3 text-left text-[14px] ${learning.selectedCandidateId === candidate.id ? "border-[#79b999] bg-[#f0faf4]" : "border-[#deddd7] bg-white"}`}>
                  <strong>{candidate.name}</strong><span className="block text-[12px] text-[#65716b]">{candidate.descriptors.length} calculated descriptors; {candidate.dockingEstimate ? "saved Vina estimate" : "no matching docking estimate"}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <button type="button" onClick={() => onNavigate(lesson.activityArea)} disabled={!predictionCorrect} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#aab1ad]">
          Open {lesson.activityArea === "protein" ? "Protein Lab" : "Experiment"}<ArrowRight className="h-4 w-4" />
        </button>
      </section>

      <LessonDecision {...lesson.assessment} selectedId={learning.assessmentAnswerId ?? null} onSelect={(assessmentAnswerId) => onUpdate({ assessmentAnswerId: assessmentAnswerId ?? undefined })} />

      <section className="rounded-[2rem] border border-[#b7d9c7] bg-[#f0faf4] p-5 shadow-sm md:p-6">
        <div className="flex items-start gap-3">
          {canComplete ? <CheckCircle2 className="mt-1 h-5 w-5 text-[#2f7659]" /> : <RotateCcw className="mt-1 h-5 w-5 text-[#65716b]" />}
          <div>
            <h3 className="text-[20px] font-semibold">{canComplete ? "Ready to complete this module" : "Complete the real activity and interpretation check"}</h3>
            <p className="mt-1 text-[14px] leading-7 text-[#52635a]">Progress records evidence, not page visits. Sandbox remains available independently.</p>
          </div>
        </div>
        <button type="button" onClick={onComplete} disabled={!canComplete} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#9ba59f]">
          Complete Module {module.number}<ArrowRight className="h-4 w-4" />
        </button>
      </section>
    </div>
  );
}

export function DrugDesign101WorkspaceCoach({
  progress,
  experiment,
  candidates,
  area,
  onReturn,
}: {
  progress: DrugDesign101Progress;
  experiment: Experiment;
  candidates: CompoundCandidate[];
  area: AppArea;
  onReturn: () => void;
}) {
  const moduleId = progress.activeModuleId;
  if (moduleId === "what-is-a-drug" || moduleId === "molecules-3d-shape") return null;
  const lesson = lessons[moduleId];
  if (lesson.activityArea !== area) return null;
  const evidence = realActivityState(moduleId, experiment, candidates);
  const coaching = getContextualCoaching(moduleId, experiment, candidates);
  return (
    <section className="border-b border-[#b7d9c7] bg-[#f0faf4] px-4 py-5 md:px-6">
      <div className="mx-auto flex max-w-[1180px] flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#39765b]">Drug Design 101 - Module {getDrugDesign101Module(moduleId)?.number} real activity</p>
          <h2 className="mt-1 text-[20px] font-semibold">{evidence.ready ? "Required evidence recorded" : lesson.activityTitle}</h2>
          <p className="mt-1 max-w-3xl text-[14px] leading-6 text-[#52635a]">{evidence.ready ? `${evidence.detail}. ${coaching?.interpretation ?? "Return to the course for interpretation and assessment."}` : lesson.activityBody}</p>
        </div>
        <button type="button" onClick={onReturn} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-[#8ebba3] bg-white px-4 py-2 text-[13px] font-semibold text-[#2f6f54]">Return to course</button>
      </div>
    </section>
  );
}
