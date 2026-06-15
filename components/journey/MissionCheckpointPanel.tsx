import { BookOpenCheck } from "lucide-react";
import type { JourneyState } from "@/lib/journey/journey-state";
import { ReflectionQuestion, type ReflectionDefinition } from "./ReflectionQuestion";

const reflections: Record<string, ReflectionDefinition> = {
  "mission-1": {
    stepId: "m1-reflection",
    question: "What does a conformer add to a molecular structure?",
    options: [
      {
        id: "score",
        label: "A docking score",
        correct: false,
        feedback:
          "A conformer does not contain a docking score. It adds one plausible set of 3D coordinates.",
      },
      {
        id: "coordinates",
        label: "Three-dimensional coordinates for the atoms",
        correct: true,
        feedback:
          "Correct. The chemical graph stays the same, while each atom gains an x, y, and z position.",
      },
      {
        id: "formula",
        label: "A different chemical formula",
        correct: false,
        feedback:
          "The formula does not change. A conformer changes geometry, not molecular identity.",
      },
    ],
  },
  "mission-2": {
    stepId: "m2-reflection",
    question: "What is the most scientifically honest description of this active-site lesson?",
    options: [
      {
        id: "detected",
        label: "Compound Canvas automatically detected the EGFR pocket",
        correct: false,
        feedback:
          "No pocket detection was run. The lesson residues were selected by the lesson author.",
      },
      {
        id: "curated",
        label: "It is a curated region explored through real 2ITY coordinates",
        correct: true,
        feedback:
          "Correct. Residue identities and positions come from 2ITY; their lesson roles are curated explanations.",
      },
      {
        id: "docked",
        label: "Compound Canvas docked gefitinib into EGFR",
        correct: false,
        feedback:
          "Gefitinib was experimentally deposited with 2ITY. Compound Canvas did not dock it.",
      },
    ],
  },
};

export function MissionCheckpointPanel({
  missionId,
  journeyState,
}: {
  missionId: "mission-1" | "mission-2";
  journeyState: JourneyState;
}) {
  return (
    <section className="border-t border-[#d8d7d1] bg-[#f6f4ee] px-4 py-6 md:px-6">
      <div className="mx-auto max-w-[900px]">
        <div className="mb-4 flex items-center gap-2">
          <BookOpenCheck className="h-4 w-4 text-[#806225]" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#806225]">
              Mission checkpoint
            </p>
            <p className="mt-1 text-[10px] text-[#747d78]">
              Use the evidence you just explored. This is teaching content, not a new calculation.
            </p>
          </div>
        </div>
        <ReflectionQuestion
          definition={reflections[missionId]}
          journeyState={journeyState}
        />
      </div>
    </section>
  );
}
