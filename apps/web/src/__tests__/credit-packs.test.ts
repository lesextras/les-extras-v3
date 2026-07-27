import { describe, expect, it } from "vitest";
import { CREDIT_PACKS } from "@/lib/credit-packs";

describe("credit packs", () => {
  it("conserve les montants et crédits validés", () => {
    expect(
      CREDIT_PACKS.map(({ id, price, credits }) => ({ id, price, credits })),
    ).toEqual([
      { id: "STARTER", price: 150, credits: 1 },
      { id: "PRO", price: 400, credits: 3 },
      { id: "ENTERPRISE", price: 600, credits: 5 },
    ]);
  });
});
