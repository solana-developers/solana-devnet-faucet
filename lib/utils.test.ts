import { NextApiRequest } from "next";
import { getHeaderValues } from "./utils";

describe("getHeaderValues", () => {
  it("returns an array of strings when x-forwarded-for is a string", () => {
    const req = {
      headers: {
        "x-forwarded-for": "10.0.0.0",
      },
    } as unknown as NextApiRequest;
    const headerName = "x-forwarded-for";
    const result = getHeaderValues(req, headerName);
    expect(result).toEqual(["10.0.0.0"]);
  });

  it("returns an array of strings when x-forwarded-for is an array", () => {
    const req = {
      headers: {
        "x-forwarded-for": ["10.0.0.0"],
      },
    } as unknown as NextApiRequest;
    const headerName = "x-forwarded-for";
    const result = getHeaderValues(req, headerName);
    expect(result).toEqual(["10.0.0.0"]);
  });

  it("returns an array of strings when x-forwarded-for does not exist", () => {
    const req = {
      headers: {},
    } as unknown as NextApiRequest;
    const headerName = "x-forwarded-for";
    const result = getHeaderValues(req, headerName);
    expect(result).toEqual([]);
  });
});
