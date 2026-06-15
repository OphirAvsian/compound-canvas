import type { Experiment } from "./experiment-model";

export function serializeExperimentSummary(experiment: Experiment) {
  return JSON.stringify(experiment, null, 2);
}

export function experimentFilename(experiment: Experiment) {
  return `compound-canvas-${experiment.id}.json`;
}
