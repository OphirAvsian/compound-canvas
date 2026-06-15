import { ArrowRight, Atom, Box, Check, MousePointer2 } from "lucide-react";

export function WorkflowGuide({
  stage,
}: {
  stage: "ready" | "calculating" | "complete" | "outdated";
}) {
  const steps = [
    {
      icon: MousePointer2,
      title: "1. Choose or edit",
      body: "Keep the sample molecule, or change one atom, bond, or chemical group.",
    },
    {
      icon: Box,
      title: "2. Generate its shape",
      body: "RDKit checks the graph, adds hydrogens, and calculates 3D coordinates.",
    },
    {
      icon: Atom,
      title: "3. Explore the result",
      body: "Rotate the molecule and unpack its formula and molecular properties.",
    },
  ];
  const activeStep = stage === "complete" || stage === "outdated" ? 2 : stage === "calculating" ? 1 : 0;

  return (
    <section className="border-b border-[#d8d7d1] bg-[#eef8f2] px-4 py-4 md:px-6">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#34745a]">
            {stage === "complete"
              ? "Nice work: your real 3D result is ready"
              : stage === "outdated"
                ? "Your molecule changed: calculate it again"
                : stage === "calculating"
                  ? "RDKit is working through the calculation"
                  : "Your guided experiment"}
          </p>
          <span className="text-[9px] font-semibold text-[#708078]">
            Step {activeStep + 1} of 3
          </span>
        </div>
        <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
          {steps.map((step, index) => (
            <div key={step.title} className="contents">
              <div
                className={`flex min-h-[68px] items-start gap-3 rounded-xl border px-3 py-3 transition ${
                  index === activeStep
                    ? "border-[#9ed4b8] bg-white shadow-sm"
                    : index < activeStep
                      ? "border-transparent bg-white/55"
                      : "border-transparent bg-white/30"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    index < activeStep
                      ? "bg-[#d8f0e3] text-[#2f7659]"
                      : index === activeStep
                        ? "bg-ink text-white"
                        : "bg-white text-[#8ba097]"
                  }`}
                >
                  {index < activeStep ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <step.icon className="h-3.5 w-3.5" />
                  )}
                </span>
                <div>
                  <p className="text-[10px] font-semibold">{step.title}</p>
                  <p className="mt-0.5 text-[9px] leading-4 text-[#64746b]">{step.body}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="hidden h-3.5 w-3.5 text-[#8caf9f] md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
