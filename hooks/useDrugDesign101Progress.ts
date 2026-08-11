"use client";

import { useCallback, useEffect, useState } from "react";
import type { DrugDesign101ModuleId } from "@/data/drug-design-101-modules";
import {
  answerModuleOne,
  completeModule,
  createInitialDrugDesign101Progress,
  type DrugDesign101Progress,
} from "@/lib/drug-design-101/progress";
import {
  clearDrugDesign101Progress,
  loadDrugDesign101Progress,
  saveDrugDesign101Progress,
} from "@/lib/drug-design-101/storage";

export function useDrugDesign101Progress() {
  const [progress, setProgress] = useState<DrugDesign101Progress>(() =>
    createInitialDrugDesign101Progress(),
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProgress(loadDrugDesign101Progress(window.localStorage));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveDrugDesign101Progress(window.localStorage, progress);
  }, [hydrated, progress]);

  const answerModuleOneQuestion = useCallback((answerId: string) => {
    setProgress((current) => answerModuleOne(current, answerId));
  }, []);

  const completeDrugDesign101Module = useCallback((moduleId: DrugDesign101ModuleId) => {
    setProgress((current) => completeModule(current, moduleId));
  }, []);

  const resetDrugDesign101 = useCallback(() => {
    clearDrugDesign101Progress(window.localStorage);
    setProgress(createInitialDrugDesign101Progress());
  }, []);

  return {
    progress,
    hydrated,
    answerModuleOneQuestion,
    completeDrugDesign101Module,
    resetDrugDesign101,
  };
}
