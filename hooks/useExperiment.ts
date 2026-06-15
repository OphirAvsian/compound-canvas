"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createInitialExperiment,
  type Experiment,
} from "@/lib/experiments/experiment-model";
import { applyExperimentEvent } from "@/lib/experiments/experiment-state";
import {
  clearExperiment,
  loadExperiment,
  saveExperiment,
} from "@/lib/experiments/experiment-storage";
import { subscribeToJourneyEvents } from "@/lib/journey/journey-events";

function createExperimentId() {
  return globalThis.crypto?.randomUUID?.() ?? `experiment-${Date.now()}`;
}

export function useExperiment() {
  const [experiment, setExperiment] = useState<Experiment>(() =>
    createInitialExperiment({ id: "loading" }),
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setExperiment(loadExperiment(window.localStorage, createExperimentId));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveExperiment(window.localStorage, experiment);
  }, [experiment, hydrated]);

  useEffect(
    () =>
      subscribeToJourneyEvents((event) => {
        setExperiment((current) => applyExperimentEvent(current, event));
      }),
    [],
  );

  const resetExperiment = useCallback(() => {
    clearExperiment(window.localStorage);
    setExperiment(createInitialExperiment({ id: createExperimentId() }));
  }, []);

  return { experiment, hydrated, resetExperiment };
}
