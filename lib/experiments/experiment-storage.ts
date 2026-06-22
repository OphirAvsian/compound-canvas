import {
  createInitialExperiment,
  EXPERIMENT_SCHEMA_VERSION,
  type Experiment,
} from "./experiment-model";

export const EXPERIMENT_STORAGE_KEY = "compound-canvas.experiment.v1";

export type ExperimentStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function loadExperiment(
  storage: ExperimentStorage,
  createId: () => string,
): Experiment {
  const raw = storage.getItem(EXPERIMENT_STORAGE_KEY);
  if (!raw) return createInitialExperiment({ id: createId() });
  try {
    const parsed = JSON.parse(raw) as Experiment;
    if (
      parsed.schemaVersion !== EXPERIMENT_SCHEMA_VERSION ||
      !parsed.id ||
      !parsed.target ||
      !parsed.workflow
    ) {
      return createInitialExperiment({ id: createId() });
    }
    const initial = createInitialExperiment({
      id: parsed.id,
      now: parsed.createdAt,
    });
    return {
      ...initial,
      ...parsed,
      target: {
        ...initial.target,
        ...parsed.target,
        depositedLigand: parsed.target.depositedLigand
          ? {
              componentId: parsed.target.depositedLigand.componentId,
              name: parsed.target.depositedLigand.name,
              classification: parsed.target.depositedLigand.classification,
              selectedAt: parsed.target.depositedLigand.selectedAt,
            }
          : undefined,
      },
      workflow: {
        ...initial.workflow,
        ...parsed.workflow,
      },
      futurePreparation: {
        ...initial.futurePreparation,
        ...parsed.futurePreparation,
      },
      futureDocking: {
        ...initial.futureDocking,
        ...parsed.futureDocking,
      },
    };
  } catch {
    return createInitialExperiment({ id: createId() });
  }
}

export function saveExperiment(
  storage: ExperimentStorage,
  experiment: Experiment,
) {
  storage.setItem(EXPERIMENT_STORAGE_KEY, JSON.stringify(experiment));
}

export function clearExperiment(storage: ExperimentStorage) {
  storage.removeItem(EXPERIMENT_STORAGE_KEY);
}
