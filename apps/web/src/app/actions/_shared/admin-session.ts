import "server-only";

import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE = "lesextras_admin_token";

export async function getAdminSessionToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    throw new Error("Session admin requise.");
  }

  return token;
}
