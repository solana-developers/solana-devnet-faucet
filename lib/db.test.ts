import { describe, expect, test } from "@jest/globals";
import { Row, checkLimits } from "./db";
import { Pool } from "pg";
import { MINUTES } from "./constants";
const log = console.log;

let mockRows: Array<Row> = [];

// Make a mock for the pg Pool constructor
// https://jestjs.io/docs/mock-functions#mocking-modules
jest.mock("pg", () => {
  return {
    Pool: jest.fn(() => ({
      query: jest.fn(() => {
        return {
          rows: mockRows,
        };
      }),
    })),
  };
});

describe("checkLimits", () => {
  // TODO: ideally I'd like to use mockValueOnce() instead of the
  // mockRows variable, but I couldn't get it to work.
  test("is fine when there's no previous usage", async () => {
    mockRows = [];
    await checkLimits("1.1.1.1");
  });

  test("allows reasonable usage", async () => {
    mockRows = [
      {
        timestamps: [Date.now() - 10 * MINUTES],
      },
    ];
    await checkLimits("1.1.1.1");
  });

  test("blocks unreasonable usage", async () => {
    mockRows = [
      {
        timestamps: [
          Date.now() - 10 * MINUTES,
          Date.now() - 10 * MINUTES,
          Date.now() - 10 * MINUTES,
          Date.now() - 10 * MINUTES,
        ],
      },
    ];
    await expect(checkLimits("1.1.1.1")).rejects.toThrow(
      "You have exceeded the 2 airdrops limit in the past 1 hour(s)"
    );
  });
});
