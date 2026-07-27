"use server";

import { apiRequest } from "@/lib/api";

export type DemoRole = "ESTABLISHMENT" | "FREELANCE" | "ADMIN";

type DemoAuthSession = {
  token: string;
  userId: string;
};

type AuthResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: DemoRole;
  };
};

const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD ?? "password123";
const AUTH_ENDPOINT = "/auth/login";

const DEMO_CREDENTIALS: Record<DemoRole, { email: string }> = {
  ESTABLISHMENT: { email: "directeur@mecs-avenir.fr" },
  FREELANCE: { email: "karim.educ@gmail.com" },
  ADMIN: { email: "admin@lesextras.local" },
};

const authCache = new Map<DemoRole, DemoAuthSession>();

export async function getDemoAuth(role: DemoRole): Promise<DemoAuthSession> {
  const cached = authCache.get(role);
  if (cached) {
    return cached;
  }

  const credentials = DEMO_CREDENTIALS[role];

  try {
    const response = await apiRequest<AuthResponse>(AUTH_ENDPOINT, {
      method: "POST",
      body: {
        email: credentials.email,
        password: DEMO_PASSWORD,
      },
    });

    if (response.user.role !== role) {
      throw new Error(
        `Role mismatch for demo user (expected=${role}, got=${response.user.role}).`,
      );
    }

    const session = {
      token: response.accessToken,
      userId: response.user.id,
    };

    authCache.set(role, session);
    return session;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown auth error";
    throw new Error(
      `Impossible de connecter le compte démo ${role}. endpoint=${AUTH_ENDPOINT}; cause=${message}; vérifiez DEMO_USER_PASSWORD et le seed API.`,
    );
  }
}
