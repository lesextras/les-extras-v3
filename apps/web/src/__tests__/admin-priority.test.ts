import { describe, expect, it } from "vitest";
import type { AdminUserRow, DeskRequestRow } from "@/app/actions/admin";
import {
  sortDeskRequestsByPriority,
  sortPendingUsersByAge,
} from "@/lib/admin-priority";

function makeDeskRequest(overrides: Partial<DeskRequestRow>): DeskRequestRow {
  return {
    id: "desk-1",
    type: "TECHNICAL_ISSUE",
    priority: "NORMAL",
    status: "OPEN",
    assignedToAdminId: null,
    message: "Message",
    response: null,
    answeredAt: null,
    createdAt: "2026-04-20T10:00:00.000Z",
    mission: { id: "mission-1", title: "Ticket normal" },
    booking: null,
    requester: {
      id: "user-1",
      email: "user@test.fr",
      profile: null,
    },
    assignedToAdmin: null,
    answeredBy: null,
    ...overrides,
  };
}

function makeUser(overrides: Partial<AdminUserRow>): AdminUserRow {
  return {
    id: "user-1",
    name: "Utilisateur",
    email: "user@test.fr",
    role: "FREELANCE",
    status: "PENDING",
    createdAt: "2026-04-20T10:00:00.000Z",
    ...overrides,
  };
}

describe("admin-priority", () => {
  it("trie les tickets par priorité décroissante", () => {
    const sorted = sortDeskRequestsByPriority([
      makeDeskRequest({ id: "low", priority: "LOW" }),
      makeDeskRequest({ id: "urgent", priority: "URGENT" }),
      makeDeskRequest({ id: "high", priority: "HIGH" }),
      makeDeskRequest({ id: "normal", priority: "NORMAL" }),
    ]);

    expect(sorted.map((request) => request.id)).toEqual(["urgent", "high", "normal", "low"]);
  });

  it("place les tickets non assignés avant les assignés à priorité égale", () => {
    const sorted = sortDeskRequestsByPriority([
      makeDeskRequest({ id: "assigned", priority: "HIGH", assignedToAdminId: "admin-1" }),
      makeDeskRequest({ id: "unassigned", priority: "HIGH", assignedToAdminId: null }),
    ]);

    expect(sorted.map((request) => request.id)).toEqual(["unassigned", "assigned"]);
  });

  it("départage les tickets par ancienneté à priorité et assignation égales", () => {
    const sorted = sortDeskRequestsByPriority([
      makeDeskRequest({ id: "recent", createdAt: "2026-04-22T10:00:00.000Z" }),
      makeDeskRequest({ id: "old", createdAt: "2026-04-18T10:00:00.000Z" }),
    ]);

    expect(sorted.map((request) => request.id)).toEqual(["old", "recent"]);
  });

  it("trie les utilisateurs PENDING anciens avant les récents", () => {
    const sorted = sortPendingUsersByAge([
      makeUser({ id: "recent", createdAt: "2026-04-22T10:00:00.000Z" }),
      makeUser({ id: "old", createdAt: "2026-04-18T10:00:00.000Z" }),
    ]);

    expect(sorted.map((user) => user.id)).toEqual(["old", "recent"]);
  });
});
