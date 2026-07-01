"use client";

import { ChevronUp, Route, X } from "lucide-react";
import { getJourneyProgress, type JourneyState } from "@/lib/journey/journey-state";
import { JourneySidebar } from "./JourneySidebar";

export function JourneyMobileBar({
  state,
  open,
  onOpenChange,
  onSelectMission,
  onReset,
}: {
  state: JourneyState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMission: (missionId: string) => void;
  onReset: () => void;
}) {
  const progress = getJourneyProgress(state);
  return (
    <>
      <button
        onClick={() => onOpenChange(true)}
        className="sticky top-[58px] z-30 flex min-h-14 w-full items-center gap-3 border-b border-[#d8d7d1] bg-[#f8f7f2]/95 px-4 py-3 backdrop-blur md:hidden"
      >
        <Route className="h-4 w-4 text-[#2e7357]" />
        <span className="text-[13px] font-semibold">Learning Journey</span>
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#dfded9]">
          <span
            className="block h-full rounded-full bg-[#4f8d70]"
            style={{ width: `${progress.percent}%` }}
          />
        </span>
        <span className="text-[12px] font-semibold text-[#65736b]">{progress.percent}%</span>
        <ChevronUp className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button
            className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
            onClick={() => onOpenChange(false)}
            aria-label="Close learning journey"
          />
          <section className="absolute bottom-0 left-0 right-0 max-h-[82vh] overflow-y-auto rounded-t-3xl bg-[#f8f7f2] p-4 shadow-2xl">
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => onOpenChange(false)}
                className="min-h-11 min-w-11 rounded-xl p-2 hover:bg-white"
                aria-label="Close learning journey"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <JourneySidebar
              state={state}
              onSelectMission={onSelectMission}
              onReset={onReset}
              onClose={() => onOpenChange(false)}
              mobile
            />
          </section>
        </div>
      )}
    </>
  );
}
