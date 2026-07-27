import "reflect-metadata";
import { UserRole } from "@prisma/client";
import { ROLES_KEY } from "../auth/decorators/roles.decorator";
import { UsersController } from "./users.controller";

describe("UsersController", () => {
  it("réserve l'achat de crédits aux établissements", () => {
    expect(Reflect.getMetadata(ROLES_KEY, UsersController.prototype.buyCredits)).toEqual([
      UserRole.ESTABLISHMENT,
    ]);
  });
});
