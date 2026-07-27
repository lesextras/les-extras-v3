import { UserRole, UserStatus } from "@prisma/client";

export type JwtPayload = {
  email: string;
  sub: string;
  role: UserRole;
  onboardingStep: number;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  onboardingStep: number;
};
