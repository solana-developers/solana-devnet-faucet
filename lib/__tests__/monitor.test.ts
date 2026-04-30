import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { buildChartData, type Balance } from "@/lib/monitor";
import { FAUCET_ACCOUNTS } from "@/lib/constants";

const fixturePath = path.join(__dirname, "fixtures/balances.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf-8")) as {
  results: Balance[];
};

const RETIRED_WEB_KEY = "devwuNsNYACyiEYxRNqMNseBpNnGfnd4ZwNHL7sphqv";

describe("buildChartData", () => {
  it("fixture sanity: contains the retired web key the filter should exclude", () => {
    const accounts = new Set(fixture.results.map(r => r.account));
    expect(accounts.has(RETIRED_WEB_KEY)).toBe(true);
  });

  it("drops rows for accounts not in FAUCET_ACCOUNTS", () => {
    const out = buildChartData(fixture.results);
    for (const row of out) {
      for (const key of Object.keys(row)) {
        if (key === "name") continue;
        expect(FAUCET_ACCOUNTS).toContain(key);
      }
    }
  });

  it("never surfaces the retired web key", () => {
    const out = buildChartData(fixture.results);
    const leaked = out.some(row => RETIRED_WEB_KEY in row);
    expect(leaked).toBe(false);
  });

  it("groups rows by date with one entry per distinct date", () => {
    const distinctDates = new Set(
      fixture.results
        .filter(r => (FAUCET_ACCOUNTS as readonly string[]).includes(r.account))
        .map(r => r.date),
    );
    const out = buildChartData(fixture.results);
    expect(out).toHaveLength(distinctDates.size);
  });

  it("returns an empty array on empty input", () => {
    expect(buildChartData([])).toEqual([]);
  });

  it("returns an empty array when all rows are unknown accounts", () => {
    const onlyRetired = fixture.results.filter(
      r => r.account === RETIRED_WEB_KEY,
    );
    expect(onlyRetired.length).toBeGreaterThan(0);
    expect(buildChartData(onlyRetired)).toEqual([]);
  });
});
