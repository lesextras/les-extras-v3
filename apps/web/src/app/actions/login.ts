"use server";

import { z } from "zod";
import { apiRequest } from "@/lib/api";
import { createSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { UserRole } from "@/lib/stores/useUIStore";
import { MAX_STEP_BY_ROLE } from "@/lib/constants";

const LoginSchema = z.object({
    email: z.string().email({ message: "Email invalide" }),
    password: z.string().min(1, { message: "Mot de passe requis" }),
});

export type LoginState = {
    errors?: {
        email?: string[];
        password?: string[];
        _form?: string[];
    };
    message?: string;
} | undefined;

type AuthResponse = {
    accessToken: string;
    user: {
        id: string;
        email: string;
        role: "ESTABLISHMENT" | "FREELANCE" | "ADMIN";
        onboardingStep: number;
    };
};

export async function login(prevState: LoginState, formData: FormData): Promise<LoginState> {
    const validatedFields = LoginSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { email, password } = validatedFields.data;

    let response: AuthResponse;
    try {
        response = await apiRequest<AuthResponse>("/auth/login", {
            method: "POST",
            body: { email, password },
        });
    } catch (error) {
        return {
            message: "Email ou mot de passe incorrect.",
        };
    }

    const role = response.user.role as "ESTABLISHMENT" | "FREELANCE" | "ADMIN";

    // Admin accounts must authenticate via Le Desk (APP_RUNTIME=desk), not through
    // the front-user login page. Check role BEFORE creating any session.
    if (role === "ADMIN") {
        return {
            message: "Accès refusé. Les comptes administrateurs se connectent via Le Desk.",
        };
    }

    await createSession({
        token: response.accessToken,
        user: {
            id: response.user.id,
            email: response.user.email,
            role: response.user.role as UserRole,
            onboardingStep: response.user.onboardingStep,
        },
    });

    const maxStep = MAX_STEP_BY_ROLE[role as keyof typeof MAX_STEP_BY_ROLE] ?? 2;
    if (response.user.onboardingStep < maxStep) {
        redirect("/wizard");
    }
    redirect("/dashboard");
}
