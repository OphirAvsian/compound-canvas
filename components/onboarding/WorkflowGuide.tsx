import { ArrowRight, Atom, Box, MousePointer2 } from "lucide-react";

export function WorkflowGuide({ complete }: { complete: boolean }) {
  const steps = [
    {
      icon: MousePointer2,
      title: "1. Edit the 2D molecule",
      body: "Use the starting molecule or change an atom, bond, or chemical group.",
    },
    {
      icon: Box,
      title: "2. Generate a 3D shape",
      body: "RDKit validates the chemical graph, adds hydrogens, and calculates coordinates.",
    },
    {
      icon: Atom,
      title: "3. Inspect the result",
      body: "Rotate the molecule and compare its formula and simple molecular properties.",
    },
  ];

  return (
    <section className="border-b border-[#d8d7d1] bg-[#eef8f2] px-4 py-3 md:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#34745a]">
          {complete ? "You completed the real Phase 1 workflow" : "Start here"}
        </p>
        {steps.map((step, index) => (
          <div key={step.title} className="flex items-center gap-2">
            <div className="flex max-w-[245px] items-start gap-2 rounded-xl bg-white/75 px-3 py-2">
              <step.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#36785c]" />
              <div>
                <p className="text-[10px] font-semibold">{step.title}</p>
                <p className="mt-0.5 text-[9px] leading-4 text-[#64746b]">{step.body}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <ArrowRight className="hidden h-3.5 w-3.5 text-[#8caf9f] lg:block" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
