export const BEGINNER_MODE_STORAGE_KEY = "compound-canvas.beginner-mode.v1";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function loadBeginnerMode(storage: StorageLike) {
  const stored = storage.getItem(BEGINNER_MODE_STORAGE_KEY);
  if (stored === null) return true;
  return stored !== "off";
}

export function saveBeginnerMode(storage: StorageLike, enabled: boolean) {
  storage.setItem(BEGINNER_MODE_STORAGE_KEY, enabled ? "on" : "off");
}

