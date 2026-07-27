"use server";

import { deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function logout(): Promise<never> {
    await deleteSession();
    redirect("/login");
}
