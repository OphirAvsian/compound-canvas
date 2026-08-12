"use client";

import {
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  GraduationCap,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { CompoundCanvasMark } from "@/components/brand/CompoundCanvasMark";
import { StatusBadge } from "@/components/ui/StatusBadge";

type DemoSceneId =
  | "landing"
  | "course"
  | "molecule"
  | "feedback"
  | "protein"
  | "pocket"
  | "preparation"
  | "docking"
  | "interpretation"
  | "evaluate"
  | "compare"
  | "challenge"
  | "sandbox"
  | "final";

type DemoScene = {
  id: DemoSceneId;
  kicker: string;
  title: string;
  subtitle: string;
  label: string;
  durationMs: number;
  focus: string;
};

const demoScenes: DemoScene[] = [
  {
    id: "landing",
    kicker: "Start here",
    title: "Learn drug design by doing it.",
    subtitle: "Choose a guided course or open the scientific tools directly.",
    label: "Real homepage tour",
    durationMs: 7000,
    focus: "Start Drug Design 101",
  },
  {
    id: "course",
    kicker: "Drug Design 101",
    title: "Learn, interact, use tools, get feedback.",
    subtitle: "The course moves from foundations to a final Design Challenge.",
    label: "Guided learning path",
    durationMs: 8500,
    focus: "Module 2",
  },
  {
    id: "molecule",
    kicker: "Molecule Lab",
    title: "Turn a structure into a computational 3D model.",
    subtitle: "Caffeine is shown with a precomputed example result for this demo.",
    label: "Example result shown for demo",
    durationMs: 10000,
    focus: "Generate 3D",
  },
  {
    id: "feedback",
    kicker: "Contextual learning",
    title: "Compound Canvas explains what just happened.",
    subtitle: "Feedback connects the real calculation to the science idea.",
    label: "Teaching feedback, not a new calculation",
    durationMs: 8000,
    focus: "Feedback",
  },
  {
    id: "protein",
    kicker: "Protein Lab",
    title: "Explore real protein structures.",
    subtitle: "EGFR PDB 2ITY provides coordinate-backed target context.",
    label: "Deposited coordinates",
    durationMs: 9500,
    focus: "Lys745",
  },
  {
    id: "pocket",
    kicker: "Binding context",
    title: "Learn where molecules may interact.",
    subtitle: "The pocket region is curated teaching context, not automatic detection.",
    label: "Curated teaching region",
    durationMs: 8500,
    focus: "Curated residues",
  },
  {
    id: "preparation",
    kicker: "Preparation",
    title: "Prepare inputs before docking.",
    subtitle: "Ligand and receptor preparation are documented as separate artifacts.",
    label: "Prepared for future/curated docking",
    durationMs: 9000,
    focus: "Ready to dock",
  },
  {
    id: "docking",
    kicker: "Docking lesson",
    title: "Docking searches possible poses.",
    subtitle: "The demo shows an example Vina result in the real result style.",
    label: "Docking estimate - not measured binding affinity",
    durationMs: 12000,
    focus: "Vina score",
  },
  {
    id: "interpretation",
    kicker: "Interpretation",
    title: "Numbers are not the end of the lesson.",
    subtitle: "Students practice what the score means, and what it does not mean.",
    label: "Misconception-aware feedback",
    durationMs: 8500,
    focus: "Not proof",
  },
  {
    id: "evaluate",
    kicker: "Candidate evidence",
    title: "Drug design is about balancing tradeoffs.",
    subtitle: "Descriptors help compare molecules without predicting viability.",
    label: "Calculated descriptors only",
    durationMs: 8500,
    focus: "Properties",
  },
  {
    id: "compare",
    kicker: "Library",
    title: "Save, compare, iterate.",
    subtitle: "Candidate differences are evidence for the next experiment, not a universal ranking.",
    label: "Comparison without a winner claim",
    durationMs: 9000,
    focus: "Compare",
  },
  {
    id: "challenge",
    kicker: "Design Challenge",
    title: "Learn the workflow. Then make the decisions yourself.",
    subtitle: "The final module asks learners to reason from evidence and limitations.",
    label: "Guided independence",
    durationMs: 8000,
    focus: "Design Challenge",
  },
  {
    id: "sandbox",
    kicker: "Sandbox",
    title: "Already know the basics? Use the tools directly.",
    subtitle: "Molecule, Protein, and Experiment workspaces remain open for exploration.",
    label: "Ungated scientific tools",
    durationMs: 7500,
    focus: "Molecule Lab",
  },
  {
    id: "final",
    kicker: "Compound Canvas",
    title: "Learn drug design by doing it.",
    subtitle: "Start guided, or open the scientific sandbox.",
    label: "Ready to begin",
    durationMs: 6500,
    focus: "Start",
  },
];

const totalDuration = demoScenes.reduce((sum, scene) => sum + scene.durationMs, 0);

export function ProductDemo({
  open,
  onClose,
  onStartDrugDesign101,
  onOpenSandbox,
}: {
  open: boolean;
  onClose: () => void;
  onStartDrugDesign101: () => void;
  onOpenSandbox: () => void;
}) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [elapsedInScene, setElapsedInScene] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSceneIndex(0);
    setElapsedInScene(0);
    setPlaying(true);
  }, [open]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!open || !playing) return;
    const interval = window.setInterval(() => {
      setElapsedInScene((current) => {
        const scene = demoScenes[sceneIndex];
        const step = reducedMotion ? scene.durationMs : 250;
        const next = current + step;
        if (next < scene.durationMs) return next;
        setSceneIndex((index) => Math.min(index + 1, demoScenes.length - 1));
        return 0;
      });
    }, reducedMotion ? 900 : 250);
    return () => window.clearInterval(interval);
  }, [open, playing, reducedMotion, sceneIndex]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === " ") {
        event.preventDefault();
        setPlaying((value) => !value);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  const scene = demoScenes[sceneIndex];
  const progressPercent = useMemo(() => {
    const elapsedBeforeScene = demoScenes
      .slice(0, sceneIndex)
      .reduce((sum, item) => sum + item.durationMs, 0);
    return Math.min(100, ((elapsedBeforeScene + elapsedInScene) / totalDuration) * 100);
  }, [elapsedInScene, sceneIndex]);

  if (!open) return null;

  const restart = () => {
    setSceneIndex(0);
    setElapsedInScene(0);
    setPlaying(true);
  };

  return (
    <div
      className="fixed inset-0 z-[90] overflow-hidden bg-[#f7f5ef] text-ink"
      role="dialog"
      aria-modal="true"
      aria-label="Compound Canvas product demo"
      data-testid="product-demo"
    >
      <div className="absolute inset-x-0 top-0 z-30 h-1 bg-[#d8d7d1]">
        <div className="h-full bg-[#39765b] transition-[width] duration-300" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="absolute left-3 right-3 top-4 z-30 flex items-center justify-between gap-3 rounded-2xl border border-[#d8d7d1] bg-[#fbfaf6]/92 px-3 py-2 shadow-[0_12px_34px_rgba(23,40,59,.1)] backdrop-blur md:left-6 md:right-6">
        <div className="flex min-w-0 items-center gap-2">
          <CompoundCanvasMark className="h-8 w-8 shrink-0 text-[#06265f]" />
          <span className="truncate text-sm font-semibold">Compound Canvas walkthrough</span>
          <span className="hidden text-xs text-[#65716b] sm:inline">Scene {sceneIndex + 1} / {demoScenes.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPlaying((value) => !value)}
            aria-label={playing ? "Pause product demo" : "Play product demo"}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#d8d7d1] bg-white px-3 text-sm font-semibold text-ink transition hover:bg-[#f2f5f0]"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span className="hidden sm:inline">{playing ? "Pause" : "Play"}</span>
          </button>
          <button
            type="button"
            onClick={restart}
            aria-label="Restart product demo"
            className="inline-flex min-h-10 w-10 items-center justify-center rounded-xl border border-[#d8d7d1] bg-white text-ink transition hover:bg-[#f2f5f0]"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Exit product demo"
            className="inline-flex min-h-10 w-10 items-center justify-center rounded-xl border border-[#d8d7d1] bg-white text-ink transition hover:bg-[#f2f5f0]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        key={scene.id}
        className={`product-tour-scene product-tour-scene-${scene.id} ${reducedMotion ? "product-demo-reduced" : ""}`}
      >
        <ProductTourFrame scene={scene.id} focus={scene.focus} />
        <NarrationRail
          scene={scene}
          onClose={onClose}
          onStartDrugDesign101={onStartDrugDesign101}
          onOpenSandbox={onOpenSandbox}
        />
      </div>

      <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between gap-4 rounded-full border border-[#d8d7d1] bg-[#fbfaf6]/90 px-4 py-2 text-xs font-medium text-[#65716b] shadow-sm backdrop-blur md:left-6 md:right-6">
        <span>{scene.focus}</span>
        <span>Silent demo - precomputed examples only</span>
      </div>
    </div>
  );
}

function NarrationRail({
  scene,
  onClose,
  onStartDrugDesign101,
  onOpenSandbox,
}: {
  scene: DemoScene;
  onClose: () => void;
  onStartDrugDesign101: () => void;
  onOpenSandbox: () => void;
}) {
  return (
    <div className={`product-tour-caption product-tour-caption-${scene.id}`}>
      <div className="min-w-0">
        <p className="product-tour-caption-kicker">{scene.kicker}</p>
        <h2>{scene.title}</h2>
        <p>{scene.subtitle}</p>
      </div>
      <div className="product-tour-caption-side">
        <span>{scene.label}</span>
        {scene.id === "final" && (
          <div className="product-tour-final-actions">
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartDrugDesign101();
              }}
            >
              Start Drug Design 101
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSandbox();
              }}
            >
              Open Sandbox
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductTourFrame({ scene, focus }: { scene: DemoSceneId; focus: string }) {
  return (
    <div className="product-tour-stage" aria-hidden="true">
      <div className="product-tour-browser">
        <DemoChrome focus={focus} />
        <div className="product-tour-content">
          {scene === "landing" && <LandingFrame />}
          {scene === "course" && <CourseFrame />}
          {(scene === "molecule" || scene === "feedback") && <MoleculeFrame feedback={scene === "feedback"} />}
          {(scene === "protein" || scene === "pocket") && <ProteinFrame pocket={scene === "pocket"} />}
          {scene === "preparation" && <PreparationFrame />}
          {(scene === "docking" || scene === "interpretation") && <DockingFrame interpretation={scene === "interpretation"} />}
          {scene === "evaluate" && <EvaluationFrame />}
          {scene === "compare" && <CompareFrame />}
          {scene === "challenge" && <ChallengeFrame />}
          {scene === "sandbox" && <SandboxFrame />}
          {scene === "final" && <FinalFrame />}
        </div>
        <div className="product-tour-cursor">
          <MousePointer2 className="h-5 w-5" />
        </div>
      </div>
      <div className="product-tour-spotlight" />
    </div>
  );
}

function DemoChrome({ focus }: { focus: string }) {
  return (
    <div className="product-tour-chrome">
      <div className="flex min-w-0 items-center gap-2">
        <CompoundCanvasMark className="h-7 w-7 shrink-0 text-[#06265f]" />
        <span className="truncate text-sm font-semibold">Compound Canvas</span>
      </div>
      <div className="hidden items-center gap-2 md:flex">
        <StatusBadge status="real">Guided beta</StatusBadge>
        <StatusBadge status="real">RDKit online</StatusBadge>
      </div>
      <span className="rounded-full bg-[#edf7f1] px-3 py-1 text-xs font-bold text-[#39765b]">{focus}</span>
    </div>
  );
}

function LandingFrame() {
  return (
    <div className="product-tour-landing">
      <CompoundCanvasMark className="h-20 w-20 text-[#06265f]" />
      <h3>Compound Canvas</h3>
      <p>Learn drug design by doing it.</p>
      <div className="grid gap-3 md:grid-cols-2">
        <DemoButton dark icon={<GraduationCap className="h-5 w-5" />} title="Start Drug Design 101" text="Structured learning path" />
        <DemoButton icon={<FlaskConical className="h-5 w-5" />} title="Open Sandbox" text="Use the tools directly" />
      </div>
      <button className="product-tour-demo-button">Watch Demo</button>
    </div>
  );
}

function CourseFrame() {
  const modules = [
    ["1", "What Is a Drug?", "complete"],
    ["2", "Molecules & 3D Shape", "active"],
    ["3", "Proteins & Drug Targets", "ready"],
    ["6", "Molecular Docking", "ready"],
    ["8", "Design Challenge", "locked"],
  ];
  return (
    <div className="product-tour-grid">
      <aside className="product-tour-sidebar">
        <p>Drug Design 101</p>
        <strong>2 / 8</strong>
        {modules.map(([number, title, state]) => (
          <div key={title} className={`product-tour-module module-${state}`}>
            <span>{number}</span>
            <p>{title}</p>
          </div>
        ))}
      </aside>
      <section className="product-tour-panel large">
        <p className="eyebrow">Module 2</p>
        <h3>Molecules & 3D Shape</h3>
        <div className="product-tour-demo-strip">
          <span>Learn</span>
          <ArrowRight className="h-4 w-4" />
          <span>Predict</span>
          <ArrowRight className="h-4 w-4" />
          <span>Run real tool</span>
          <ArrowRight className="h-4 w-4" />
          <span>Feedback</span>
        </div>
        <div className="product-tour-question">
          <p>What will Generate 3D change?</p>
          <strong>It gives the same atoms x, y, and z positions in space.</strong>
        </div>
      </section>
    </div>
  );
}

function MoleculeFrame({ feedback }: { feedback: boolean }) {
  return (
    <div className="product-tour-lab">
      <div className="product-tour-lab-header">
        <div>
          <p className="eyebrow">Molecule Lab - real workflow</p>
          <h3>Draw, calculate, optimize, and prepare a molecule</h3>
        </div>
        <StatusBadge status="real">Ketcher + RDKit + Mol*</StatusBadge>
      </div>
      <div className="product-tour-lab-grid">
        <div className="product-tour-card">
          <p className="eyebrow">2D caffeine</p>
          <MoleculeSketch />
          <button className="product-tour-primary">Generate 3D</button>
        </div>
        <div className="product-tour-card">
          <p className="eyebrow">3D conformer</p>
          <MoleculeModel />
          <div className="product-tour-properties">
            <Metric label="Formula" value="C8H10N4O2" />
            <Metric label="MW" value="194.19" />
            <Metric label="cLogP" value="-1.03" />
            <Metric label="HBD / HBA" value="0 / 3" />
          </div>
        </div>
        <div className="product-tour-card product-tour-feedback-card">
          {feedback ? (
            <>
              <p className="eyebrow">Contextual feedback</p>
              <h4>Your caffeine molecule now has 3D coordinates.</h4>
              <p>The calculation produced one plausible shape, not the only shape caffeine can adopt.</p>
            </>
          ) : (
            <>
              <p className="eyebrow">Example result</p>
              <h4>Precomputed demo result</h4>
              <p>No backend calculation is run inside this product tour.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProteinFrame({ pocket }: { pocket: boolean }) {
  return (
    <div className="product-tour-lab">
      <div className="product-tour-lab-header">
        <div>
          <p className="eyebrow">Protein Lab - coordinate-backed exploration</p>
          <h3>EGFR provides the biological context.</h3>
        </div>
        <StatusBadge status="real">PDB 2ITY</StatusBadge>
      </div>
      <div className="product-tour-protein-layout">
        <div className={`product-tour-protein-viewer ${pocket ? "pocket-mode" : ""}`}>
          <ProteinRibbon />
          <div className="product-tour-pocket-label">Curated teaching region</div>
        </div>
        <div className="product-tour-card">
          <p className="eyebrow">Residue inspector</p>
          <h4>{pocket ? "Met793" : "Lys745"}</h4>
          <Metric label="Chain" value="A" />
          <Metric label="Observed atoms" value={pocket ? "8" : "9"} />
          <p className="mt-3 text-sm leading-6 text-[#52635a]">
            Coordinate-derived identity is separated from curated beginner explanation.
          </p>
        </div>
      </div>
    </div>
  );
}

function PreparationFrame() {
  return (
    <div className="product-tour-lab">
      <div className="product-tour-lab-header">
        <div>
          <p className="eyebrow">Experiment workspace</p>
          <h3>Preparation creates documented artifacts.</h3>
        </div>
        <StatusBadge status="future">Not docked yet</StatusBadge>
      </div>
      <div className="product-tour-step-row">
        <PrepStep title="Ligand prepared" detail="Hydrogens, charge, conformer ensemble" />
        <PrepStep title="Receptor prepared" detail="Curated EGFR docking input" />
        <PrepStep title="Ready for docking lesson" detail="Inputs documented with provenance" />
      </div>
      <div className="product-tour-manifest">
        <span>Calculated</span>
        <span>Coordinate-derived</span>
        <span>Curated</span>
        <span>Experimental</span>
      </div>
    </div>
  );
}

function DockingFrame({ interpretation }: { interpretation: boolean }) {
  return (
    <div className="product-tour-lab">
      <div className="product-tour-lab-header">
        <div>
          <p className="eyebrow">Your first docking experiment</p>
          <h3>AutoDock Vina returns possible poses.</h3>
        </div>
        <StatusBadge status="real">Curated Vina run</StatusBadge>
      </div>
      <div className="product-tour-docking-grid">
        <div className="product-tour-docking-visual">
          <ProteinRibbon compact />
          <div className="product-tour-pose pose-a" />
          <div className="product-tour-pose pose-b" />
          <div className="product-tour-pose pose-final" />
          <span>Fixed box from deposited gefitinib context</span>
        </div>
        <div className="product-tour-card">
          <p className="eyebrow">Vina score table</p>
          <Metric label="Top pose" value="-5.37 kcal/mol" />
          <Metric label="Returned poses" value="5" />
          <p className="mt-3 rounded-xl bg-[#fff8e8] p-3 text-sm font-semibold text-[#7a5a1f]">
            Docking estimate - not measured binding affinity.
          </p>
        </div>
        {interpretation && (
          <div className="product-tour-card product-tour-feedback-card">
            <p className="eyebrow">Interpretation question</p>
            <h4>What does the score mean?</h4>
            <p>It ranks modeled poses inside this run. It does not prove binding or activity.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EvaluationFrame() {
  return (
    <div className="product-tour-lab">
      <div className="product-tour-lab-header">
        <div>
          <p className="eyebrow">Property evaluation</p>
          <h3>Evaluate evidence without overclaiming.</h3>
        </div>
        <StatusBadge status="real">RDKit descriptors</StatusBadge>
      </div>
      <div className="product-tour-property-grid">
        <PropertyBar label="Molecular weight" value="194.19" width="55%" />
        <PropertyBar label="cLogP" value="-1.03" width="35%" />
        <PropertyBar label="H-bond acceptors" value="3" width="48%" />
        <PropertyBar label="Flexibility" value="0 rotatable bonds" width="18%" />
      </div>
    </div>
  );
}

function CompareFrame() {
  return (
    <div className="product-tour-lab">
      <div className="product-tour-lab-header">
        <div>
          <p className="eyebrow">Compound Library</p>
          <h3>Save candidates and compare tradeoffs.</h3>
        </div>
        <StatusBadge status="real">Browser-local library</StatusBadge>
      </div>
      <div className="product-tour-compare-grid">
        <CandidateCard name="Candidate A" formula="C8H10N4O2" score="-5.37" note="Familiar example" />
        <CandidateCard name="Candidate B" formula="C9H12N4O2" score="-5.11" note="Different tradeoff" />
        <div className="product-tour-card">
          <p className="eyebrow">Comparison</p>
          <h4>No universal winner</h4>
          <p>Compare evidence, limits, and next experiments before deciding what to try.</p>
        </div>
      </div>
    </div>
  );
}

function ChallengeFrame() {
  return (
    <div className="product-tour-grid">
      <aside className="product-tour-sidebar">
        <p>Drug Design 101</p>
        <strong>8 / 8</strong>
        <div className="product-tour-module module-complete"><span>6</span><p>Molecular Docking</p></div>
        <div className="product-tour-module module-complete"><span>7</span><p>Evaluating Candidates</p></div>
        <div className="product-tour-module module-active"><span>8</span><p>Design Challenge</p></div>
      </aside>
      <section className="product-tour-panel large">
        <p className="eyebrow">Final module</p>
        <h3>Choose a candidate worth investigating further.</h3>
        <div className="product-tour-question">
          <p>Use descriptors, docking estimate, and limitations.</p>
          <strong>Worth testing next, not "best drug."</strong>
        </div>
      </section>
    </div>
  );
}

function SandboxFrame() {
  return (
    <div className="product-tour-lab">
      <div className="product-tour-lab-header">
        <div>
          <p className="eyebrow">Sandbox</p>
          <h3>Open the tools directly.</h3>
        </div>
        <StatusBadge status="neutral">Ungated mode</StatusBadge>
      </div>
      <div className="product-tour-tabs">
        <span className="active">Molecule Lab</span>
        <span>Protein Lab</span>
        <span>Experiment</span>
      </div>
      <div className="product-tour-step-row">
        <PrepStep title="Molecule" detail="Draw and generate 3D" />
        <PrepStep title="Protein" detail="Inspect coordinates" />
        <PrepStep title="Experiment" detail="Prepare, dock, interpret" />
      </div>
    </div>
  );
}

function FinalFrame() {
  return (
    <div className="product-tour-landing final">
      <CompoundCanvasMark className="h-24 w-24 text-[#06265f]" />
      <h3>Compound Canvas</h3>
      <p>Learn drug design by doing it.</p>
      <div className="grid gap-3 md:grid-cols-2">
        <DemoButton dark icon={<GraduationCap className="h-5 w-5" />} title="Start Drug Design 101" text="Beginner course" />
        <DemoButton icon={<FlaskConical className="h-5 w-5" />} title="Open Sandbox" text="Scientific tools" />
      </div>
    </div>
  );
}

function DemoButton({ dark, icon, title, text }: { dark?: boolean; icon: ReactNode; title: string; text: string }) {
  return (
    <div className={`product-tour-choice ${dark ? "dark" : ""}`}>
      <div className="flex items-center gap-2">
        {icon}
        <strong>{title}</strong>
      </div>
      <p>{text}</p>
    </div>
  );
}

function MoleculeSketch() {
  return (
    <svg viewBox="0 0 260 160" className="h-36 w-full">
      <g fill="none" stroke="#17283b" strokeWidth="5" strokeLinecap="round">
        <path d="M74 72 116 44 162 70 146 119 91 118Z" />
        <path d="M162 70 210 98" />
        <path d="M116 44 116 16" />
      </g>
      {[
        [74, 72, "C"],
        [116, 44, "N"],
        [162, 70, "O"],
        [146, 119, "N"],
        [91, 118, "C"],
        [210, 98, "C"],
      ].map(([x, y, atom]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="17" fill="#fbfaf6" stroke="#39765b" strokeWidth="3" />
          <text x={x} y={Number(y) + 5} textAnchor="middle" fill="#17283b" fontSize="16" fontWeight="800">{atom}</text>
        </g>
      ))}
    </svg>
  );
}

function MoleculeModel() {
  return (
    <div className="product-tour-model">
      {["C", "N", "O", "C", "N", "C"].map((atom, index) => (
        <span key={`${atom}-${index}`}>{atom}</span>
      ))}
    </div>
  );
}

function ProteinRibbon({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`product-tour-ribbon ${compact ? "compact" : ""}`}>
      {Array.from({ length: compact ? 7 : 12 }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="product-tour-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PrepStep({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="product-tour-prep-step">
      <CheckCircle2 className="h-5 w-5 text-[#39765b]" />
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  );
}

function PropertyBar({ label, value, width }: { label: string; value: string; width: string }) {
  return (
    <div className="product-tour-property">
      <div className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div><span style={{ width }} /></div>
    </div>
  );
}

function CandidateCard({ name, formula, score, note }: { name: string; formula: string; score: string; note: string }) {
  return (
    <div className="product-tour-card">
      <p className="eyebrow">{name}</p>
      <h4>{formula}</h4>
      <Metric label="Vina estimate" value={`${score} kcal/mol`} />
      <p className="mt-3 text-sm leading-6 text-[#52635a]">{note}</p>
    </div>
  );
}
