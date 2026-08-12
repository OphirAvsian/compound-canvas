import {
  drugDesign101Modules,
  type DrugDesign101ModuleId,
} from "../../data/drug-design-101-modules";

export const DRUG_DESIGN_101_VERSION = 1;

export type ModuleStatus = "locked" | "available" | "complete";

export type ModuleProgress = {
  status: ModuleStatus;
  completedAt?: string;
};

export type DrugDesign101Progress = {
  version: typeof DRUG_DESIGN_101_VERSION;
  activeModuleId: DrugDesign101ModuleId;
  modules: Record<DrugDesign101ModuleId, ModuleProgress>;
  moduleOneAnswerId?: string;
  moduleOneFeedbackSeen: boolean;
  moduleTwoDemoStep: number;
  moduleTwoPredictionAnswerId?: string;
  moduleTwoAssessmentAnswerId?: string;
  moduleLearning: Partial<Record<DrugDesign101ModuleId, ModuleLearningProgress>>;
  updatedAt: string;
};

export type ModuleLearningProgress = {
  demoStep: number;
  predictionAnswerId?: string;
  assessmentAnswerId?: string;
  selectedCandidateId?: string;
};

const moduleIds = drugDesign101Modules.map((module) => module.id);

export function createInitialDrugDesign101Progress(
  now = new Date().toISOString(),
): DrugDesign101Progress {
  return {
    version: DRUG_DESIGN_101_VERSION,
    activeModuleId: "what-is-a-drug",
    modules: Object.fromEntries(
      drugDesign101Modules.map((module) => [
        module.id,
        {
          status: module.id === "what-is-a-drug" ? "available" : "locked",
        },
      ]),
    ) as Record<DrugDesign101ModuleId, ModuleProgress>,
    moduleOneFeedbackSeen: false,
    moduleTwoDemoStep: 0,
    moduleLearning: {},
    updatedAt: now,
  };
}

export function normalizeDrugDesign101Progress(
  parsed: Partial<DrugDesign101Progress> | null | undefined,
  now = new Date().toISOString(),
): DrugDesign101Progress {
  const initial = createInitialDrugDesign101Progress(now);
  if (!parsed || parsed.version !== DRUG_DESIGN_101_VERSION || !parsed.modules) {
    return initial;
  }

  const modules = { ...initial.modules };
  for (const moduleId of moduleIds) {
    const progress = parsed.modules[moduleId];
    if (
      progress?.status === "locked" ||
      progress?.status === "available" ||
      progress?.status === "complete"
    ) {
      modules[moduleId] = {
        status: progress.status,
        completedAt: progress.completedAt,
      };
    }
  }
  let sequenceOpen = true;
  for (const moduleId of moduleIds) {
    if (!sequenceOpen) {
      modules[moduleId] = { status: "locked" };
      continue;
    }
    if (modules[moduleId].status === "complete") continue;
    modules[moduleId] = { status: "available" };
    sequenceOpen = false;
  }

  const requestedActiveModuleId =
    parsed.activeModuleId && moduleIds.includes(parsed.activeModuleId)
      ? parsed.activeModuleId
      : initial.activeModuleId;
  const activeModuleId =
    modules[requestedActiveModuleId]?.status === "locked"
      ? moduleIds.find((moduleId) => modules[moduleId].status === "available") ?? initial.activeModuleId
      : requestedActiveModuleId;

  return {
    ...initial,
    ...parsed,
    activeModuleId,
    modules,
    moduleOneFeedbackSeen: Boolean(parsed.moduleOneFeedbackSeen),
    moduleTwoDemoStep:
      typeof parsed.moduleTwoDemoStep === "number"
        ? Math.max(0, Math.min(2, parsed.moduleTwoDemoStep))
        : initial.moduleTwoDemoStep,
    moduleTwoPredictionAnswerId: parsed.moduleTwoPredictionAnswerId,
    moduleTwoAssessmentAnswerId: parsed.moduleTwoAssessmentAnswerId,
    moduleLearning: normalizeModuleLearning(parsed.moduleLearning),
    updatedAt: parsed.updatedAt ?? now,
  };
}

function normalizeModuleLearning(
  value: DrugDesign101Progress["moduleLearning"] | undefined,
): DrugDesign101Progress["moduleLearning"] {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    moduleIds.flatMap((moduleId) => {
      const entry = value[moduleId];
      if (!entry || typeof entry !== "object") return [];
      return [[moduleId, {
        demoStep: typeof entry.demoStep === "number" ? Math.max(0, Math.min(4, entry.demoStep)) : 0,
        predictionAnswerId: typeof entry.predictionAnswerId === "string" ? entry.predictionAnswerId : undefined,
        assessmentAnswerId: typeof entry.assessmentAnswerId === "string" ? entry.assessmentAnswerId : undefined,
        selectedCandidateId: typeof entry.selectedCandidateId === "string" ? entry.selectedCandidateId : undefined,
      }]];
    }),
  );
}

export function updateModuleLearning(
  progress: DrugDesign101Progress,
  moduleId: DrugDesign101ModuleId,
  update: Partial<ModuleLearningProgress>,
  now = new Date().toISOString(),
): DrugDesign101Progress {
  const current = progress.moduleLearning[moduleId] ?? { demoStep: 0 };
  return {
    ...progress,
    moduleLearning: {
      ...progress.moduleLearning,
      [moduleId]: {
        ...current,
        ...update,
        demoStep: Math.max(0, Math.min(4, update.demoStep ?? current.demoStep)),
      },
    },
    updatedAt: now,
  };
}

export function answerModuleOne(
  progress: DrugDesign101Progress,
  answerId: string,
  now = new Date().toISOString(),
): DrugDesign101Progress {
  return {
    ...progress,
    moduleOneAnswerId: answerId,
    moduleOneFeedbackSeen: true,
    updatedAt: now,
  };
}

export function completeModule(
  progress: DrugDesign101Progress,
  moduleId: DrugDesign101ModuleId,
  now = new Date().toISOString(),
): DrugDesign101Progress {
  if (progress.modules[moduleId]?.status === "locked") return progress;
  const nextModule = drugDesign101Modules.find(
    (module) => module.number === (drugDesign101Modules.find((candidate) => candidate.id === moduleId)?.number ?? 0) + 1,
  );

  return {
    ...progress,
    activeModuleId: nextModule?.id ?? moduleId,
    modules: {
      ...progress.modules,
      [moduleId]: { status: "complete", completedAt: now },
      ...(nextModule ? { [nextModule.id]: { status: "available" as const } } : {}),
    },
    updatedAt: now,
  };
}

export function advanceModuleTwoDemo(
  progress: DrugDesign101Progress,
  now = new Date().toISOString(),
): DrugDesign101Progress {
  return {
    ...progress,
    moduleTwoDemoStep: Math.min(2, progress.moduleTwoDemoStep + 1),
    updatedAt: now,
  };
}

export function answerModuleTwoPrediction(
  progress: DrugDesign101Progress,
  answerId: string | null,
  now = new Date().toISOString(),
): DrugDesign101Progress {
  return {
    ...progress,
    moduleTwoPredictionAnswerId: answerId ?? undefined,
    updatedAt: now,
  };
}

export function answerModuleTwoAssessment(
  progress: DrugDesign101Progress,
  answerId: string | null,
  now = new Date().toISOString(),
): DrugDesign101Progress {
  return {
    ...progress,
    moduleTwoAssessmentAnswerId: answerId ?? undefined,
    updatedAt: now,
  };
}

export function getDrugDesign101ProgressSummary(progress: DrugDesign101Progress) {
  const completed = drugDesign101Modules.filter(
    (module) => progress.modules[module.id]?.status === "complete",
  ).length;
  return {
    completed,
    total: drugDesign101Modules.length,
    percent: Math.round((completed / drugDesign101Modules.length) * 100),
  };
}
