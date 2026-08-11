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
  updatedAt: string;
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

  return {
    ...initial,
    ...parsed,
    activeModuleId:
      parsed.activeModuleId && moduleIds.includes(parsed.activeModuleId)
        ? parsed.activeModuleId
        : initial.activeModuleId,
    modules,
    moduleOneFeedbackSeen: Boolean(parsed.moduleOneFeedbackSeen),
    updatedAt: parsed.updatedAt ?? now,
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
