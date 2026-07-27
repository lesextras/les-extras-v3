"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { UserRole } from "@/lib/stores/useUIStore";

export type Session = {
    token: string;
    user: {
        id: string;
        email: string;
        role: UserRole | "ADMIN";
        onboardingStep: number;
    };
};

const SESSION_COOKIE_NAME = "lesextras_session";

function getSecretKey(): Uint8Array {
    const secret = process.env.SESSION_SECRET;
    if (!secret) throw new Error("SESSION_SECRET environment variable is not set");
    return new TextEncoder().encode(secret);
}

export async function createSession(session: Session) {
    const secretKey = getSecretKey();
    const token = await new SignJWT({ session })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(secretKey);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
        sameSite: "lax",
    });
}

export async function getSession(): Promise<Session | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) return null;

    try {
        const secretKey = getSecretKey();
        const { payload } = await jwtVerify(sessionCookie.value, secretKey);
        return (payload as { session: Session }).session;
    } catch {
        // Invalid or expired token
        return null;
    }
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Returns the role for ESTABLISHMENT or FREELANCE users only.
 * Returns null for ADMIN (ADMIN sessions are handled via the admin cookie, not
 * the front session; this helper is intentionally scoped to front users only).
 * NOTE: this function is currently unused — prefer reading role directly from
 * getSession() to avoid silent null returns for other roles.
 */
export async function getUserRole(): Promise<UserRole | null> {
    const session = await getSession();
    const role = session?.user.role;
    if (role === "ESTABLISHMENT" || role === "FREELANCE") return role;
    return null;
}

export async function requireUser() {
    const session = await getSession();
    if (!session) {
        redirect("/login");
    }
    return session;
}
