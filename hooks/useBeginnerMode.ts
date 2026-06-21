"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadBeginnerMode,
  saveBeginnerMode,
} from "@/lib/beginner-mode";

export function useBeginnerMode() {
  const [enabled, setEnabled] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEnabled(loadBeginnerMode(window.localStorage));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveBeginnerMode(window.localStorage, enabled);
  }, [enabled, hydrated]);

  const toggle = useCallback(() => setEnabled((current) => !current), []);

  return { enabled, hydrated, toggle };
}

