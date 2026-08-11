import {
  createInitialDrugDesign101Progress,
  normalizeDrugDesign101Progress,
  type DrugDesign101Progress,
} from "./progress";

export const DRUG_DESIGN_101_STORAGE_KEY = "compound-canvas.drug-design-101.v1";

export type DrugDesign101Storage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function loadDrugDesign101Progress(
  storage: DrugDesign101Storage,
): DrugDesign101Progress {
  const raw = storage.getItem(DRUG_DESIGN_101_STORAGE_KEY);
  if (!raw) return createInitialDrugDesign101Progress();
  try {
    return normalizeDrugDesign101Progress(JSON.parse(raw) as Partial<DrugDesign101Progress>);
  } catch {
    return createInitialDrugDesign101Progress();
  }
}

export function saveDrugDesign101Progress(
  storage: DrugDesign101Storage,
  progress: DrugDesign101Progress,
) {
  storage.setItem(DRUG_DESIGN_101_STORAGE_KEY, JSON.stringify(progress));
}

export function clearDrugDesign101Progress(storage: DrugDesign101Storage) {
  storage.removeItem(DRUG_DESIGN_101_STORAGE_KEY);
}
