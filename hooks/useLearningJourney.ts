"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyJourneyEvent,
  createInitialJourneyState,
  type JourneyState,
} from "@/lib/journey/journey-state";
import {
  clearJourneyState,
  loadJourneyState,
  saveJourneyState,
} from "@/lib/journey/journey-storage";
import { subscribeToJourneyEvents } from "@/lib/journey/journey-events";
import { learningMissions } from "@/data/learning-missions";
import { getMissionProgress } from "@/lib/journey/journey-state";

export function useLearningJourney() {
  const [state, setState] = useState<JourneyState>(() => createInitialJourneyState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadJourneyState(window.localStorage));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveJourneyState(window.localStorage, state);
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated) return;
    const index = learningMissions.findIndex(
      (mission) => mission.id === state.activeMissionId,
    );
    const nextMission = learningMissions[index + 1];
    if (
      nextMission &&
      getMissionProgress(state, state.activeMissionId).complete
    ) {
      setState((current) => ({
        ...current,
        activeMissionId: nextMission.id,
        updatedAt: new Date().toISOString(),
      }));
    }
  }, [hydrated, state]);

  useEffect(
    () =>
      subscribeToJourneyEvents((event) => {
        setState((current) => applyJourneyEvent(current, event));
      }),
    [],
  );

  const setActiveMission = useCallback((missionId: string) => {
    setState((current) => ({
      ...current,
      activeMissionId: missionId,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const resetJourney = useCallback(() => {
    clearJourneyState(window.localStorage);
    setState(createInitialJourneyState());
  }, []);

  return { state, hydrated, setActiveMission, resetJourney };
}
