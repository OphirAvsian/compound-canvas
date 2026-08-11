"use client";

import { ArrowRight, BookOpenCheck, CheckCircle2, Save, Scale } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Experiment } from "@/lib/experiments/experiment-model";
import {
  createCandidateFromExperiment,
  evaluateLipinski,
  getDrugLikenessDescriptors,
  loadCompoundLibrary,
  saveCompoundLibrary,
  summarizeComparison,
  upsertCompoundCandidate,
  type CompoundCandidate,
  type DrugLikenessDescriptor,
} from "@/lib/compound-library";

function statusLabel(status: DrugLikenessDescriptor["status"]) {
  if (status === "within-common-range") return "within common range";
  if (status === "potential-concern") return "potential concern";
  return "context needed";
}

function statusClasses(status: DrugLikenessDescriptor["status"]) {
  if (status === "within-common-range") return "border-[#cde2d6] bg-[#f5fbf7] text-[#2f6f54]";
  if (status === "potential-concern") return "border-[#ead59d] bg-[#fff8e8] text-[#76591f]";
  return "border-[#d9d8d2] bg-[#fbfaf6] text-[#65716b]";
}

function DescriptorCard({ descriptor }: { descriptor: DrugLikenessDescriptor }) {
  return (
    <details className={`rounded-2xl border p-4 ${statusClasses(descriptor.status)}`}>
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold text-ink">{descriptor.label}</p>
            <p className="mt-1 text-[28px] font-semibold tracking-[-0.04em] text-ink">
              {descriptor.displayValue}
            </p>
          </div>
          <span className="rounded-full bg-white/75 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
            {statusLabel(descriptor.status)}
          </span>
        </div>
      </summary>
      <div className="mt-3 space-y-2 text-[13px] leading-6">
        <p>
          <strong>What is this?</strong> {descriptor.explanation}
        </p>
        <p>
          <strong>What changes it?</strong> {descriptor.influence}
        </p>
      </div>
    </details>
  );
}

function CandidateSummary({
  candidate,
  selected,
  onToggle,
}: {
  candidate: CompoundCandidate;
  selected: boolean;
  onToggle: () => void;
}) {
  const descriptor = (id: DrugLikenessDescriptor["id"]) =>
    candidate.descriptors.find((item) => item.id === id);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-[#79b999] bg-[#f3fbf7] ring-2 ring-[#c9ead9]"
          : "border-[#d9d8d2] bg-white hover:border-[#aabbb2]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[15px] font-semibold">{candidate.name}</p>
          <p className="mt-1 break-all text-[12px] leading-5 text-[#65716b]">
            {candidate.smiles}
          </p>
        </div>
        {selected && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#33785b]" />}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
        <span>MW {descriptor("molecularWeight")?.displayValue ?? "n/a"}</span>
        <span>cLogP {descriptor("logP")?.displayValue ?? "n/a"}</span>
        <span>HBD {descriptor("hBondDonors")?.displayValue ?? "n/a"}</span>
        <span>HBA {descriptor("hBondAcceptors")?.displayValue ?? "n/a"}</span>
      </div>
      <p className="mt-3 text-[12px] font-semibold text-[#52635a]">
        Lipinski: {candidate.lipinski.passedRules}/{candidate.lipinski.totalRules} common rules
      </p>
      <p className="mt-1 text-[12px] leading-5 text-[#707a75]">
        {candidate.dockingEstimate?.scoreKcalMol != null
          ? `Saved Vina estimate ${candidate.dockingEstimate.scoreKcalMol.toFixed(2)} kcal/mol`
          : "No saved docking estimate"}
      </p>
    </button>
  );
}

export function CompoundIterationPanel({ experiment }: { experiment: Experiment }) {
  const [library, setLibrary] = useState<CompoundCandidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const descriptors = getDrugLikenessDescriptors(experiment);
  const lipinski = evaluateLipinski(descriptors);
  const currentCandidate = useMemo(
    () => createCandidateFromExperiment(experiment),
    [experiment],
  );
  const selectedCandidates = selectedIds
    .map((id) => library.find((candidate) => candidate.id === id))
    .filter(Boolean) as CompoundCandidate[];

  useEffect(() => {
    setLibrary(loadCompoundLibrary(globalThis.localStorage));
  }, []);

  const persist = (nextLibrary: CompoundCandidate[]) => {
    setLibrary(nextLibrary);
    saveCompoundLibrary(globalThis.localStorage, nextLibrary);
  };

  const saveCurrent = () => {
    const candidate = createCandidateFromExperiment(experiment);
    if (!candidate) return;
    const replaced = library.some(
      (item) => item.sampleId === candidate.sampleId && item.smiles === candidate.smiles,
    );
    persist(upsertCompoundCandidate(library, candidate));
    setSelectedIds((ids) => [candidate.id, ...ids].slice(0, 2));
    setSaveMessage(
      replaced
        ? "Updated the existing saved copy for this same molecule."
        : "Saved this candidate in this browser.",
    );
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((ids) => {
      if (ids.includes(id)) return ids.filter((item) => item !== id);
      return [id, ...ids].slice(0, 2);
    });
  };

  return (
    <section id="compound-iteration-workspace" className="border-t border-[#d8d7d1] bg-[#f7f5ef] px-4 py-7 md:px-6">
      <div className="mx-auto max-w-[1180px] rounded-3xl border border-[#d9d8d2] bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={descriptors.length ? "real" : "neutral"}>Calculated descriptors</StatusBadge>
              <StatusBadge status="neutral">Educational interpretation</StatusBadge>
            </div>
            <h2 className="mt-3 text-[26px] font-semibold tracking-[-0.035em]">
              Evaluate, save, compare, and iterate
            </h2>
            <p className="mt-2 text-[15px] leading-7 text-[#52635a]">
              Drug design is not a single score. Use real available descriptors to
              look for tradeoffs, save this candidate, then compare it with another
              molecule you try next.
            </p>
          </div>
          <button
            type="button"
            onClick={saveCurrent}
            disabled={!currentCandidate}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save candidate
          </button>
          {saveMessage && (
            <p className="text-[12px] font-semibold leading-5 text-[#39765b] lg:max-w-[210px]">
              {saveMessage}
            </p>
          )}
        </div>

        {!descriptors.length ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[#d9d8d2] bg-[#fbfaf6] p-5 text-[14px] leading-7 text-[#65716b]">
            Generate a real 3D conformer first. Compound Canvas will then show
            molecular weight, hydrogen-bond counts, cLogP, rotatable bonds, and a
            transparent Lipinski interpretation.
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-3 md:grid-cols-[.85fr_1.15fr]">
              <article className="rounded-2xl border border-[#cde2d6] bg-[#f5fbf7] p-4">
                <div className="flex items-center gap-2 text-[15px] font-semibold text-[#2d6b51]">
                  <BookOpenCheck className="h-4 w-4" />
                  Lipinski Rule of Five, simplified
                </div>
                <p className="mt-2 text-[14px] leading-7 text-[#52635a]">
                  This is a teaching filter for common oral drug-like ranges, not a
                  verdict. Your molecule passes {lipinski.passedRules} of {lipinski.totalRules} common checks.
                </p>
                {lipinski.concerns.length ? (
                  <ul className="mt-3 space-y-2 text-[13px] leading-6 text-[#76591f]">
                    {lipinski.concerns.map((concern) => <li key={concern}>- {concern}</li>)}
                  </ul>
                ) : (
                  <p className="mt-3 rounded-xl bg-white/75 px-3 py-2 text-[13px] font-semibold text-[#2d6b51]">
                    No Rule-of-Five concerns from the descriptors Compound Canvas currently calculates.
                  </p>
                )}
                <p className="mt-3 text-[12px] leading-5 text-[#65716b]">
                  Unsupported today: toxicity, permeability, solubility, hERG risk,
                  efficacy, and clinical safety. Those require real data or models
                  that are not part of this app.
                </p>
              </article>
              <div className="grid gap-2 sm:grid-cols-2">
                {descriptors.map((descriptor) => (
                  <DescriptorCard key={descriptor.id} descriptor={descriptor} />
                ))}
              </div>
            </div>
          </>
        )}

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_.95fr]">
          <article className="rounded-2xl border border-[#d9d8d2] bg-[#fbfaf6] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[18px] font-semibold">Compound Library</h3>
                <p className="mt-1 text-[13px] leading-6 text-[#65716b]">
                  Browser-local saves only. No account or cloud project storage is used.
                </p>
              </div>
              <StatusBadge status="neutral">{library.length} saved</StatusBadge>
            </div>
            {library.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-[#d9d8d2] bg-white p-4 text-[13px] leading-6 text-[#65716b]">
                Save caffeine after Generate 3D, then try aspirin or acetaminophen
                and save a second candidate to compare tradeoffs.
              </p>
            ) : (
              <div className="mt-4 grid gap-2">
                {library.map((candidate) => (
                  <CandidateSummary
                    key={candidate.id}
                    candidate={candidate}
                    selected={selectedIds.includes(candidate.id)}
                    onToggle={() => toggleSelected(candidate.id)}
                  />
                ))}
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-[#d9d8d2] bg-white p-4">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-[#39765b]" />
              <h3 className="text-[18px] font-semibold">Compare candidates</h3>
            </div>
            <p className="mt-2 text-[13px] leading-6 text-[#65716b]">
              Select two saved compounds. Compound Canvas will describe supported
              tradeoffs, not declare a universal winner.
            </p>
            {selectedCandidates.length < 2 ? (
              <div className="mt-4 rounded-xl border border-dashed border-[#d9d8d2] bg-[#fbfaf6] p-4 text-[13px] leading-6 text-[#65716b]">
                Select {2 - selectedCandidates.length} more saved candidate
                {selectedCandidates.length === 1 ? "" : "s"} to compare.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <CandidateSummary
                    candidate={selectedCandidates[0]}
                    selected
                    onToggle={() => toggleSelected(selectedCandidates[0].id)}
                  />
                  <ArrowRight className="mx-auto hidden h-4 w-4 text-[#9aaa9f] sm:block" />
                  <CandidateSummary
                    candidate={selectedCandidates[1]}
                    selected
                    onToggle={() => toggleSelected(selectedCandidates[1].id)}
                  />
                </div>
                <div className="rounded-2xl border border-[#cde2d6] bg-[#f5fbf7] p-4">
                  <p className="text-[14px] font-semibold text-[#2d6b51]">Tradeoff notes</p>
                  <ul className="mt-2 space-y-2 text-[13px] leading-6 text-[#52635a]">
                    {summarizeComparison(selectedCandidates[0], selectedCandidates[1]).map((message) => (
                      <li key={message}>- {message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
