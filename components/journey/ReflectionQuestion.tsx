"use client";

import { CheckCircle2, CircleHelp, SkipForward } from "lucide-react";
import { useState } from "react";
import type { JourneyState } from "@/lib/journey/journey-state";
import { emitJourneyEvent } from "@/lib/journey/journey-events";
import { ScientificEvidenceBadge } from "./ScientificEvidenceBadge";

export type ReflectionDefinition = {
  stepId: string;
  question: string;
  options: Array<{
    id: string;
    label: string;
    correct: boolean;
    feedback: string;
  }>;
};

export function ReflectionQuestion({
  definition,
  journeyState,
}: {
  definition: ReflectionDefinition;
  journeyState: JourneyState;
}) {
  const [answerId, setAnswerId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const progress = journeyState.steps[definition.stepId];
  const satisfied = progress?.status === "complete" || progress?.status === "skipped";

  const submit = () => {
    const answer = definition.options.find((option) => option.id === answerId);
    if (!answer) return;
    setFeedback(answer.feedback);
    emitJourneyEvent({
      type: "reflection.completed",
      stepId: definition.stepId,
      answerId: answer.id,
      correct: answer.correct,
    });
  };

  if (satisfied) {
    return (
      <div className="rounded-2xl border border-[#cfe5d9] bg-[#f0f8f4] p-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-[#2d6b51]">
          <CheckCircle2 className="h-4 w-4" />
          {progress.status === "skipped" ? "Checkpoint skipped" : "Checkpoint reviewed"}
        </div>
        <p className="mt-2 text-[10px] leading-5 text-[#5d7167]">
          {progress.status === "skipped"
            ? "This educational checkpoint was skipped. No scientific action was marked complete."
            : progress.evidence?.detail}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#deddd7] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold">
          <CircleHelp className="h-4 w-4 text-[#62776c]" />
          Reflection checkpoint
        </div>
        <ScientificEvidenceBadge kind="curated" />
      </div>
      <p className="mt-3 text-[12px] font-semibold leading-5">{definition.question}</p>
      <div className="mt-3 space-y-2">
        {definition.options.map((option) => (
          <label
            key={option.id}
            className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-[10px] leading-4 ${
              answerId === option.id
                ? "border-[#78a991] bg-[#eff8f3]"
                : "border-[#deddd7] bg-[#fbfaf7]"
            }`}
          >
            <input
              type="radio"
              suppressHydrationWarning
              name={definition.stepId}
              value={option.id}
              checked={answerId === option.id}
              onChange={() => setAnswerId(option.id)}
            />
            {option.label}
          </label>
        ))}
      </div>
      {feedback && (
        <p className="mt-3 rounded-xl bg-[#f2f5f3] p-3 text-[10px] leading-5 text-[#596a61]">
          {feedback}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={submit}
          disabled={!answerId}
          className="rounded-xl bg-ink px-4 py-2.5 text-[10px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          Check and continue
        </button>
        <button
          onClick={() =>
            emitJourneyEvent({
              type: "journey.step_skipped",
              stepId: definition.stepId,
            })
          }
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-[10px] font-semibold text-[#727d77] hover:bg-[#f2f1ed]"
        >
          <SkipForward className="h-3.5 w-3.5" />
          Skip reflection
        </button>
      </div>
    </div>
  );
}
