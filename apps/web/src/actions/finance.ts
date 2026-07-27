"use server";

import { getSession } from "@/lib/session";
import { apiRequest } from "@/lib/api";

export interface SerializedInvoice {
    id: string;
    invoiceNumber?: string;
    createdAt: string;
    amount: number;
    status: string;
    pdfUrl?: string;
    booking?: {
        scheduledAt?: string;
        establishment?: {
            email?: string;
            profile?: {
                firstName?: string | null;
                lastName?: string | null;
                companyName?: string | null;
            };
        };
        freelance?: {
            email?: string;
            profile?: {
                firstName?: string | null;
                lastName?: string | null;
                companyName?: string | null;
            };
        };
    };
}

export async function getInvoices(): Promise<SerializedInvoice[]> {
    const session = await getSession();
    if (!session) return [];

    return apiRequest<SerializedInvoice[]>("/invoices", {
        method: "GET",
        token: session.token,
    });
}
