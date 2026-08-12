import { describe, expect, it } from "vitest";
import { normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("strips formatting characters", () => {
    expect(normalizePhone("(555) 010-0100")).toBe("5550100100");
  });

  it("preserves a leading +", () => {
    expect(normalizePhone("+1 555 010 0100")).toBe("+15550100100");
  });

  it("treats equivalent formats as the same number", () => {
    expect(normalizePhone("555-010-0100")).toBe(normalizePhone("555 010 0100"));
  });

  it("trims surrounding whitespace", () => {
    expect(normalizePhone("  5550100100  ")).toBe("5550100100");
  });

  it("returns an empty string for input with no digits", () => {
    expect(normalizePhone("   ")).toBe("");
    expect(normalizePhone("abc")).toBe("");
  });
});
