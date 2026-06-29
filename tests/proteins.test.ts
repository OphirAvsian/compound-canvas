import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanEgfrChainA,
  importRcsbProtein,
  prepareEgfrDockingInputReceptor,
} from "../lib/proteins";

afterEach(() => vi.unstubAllGlobals());

describe("cleanEgfrChainA", () => {
  it("calls only the fixed curated 2ITY cleanup endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        artifact_id: "proteinprep_2ity_a_abc",
        status: "cleaned_not_docking_ready",
        target: { pdb_id: "2ITY", chain_id: "A" },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await cleanEgfrChainA();

    expect(result.status).toBe("cleaned_not_docking_ready");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/proteins/2ity/prepare",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("surfaces public cleanup errors without substituting an artifact", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ detail: "The pinned source failed checksum validation." }),
      }),
    );

    await expect(cleanEgfrChainA()).rejects.toThrow("checksum validation");
  });
});

describe("importRcsbProtein", () => {
  it("posts a normalized PDB ID to the fixed RCSB import endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "deposited_unprepared", pdb_id: "4HHB" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await importRcsbProtein("4hhb");

    expect(result.status).toBe("deposited_unprepared");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/proteins/import/rcsb",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ pdb_id: "4HHB" }),
      }),
    );
  });

  it("surfaces validation errors without substituting coordinates", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ detail: "RCSB does not have this structure." }),
      }),
    );

    await expect(importRcsbProtein("9zzz")).rejects.toThrow("does not have");
  });
});

describe("prepareEgfrDockingInputReceptor", () => {
  it("calls only the fixed curated 2ITY receptor-preparation endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        artifact_id: "receptor_2ity_a_abc",
        status: "docking_input_prepared_no_docking",
        target: { pdb_id: "2ITY", chain_id: "A" },
        receptor_pdbqt: "ATOM\n",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await prepareEgfrDockingInputReceptor();

    expect(result.status).toBe("docking_input_prepared_no_docking");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/proteins/2ity/prepare-receptor",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("surfaces receptor-preparation errors without substituting PDBQT", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ detail: "The calculation service could not prepare the curated EGFR receptor." }),
      }),
    );

    await expect(prepareEgfrDockingInputReceptor()).rejects.toThrow("could not prepare");
  });
});
