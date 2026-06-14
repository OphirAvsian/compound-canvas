"use client";

import { Layers3, Sparkles } from "lucide-react";
import { guidedResidues } from "@/data/guided-project";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function IllustrativeProtein({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="relative min-h-[390px] overflow-hidden bg-[#e9ebe7]">
      <div className="absolute left-4 top-4 z-20 flex gap-2">
        <StatusBadge status="simulated">Illustrative protein</StatusBadge>
        <StatusBadge>
          <Layers3 className="h-3 w-3" />
          EGFR lesson
        </StatusBadge>
      </div>
      <svg className="protein-ribbon absolute inset-0 h-full w-full" viewBox="0 0 800 560">
        <defs>
          <linearGradient id="proteinA" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8aa2b1" />
            <stop offset="1" stopColor="#526f83" />
          </linearGradient>
          <radialGradient id="siteGlow">
            <stop offset="0" stopColor="#b9f1d6" stopOpacity=".92" />
            <stop offset="1" stopColor="#b9f1d6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="425" cy="280" rx="130" ry="115" fill="url(#siteGlow)" />
        <g fill="none" stroke="url(#proteinA)" strokeLinecap="round" strokeLinejoin="round">
          <path d="M168 105 C245 25 315 122 266 178 S210 270 300 285 S403 222 348 180" strokeWidth="25" />
          <path d="M328 90 C410 55 470 110 433 171 S390 240 457 251 S564 191 618 229" strokeWidth="20" />
          <path d="M615 150 C675 199 620 273 559 265 S470 266 497 333 S596 383 629 452" strokeWidth="24" />
          <path d="M529 429 C456 500 363 455 388 384 S387 289 310 331 S227 447 151 394" strokeWidth="22" />
        </g>
      </svg>
      {guidedResidues.map((residue) => (
        <button
          key={residue.id}
          onClick={() => onSelect(residue.id)}
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${residue.x}%`, top: `${residue.y}%` }}
          aria-label={`Open lesson for ${residue.name}`}
        >
          <span
            className={`block h-4 w-4 rounded-full border-2 border-white shadow-md ${
              selected === residue.id ? "ring-4 ring-white/60" : ""
            }`}
            style={{ backgroundColor: residue.color }}
          />
        </button>
      ))}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-xl bg-white/75 px-3 py-2 text-[10px] text-[#61707b] backdrop-blur">
        <Sparkles className="h-3.5 w-3.5 text-[#3a8a69]" />
        Curated active-site lesson; coordinate-based protein view arrives in Phase 2.
      </div>
    </section>
  );
}
