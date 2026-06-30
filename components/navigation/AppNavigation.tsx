"use client";

import {
  Atom,
  BookOpenCheck,
  ChevronDown,
  FlaskConical,
  Home,
  Menu,
  NotebookTabs,
} from "lucide-react";
import { useState } from "react";

export type AppArea = "home" | "molecule" | "protein" | "experiment" | "journey";

const areas: Array<{
  id: AppArea;
  label: string;
  shortDescription: string;
  icon: typeof Home;
}> = [
  {
    id: "home",
    label: "Home",
    shortDescription: "Start and understand the workflow",
    icon: Home,
  },
  {
    id: "molecule",
    label: "Molecule Lab",
    shortDescription: "Draw, generate 3D, and prepare",
    icon: FlaskConical,
  },
  {
    id: "protein",
    label: "Protein Lab",
    shortDescription: "Explore real EGFR coordinates",
    icon: Atom,
  },
  {
    id: "experiment",
    label: "Experiment",
    shortDescription: "Review evidence and reports",
    icon: NotebookTabs,
  },
  {
    id: "journey",
    label: "Learning Journey",
    shortDescription: "Follow the guided science story",
    icon: BookOpenCheck,
  },
];

export function AppNavigation({
  activeArea,
  onChange,
}: {
  activeArea: AppArea;
  onChange: (area: AppArea) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentArea = areas.find((area) => area.id === activeArea) ?? areas[0];

  const chooseArea = (area: AppArea) => {
    onChange(area);
    setMobileOpen(false);
  };

  return (
    <nav
      aria-label="Compound Canvas workspaces"
      className="sticky top-[58px] z-30 border-b border-[#d8d7d1] bg-[#f8f7f2]/97 px-2 py-2.5 shadow-[0_8px_24px_rgba(23,40,59,.05)] backdrop-blur-xl sm:px-4"
    >
      <div className="mx-auto max-w-[1180px] sm:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-workspace-menu"
          aria-label={`Open workspace navigation. Current workspace is ${currentArea.label}.`}
          className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-[#8fc6aa] bg-white px-4 py-3 text-left shadow-sm"
        >
          <span className="flex items-center gap-2">
            <Menu className="h-5 w-5 text-[#39765b]" />
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-wide text-[#66746d]">
                You are in
              </span>
              <span className="mt-0.5 block text-[14px] font-semibold">{currentArea.label}</span>
            </span>
          </span>
          <ChevronDown className={`h-4 w-4 transition ${mobileOpen ? "rotate-180" : ""}`} />
        </button>
        {mobileOpen && (
          <div id="mobile-workspace-menu" className="mt-2 grid gap-1 rounded-2xl border border-[#d9d8d2] bg-white p-2 shadow-xl">
            {areas.map((area) => {
              const active = area.id === activeArea;
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => chooseArea(area.id)}
                  aria-current={active ? "page" : undefined}
                  aria-label={`${active ? "Current workspace:" : "Go to"} ${area.label}. ${area.shortDescription}`}
                  className={`flex min-h-14 items-start gap-3 rounded-xl px-3 py-3 text-left ${
                    active ? "bg-[#edf7f1] ring-1 ring-[#9ac8b1]" : "hover:bg-[#f7f7f2]"
                  }`}
                >
                  <area.icon className={`mt-0.5 h-4 w-4 shrink-0 ${active ? "text-[#2f7659]" : "text-[#7d8882]"}`} />
                  <span>
                    <span className="block text-[13px] font-semibold">{area.label}</span>
                    <span className="mt-0.5 block text-[11px] leading-5 text-[#65716b]">
                      {area.shortDescription}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mx-auto hidden max-w-[1180px] gap-2 sm:grid sm:grid-cols-5">
        {areas.map((area) => {
          const active = area.id === activeArea;
          return (
            <button
              key={area.id}
              type="button"
              onClick={() => chooseArea(area.id)}
              aria-current={active ? "page" : undefined}
              aria-label={`${active ? "Current workspace:" : "Go to"} ${area.label}. ${area.shortDescription}`}
              className={`min-h-[68px] rounded-2xl border px-3.5 py-3 text-left transition ${
                active
                  ? "border-[#8fc6aa] bg-white shadow-[0_10px_28px_rgba(43,85,66,.1)] ring-2 ring-[#d9f0e4]"
                  : "border-transparent text-[#65716b] hover:border-[#deddd7] hover:bg-white/80"
              }`}
            >
              <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                <area.icon className={`h-4 w-4 ${active ? "text-[#2f7659]" : "text-[#7d8882]"}`} />
                {area.label}
              </span>
              <span className="mt-1 hidden text-[11px] leading-4 text-[#65716b] lg:block">
                {area.shortDescription}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
