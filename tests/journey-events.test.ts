import { afterEach, describe, expect, it, vi } from "vitest";
import {
  emitJourneyEvent,
  JOURNEY_EVENT_NAME,
  subscribeToJourneyEvents,
} from "../lib/journey/journey-events";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("journey semantic events", () => {
  it("emits and subscribes through one semantic event channel", () => {
    const target = new EventTarget();
    vi.stubGlobal("window", target);
    const listener = vi.fn();
    const unsubscribe = subscribeToJourneyEvents(listener);

    emitJourneyEvent({ type: "molecule.viewer_rotated" });

    expect(listener).toHaveBeenCalledWith({ type: "molecule.viewer_rotated" });
    unsubscribe();
    expect(JOURNEY_EVENT_NAME).toBe("compound-canvas:journey-event");
  });
});
