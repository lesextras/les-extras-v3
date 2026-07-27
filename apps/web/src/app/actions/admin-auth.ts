"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiRequest } from "@/lib/api";

const ADMIN_SESSION_COOKIE = "lesextras_admin_token";
const ADMIN_ROLE = "ADMIN";

type AdminAuthResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: "ESTABLISHMENT" | "FREELANCE" | "ADMIN";
  };
};

type AdminLoginInput = {
  email: string;
  password: string;
};

async function setAdminCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function adminLogin(input: AdminLoginInput): Promise<{ ok: true }> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email || !password) {
    throw new Error("Email et mot de passe requis.");
  }

  const response = await apiRequest<AdminAuthResponse>("/auth/login", {
    method: "POST",
    body: {
      email,
      password,
    },
  });

  if (response.user.role !== ADMIN_ROLE) {
    throw new Error("Accès admin refusé.");
  }

  await setAdminCookie(response.accessToken);
  revalidatePath("/admin");
  return { ok: true };
}

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  revalidatePath("/admin");
  redirect("/admin/login");
}
