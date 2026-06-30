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
    body: "Explore curated EGFR or import an RCSB PDB ID, then inspect real deposited residues.",
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
    <section className="border-b border-[#d8d7d1] bg-[#fbfaf6] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-[1180px]">
        <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#39765b]">
              One connected scientific story
            </p>
            <h2 className="mt-2 max-w-[620px] text-[30px] font-semibold leading-tight tracking-[-0.045em]">
              Design a molecule, understand a protein, and record what happened.
            </h2>
            <p className="mt-4 max-w-[640px] text-[14px] leading-7 text-[#52635a]">
              Compound Canvas teaches the early computational drug-discovery workflow
              through real molecular coordinates and carefully labeled educational
              explanations. Start with caffeine, then use EGFR to learn how proteins
              provide the biological context a molecule would eventually be tested
              against.
            </p>
            <div className="mt-5 rounded-2xl border border-[#ead59d] bg-[#fff8e8] p-4 text-[13px] leading-6 text-[#725a2d]">
              <strong>Current scientific boundary:</strong> Compound Canvas generates
              conformers, prepares ligand artifacts, cleans and prepares a curated
              EGFR receptor input, and runs one curated docking lesson. It does not
              prove binding, predict activity, or calculate real affinity.
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {workspaces.map((workspace) => (
              <button
                key={workspace.area}
                type="button"
                onClick={() => onNavigate(workspace.area)}
                className="group min-h-[150px] rounded-2xl border border-[#deddd7] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#aacdbb]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef5f1] text-[#39765b]">
                  <workspace.icon className="h-4 w-4" />
                </span>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <h3 className="text-[15px] font-semibold">{workspace.title}</h3>
                  <ArrowRight className="h-3.5 w-3.5 text-[#8b9790] transition group-hover:translate-x-0.5" />
                </div>
                <p className="mt-2 text-[12px] leading-5 text-[#52635a]">
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
