import {
  createInitialJourneyState,
  JOURNEY_VERSION,
  type JourneyState,
} from "./journey-state";

export const JOURNEY_STORAGE_KEY = "compound-canvas.learning-journey.v1";

export type JourneyStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function loadJourneyState(storage: JourneyStorage): JourneyState {
  const raw = storage.getItem(JOURNEY_STORAGE_KEY);
  if (!raw) return createInitialJourneyState();
  try {
    const parsed = JSON.parse(raw) as JourneyState;
    if (parsed.version !== JOURNEY_VERSION || !parsed.steps) {
      return createInitialJourneyState();
    }
    const initial = createInitialJourneyState(parsed.updatedAt);
    return {
      ...initial,
      ...parsed,
      steps: { ...initial.steps, ...parsed.steps },
    };
  } catch {
    return createInitialJourneyState();
  }
}

export function saveJourneyState(storage: JourneyStorage, state: JourneyState) {
  storage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(state));
}

export function clearJourneyState(storage: JourneyStorage) {
  storage.removeItem(JOURNEY_STORAGE_KEY);
}
