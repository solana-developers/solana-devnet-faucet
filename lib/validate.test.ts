import { validate } from "./validate";

// Write some tests for the validate function
describe("validate", () => {
  test("allows reasonable usage", () => {
    validate("DXJfhtWicZwBpHGiBepWwwnJK7jJYNYguGDUgNYbMCCi", 1);
  });

  test("throws when wallet address is a PDA", () => {
    expect(() => {
      validate("4MD31b2GFAWVDYQT8KG7E5GcZiFyy4MpDUt4BcyEdJRP", 1);
    }).toThrow("Please enter valid wallet address.");
  });

  test("throws when wallet address is empty string", () => {
    expect(() => {
      validate("", 1);
    }).toThrow("Missing wallet address.");
  });

  test("throws when amount is 0", () => {
    expect(() => {
      validate("abcdef", 0);
    }).toThrow("Missing SOL amount.");
  });

  test("throws when amount is too large", () => {
    expect(() => {
      validate("abcdef", 6);
    }).toThrow("Requested SOL amount too large.");
  });

  test("throws when wallet address is invalid", () => {
    expect(() => {
      validate("invalidWalletAddress", 1);
    }).toThrow("Please enter valid wallet address.");
  });
});
