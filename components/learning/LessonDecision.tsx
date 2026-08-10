"use client";

import { CheckCircle2, Lightbulb, RotateCcw } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { LessonDecisionOption } from "@/lib/lesson-interactions";

export function LessonDecision({
  eyebrow = "Scientist move",
  title,
  prompt,
  options,
  boundary,
}: {
  eyebrow?: string;
  title: string;
  prompt: string;
  options: LessonDecisionOption[];
  boundary?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = options.find((option) => option.id === selectedId);

  return (
    <div className="rounded-2xl border border-[#d9d8d2] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#edf7f1] text-[#39765b]">
            <Lightbulb className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#39765b]">
              {eyebrow}
            </p>
            <h3 className="text-[17px] font-semibold leading-snug text-ink">{title}</h3>
          </div>
        </div>
        <StatusBadge status="simulated">Educational choice</StatusBadge>
      </div>

      <p className="mt-3 text-[14px] leading-7 text-[#52635a]">{prompt}</p>

      <div className="mt-3 grid gap-2">
        {options.map((option) => {
          const active = option.id === selectedId;
          const preferred = selectedId && option.preferred;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelectedId(option.id)}
              aria-pressed={active}
              className={`min-h-12 rounded-xl border px-4 py-3 text-left text-[14px] leading-6 transition ${
                active
                  ? option.preferred
                    ? "border-[#88bea3] bg-[#f0f8f4] text-[#284c3c]"
                    : "border-[#e4c78f] bg-[#fff8e8] text-[#684f20]"
                  : "border-[#deddd7] bg-[#fbfaf7] text-[#48564f] hover:border-[#b9c8bf] hover:bg-white"
              }`}
            >
              <span className="flex items-start gap-2">
                {preferred && <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#33785b]" />}
                <span>{option.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div
          className={`mt-3 rounded-xl border p-4 text-[14px] leading-7 ${
            selected.preferred
              ? "border-[#cde2d6] bg-[#f5fbf7] text-[#365f4d]"
              : "border-[#ead59d] bg-[#fff8e8] text-[#715724]"
          }`}
          role="status"
        >
          <p className="font-semibold">
            {selected.preferred ? "Good reasoning." : "Useful mistake."}
          </p>
          <p className="mt-1">{selected.feedback}</p>
          {!selected.preferred && (
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[12px] font-semibold text-[#715724]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Try another explanation
            </button>
          )}
        </div>
      )}

      {boundary && (
        <p className="mt-3 rounded-xl bg-[#f2f1ed] px-3 py-2 text-[12px] leading-5 text-[#68736d]">
          {boundary}
        </p>
      )}
    </div>
  );
}
