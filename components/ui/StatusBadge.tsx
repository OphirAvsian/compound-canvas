import type { ReactNode } from "react";

export function StatusBadge({
  children,
  status = "neutral",
}: {
  children: ReactNode;
  status?: "real" | "simulated" | "future" | "neutral";
}) {
  const styles = {
    real: "border-[#9fd8bc] bg-[#e7f8ef] text-[#246b52]",
    simulated: "border-[#e8c98f] bg-[#fff6df] text-[#825d16]",
    future: "border-[#d9d8d2] bg-[#efeee9] text-[#777f85]",
    neutral: "border-[#d9d8d2] bg-white/80 text-[#596575]",
  };

  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1 rounded-full border px-3 py-1 text-[12px] font-semibold ${styles[status]}`}
    >
      {children}
    </span>
  );
}
