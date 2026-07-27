"use server";

import { z } from "zod";
import { getSession } from "@/lib/session";
import { apiRequest, toUserFacingApiError } from "@/lib/api";
import { revalidatePath } from "next/cache";

const sendMessageSchema = z.object({
    receiverId: z.string(),
    content: z.string().min(1, "Le message ne peut pas être vide"),
});

export type SendMessageData = z.infer<typeof sendMessageSchema>;

export async function sendMessage(data: SendMessageData) {
    const session = await getSession();

    if (!session) {
        return { error: "Non connecté" };
    }

    const validatedFields = sendMessageSchema.safeParse(data);

    if (!validatedFields.success) {
        return { error: "Données invalides" };
    }

    try {
        await apiRequest("/conversations/messages", {
            method: "POST",
            token: session.token,
            body: validatedFields.data,
        });

        revalidatePath("/dashboard/inbox");
        return { success: true };
    } catch (error) {
        console.error("SendMessage error:", error);
        return { error: toUserFacingApiError(error, "Erreur lors de l'envoi du message") };
    }
}

export async function getUnreadMessagesCount() {
    const session = await getSession();
    if (!session) return 0;

    try {
        const conversations = await apiRequest<{ unreadCount: number }[]>("/conversations", {
            token: session.token,
        });
        return conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
    } catch {
        return 0;
    }
}

export type ApiConversation = {
  id: string;
  updatedAt: string;
  bookingId: string | null;
  otherParticipant: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    role: string;
  };
  lastMessage: { content: string; createdAt: string } | null;
  unreadCount: number;
};

export type ApiMessage = {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  createdAt: string;
  isRead: boolean;
};

export async function fetchApiConversations(): Promise<ApiConversation[]> {
  const session = await getSession();
  if (!session) return [];
  try {
    return await apiRequest<ApiConversation[]>("/conversations", { token: session.token });
  } catch {
    return [];
  }
}

export async function fetchApiMessages(conversationId: string): Promise<ApiMessage[]> {
  const session = await getSession();
  if (!session) return [];
  try {
    return await apiRequest<ApiMessage[]>(`/conversations/${conversationId}/messages`, {
      token: session.token,
    });
  } catch {
    return [];
  }
}

export async function callMarkAsRead(conversationId: string): Promise<void> {
  const session = await getSession();
  if (!session) return;
  try {
    await apiRequest(`/conversations/${conversationId}/read`, {
      method: "PATCH" as const,
      token: session.token,
    });
  } catch {
    // ignore — best effort
  }
}

export async function getNotifications() {
    const session = await getSession();
    if (!session) return [];

    try {
        return await apiRequest<{
            id: string;
            message: string;
            type: string;
            isRead: boolean;
            createdAt: string;
        }[]>("/notifications", {
            method: "GET",
            token: session.token,
        });
    } catch {
        return [];
    }
}

export async function markNotificationAsRead(id: string) {
    const session = await getSession();
    if (!session) return { success: false };

    try {
        await apiRequest(`/notifications/${id}/read`, {
            method: "PATCH" as const,
            token: session.token,
        });
        revalidatePath("/dashboard/inbox");
        return { success: true };
    } catch {
        return { success: false };
    }
}
