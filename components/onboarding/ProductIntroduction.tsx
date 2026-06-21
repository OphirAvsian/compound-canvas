"use client";

import {
  ArrowRight,
  Atom,
  BookOpenCheck,
  FlaskConical,
  NotebookTabs,
} from "lucide-react";
import type { AppArea } from "@/components/navigation/AppNavigation";

const workspaces: Array<{
  area: AppArea;
  title: string;
  body: string;
  icon: typeof Atom;
}> = [
  {
    area: "molecule",
    title: "Molecule Lab",
    body: "Draw a molecule, calculate one plausible 3D shape, and prepare a ligand artifact.",
    icon: FlaskConical,
  },
  {
    area: "protein",
    title: "Protein Lab",
    body: "Explore real EGFR coordinates and inspect residues from the deposited 2ITY structure.",
    icon: Atom,
  },
  {
    area: "experiment",
    title: "Experiment",
    body: "See what evidence was recorded, what remains unavailable, and download learning reports.",
    icon: NotebookTabs,
  },
  {
    area: "journey",
    title: "Learning Journey",
    body: "Follow the recommended path and understand why each scientific step matters.",
    icon: BookOpenCheck,
  },
];

export function ProductIntroduction({
  onNavigate,
}: {
  onNavigate: (area: AppArea) => void;
}) {
  return (
    <section className="border-b border-[#d8d7d1] bg-[#fbfaf6] px-4 py-8 md:px-6">
      <div className="mx-auto max-w-[1180px]">
        <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#39765b]">
              One connected scientific story
            </p>
            <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.04em]">
              Design a molecule, understand a protein, and record what happened.
            </h2>
            <p className="mt-3 text-[11px] leading-6 text-[#65716b]">
              Compound Canvas teaches the early computational drug-discovery workflow
              through real molecular coordinates and carefully labeled educational
              explanations. Start with caffeine, then use EGFR to learn how proteins
              provide the biological context a molecule would eventually be tested
              against.
            </p>
            <div className="mt-4 rounded-2xl border border-[#ead59d] bg-[#fff8e8] p-4 text-[10px] leading-5 text-[#725a2d]">
              <strong>Current scientific boundary:</strong> Compound Canvas generates
              conformers and prepares ligand artifacts. It does not prepare proteins,
              dock molecules, predict binding, or calculate affinity.
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {workspaces.map((workspace) => (
              <button
                key={workspace.area}
                type="button"
                onClick={() => onNavigate(workspace.area)}
                className="group rounded-2xl border border-[#deddd7] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#aacdbb]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef5f1] text-[#39765b]">
                  <workspace.icon className="h-4 w-4" />
                </span>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <h3 className="text-[12px] font-semibold">{workspace.title}</h3>
                  <ArrowRight className="h-3.5 w-3.5 text-[#8b9790] transition group-hover:translate-x-0.5" />
                </div>
                <p className="mt-1 text-[9px] leading-4 text-[#6c7771]">
                  {workspace.body}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
