import { describe, expect, it } from "vitest";

const { GET } = await import("@/app/health/route");

describe("health route", () => {
  it("retourne un JSON 200 simple", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      service: "lesextras-web",
    });
  });
});
