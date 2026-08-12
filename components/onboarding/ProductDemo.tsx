"use client";

import { Pause, Play, RotateCcw, X } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { CompoundCanvasMark } from "@/components/brand/CompoundCanvasMark";

type DemoSceneId =
  | "hook"
  | "molecule"
  | "protein"
  | "pocket"
  | "docking"
  | "evaluate"
  | "compare"
  | "learn"
  | "final";

type DemoScene = {
  id: DemoSceneId;
  kicker: string;
  title: string;
  subtitle: string;
  label: string;
  durationMs: number;
};

const demoScenes: DemoScene[] = [
  {
    id: "hook",
    kicker: "Compound Canvas",
    title: "What if you could learn drug design by actually doing it?",
    subtitle: "A guided scientific workspace for molecules, proteins, docking lessons, and evidence.",
    label: "Product trailer",
    durationMs: 7000,
  },
  {
    id: "molecule",
    kicker: "Start with a molecule",
    title: "2D structure becomes a 3D conformer.",
    subtitle: "Example caffeine conformer shown as a precomputed demo result.",
    label: "Example/precomputed conformer",
    durationMs: 9000,
  },
  {
    id: "protein",
    kicker: "Meet the protein",
    title: "Explore real protein structures.",
    subtitle: "EGFR · PDB 2ITY · deposited coordinate data.",
    label: "Coordinate-backed structure",
    durationMs: 9000,
  },
  {
    id: "pocket",
    kicker: "Binding pocket",
    title: "Find where molecules may interact.",
    subtitle: "This region is curated teaching context, not automated pocket detection.",
    label: "Curated teaching region",
    durationMs: 8000,
  },
  {
    id: "docking",
    kicker: "Docking lesson",
    title: "Docking searches possible poses.",
    subtitle: "It estimates how a molecule could fit inside a binding site.",
    label: "Vina estimate: -5.37 kcal/mol · not measured affinity",
    durationMs: 14000,
  },
  {
    id: "evaluate",
    kicker: "Evaluate the candidate",
    title: "A promising candidate is more than one score.",
    subtitle: "Drug design is about tradeoffs across calculated molecular properties.",
    label: "Descriptor evidence, not ADMET or toxicity prediction",
    durationMs: 9000,
  },
  {
    id: "compare",
    kicker: "Compare and iterate",
    title: "Design. Test. Compare. Iterate.",
    subtitle: "Compare candidates without declaring a universal winner.",
    label: "Evidence-guided comparison",
    durationMs: 9000,
  },
  {
    id: "learn",
    kicker: "Learn while doing",
    title: "Use the tools and learn the science at the same time.",
    subtitle: "Start guided. Explore freely.",
    label: "Drug Design 101 + Sandbox",
    durationMs: 9000,
  },
  {
    id: "final",
    kicker: "Compound Canvas",
    title: "Learn drug design by doing it.",
    subtitle: "Begin with Drug Design 101 or open the scientific Sandbox.",
    label: "Ready to start",
    durationMs: 7000,
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
      className="fixed inset-0 z-[90] overflow-hidden bg-[#071522] text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Compound Canvas product demo"
      data-testid="product-demo"
    >
      <div className="absolute inset-x-0 top-0 z-20 h-1 bg-white/12">
        <div className="h-full bg-[#b9f1d6] transition-[width] duration-300" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="absolute left-4 right-4 top-4 z-30 flex items-center justify-between gap-3 sm:left-6 sm:right-6">
        <div className="flex items-center gap-2 text-white/82">
          <CompoundCanvasMark className="h-8 w-8 text-[#b9f1d6]" />
          <span className="text-sm font-semibold">Compound Canvas</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPlaying((value) => !value)}
            aria-label={playing ? "Pause product demo" : "Play product demo"}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/16 bg-white/10 px-4 text-sm font-semibold backdrop-blur transition hover:bg-white/16"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span className="hidden sm:inline">{playing ? "Pause" : "Play"}</span>
          </button>
          <button
            type="button"
            onClick={restart}
            aria-label="Restart product demo"
            className="inline-flex min-h-11 w-11 items-center justify-center rounded-full border border-white/16 bg-white/10 backdrop-blur transition hover:bg-white/16"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Exit product demo"
            className="inline-flex min-h-11 w-11 items-center justify-center rounded-full border border-white/16 bg-white/10 backdrop-blur transition hover:bg-white/16"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        key={scene.id}
        className={`product-demo-scene product-demo-scene-${scene.id} ${reducedMotion ? "product-demo-reduced" : ""}`}
      >
        <DemoVisual scene={scene.id} />
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-end px-5 pb-24 pt-24 sm:px-8 md:pb-28">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#b9f1d6]">{scene.kicker}</p>
            <h2 className="mt-4 text-[38px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[58px] md:text-[78px]">
              {scene.title}
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/76 md:text-xl">{scene.subtitle}</p>
            <p className="mt-5 inline-flex max-w-full rounded-full border border-white/14 bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 backdrop-blur">
              {scene.label}
            </p>
          </div>

          {scene.id === "final" && (
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartDrugDesign101();
                }}
                className="min-h-12 rounded-2xl bg-[#b9f1d6] px-5 text-base font-semibold text-[#092134] transition hover:bg-[#d3ffe8]"
              >
                Start Drug Design 101
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSandbox();
                }}
                className="min-h-12 rounded-2xl border border-white/18 bg-white/10 px-5 text-base font-semibold text-white transition hover:bg-white/16"
              >
                Open Sandbox
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center justify-between gap-4 text-xs text-white/58 sm:left-6 sm:right-6">
        <span>
          Scene {sceneIndex + 1} / {demoScenes.length}
        </span>
        <span>Silent demo · no calculations run</span>
      </div>
    </div>
  );
}

function DemoVisual({ scene }: { scene: DemoSceneId }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(185,241,214,0.18),transparent_26rem),linear-gradient(145deg,#071522_0%,#11263a_55%,#091726_100%)]" />
      <div className="product-demo-grid" />
      {(scene === "hook" || scene === "molecule" || scene === "evaluate") && <MoleculeCinema />}
      {(scene === "protein" || scene === "pocket" || scene === "docking") && <ProteinCinema scene={scene} />}
      {scene === "compare" && <ComparisonCinema />}
      {scene === "learn" && <LearningCinema />}
      {scene === "final" && (
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <CompoundCanvasMark className="h-[44vmin] w-[44vmin] text-[#b9f1d6]" />
        </div>
      )}
    </div>
  );
}

function MoleculeCinema() {
  const atoms = [
    ["C", "left-[22%] top-[40%]"],
    ["N", "left-[34%] top-[30%]"],
    ["O", "left-[48%] top-[39%]"],
    ["C", "left-[38%] top-[54%]"],
    ["N", "left-[56%] top-[55%]"],
  ];
  return (
    <div className="product-demo-molecule">
      <svg viewBox="0 0 520 360" className="absolute inset-0 h-full w-full opacity-70">
        <path d="M130 160 L210 112 L290 158 L240 238 L150 228 Z" stroke="rgba(255,255,255,.52)" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M290 158 L390 212" stroke="rgba(185,241,214,.62)" strokeWidth="7" fill="none" strokeLinecap="round" />
      </svg>
      {atoms.map(([atom, position], index) => (
        <span key={`${atom}-${index}`} className={`product-demo-atom ${position}`}>{atom}</span>
      ))}
      <div className="product-demo-depth-card">
        <span>2D</span>
        <strong>→</strong>
        <span>3D</span>
      </div>
    </div>
  );
}

function ProteinCinema({ scene }: { scene: "protein" | "pocket" | "docking" }) {
  return (
    <div className="absolute inset-0">
      <div className={`product-demo-protein ${scene !== "protein" ? "product-demo-protein-focused" : ""}`}>
        {Array.from({ length: 10 }).map((_, index) => (
          <span key={index} style={{ "--i": index } as CSSProperties} />
        ))}
      </div>
      <div className="product-demo-pocket">
        <span>Lys745</span>
        <span>Leu788</span>
        <span>Met793</span>
      </div>
      {scene === "docking" && (
        <>
          <div className="product-demo-ghost-pose pose-one" />
          <div className="product-demo-ghost-pose pose-two" />
          <div className="product-demo-ghost-pose pose-three" />
          <div className="product-demo-ligand-pose" />
        </>
      )}
    </div>
  );
}

function ComparisonCinema() {
  return (
    <div className="product-demo-comparison">
      {["Candidate A", "Candidate B"].map((name, index) => (
        <div key={name} className="product-demo-candidate-card">
          <p>{name}</p>
          <div className="h-2 rounded-full bg-[#b9f1d6]" style={{ width: index === 0 ? "72%" : "58%" }} />
          <div className="h-2 rounded-full bg-[#f0c96f]" style={{ width: index === 0 ? "42%" : "76%" }} />
          <div className="h-2 rounded-full bg-white/45" style={{ width: index === 0 ? "64%" : "51%" }} />
          <span>{index === 0 ? "Lower flexibility" : "Different tradeoff"}</span>
        </div>
      ))}
    </div>
  );
}

function LearningCinema() {
  return (
    <div className="product-demo-learning">
      <div>
        <p>Drug Design 101</p>
        <strong>6 / 8 modules</strong>
      </div>
      <div>
        <p>Prediction</p>
        <strong>What does the score mean?</strong>
      </div>
      <div>
        <p>Feedback</p>
        <strong>Estimate, not proof of binding.</strong>
      </div>
      <div>
        <p>Next</p>
        <strong>Open Sandbox</strong>
      </div>
    </div>
  );
}
