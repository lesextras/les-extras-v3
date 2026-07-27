import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { InboxClient } from "@/app/(dashboard)/dashboard/inbox/InboxClient";
import type { ApiConversation, ApiMessage } from "@/actions/messaging";
import type { MessagingConversationSeed } from "@/lib/messaging-v1";

const messagingMocks = vi.hoisted(() => ({
  fetchApiConversations: vi.fn(),
  fetchApiMessages: vi.fn(),
  callMarkAsRead: vi.fn(),
  sendMessage: vi.fn(),
}));

vi.mock("@/actions/messaging", () => ({
  fetchApiConversations: messagingMocks.fetchApiConversations,
  fetchApiMessages: messagingMocks.fetchApiMessages,
  callMarkAsRead: messagingMocks.callMarkAsRead,
  sendMessage: messagingMocks.sendMessage,
}));

const seeds: MessagingConversationSeed[] = [
  {
    id: "booking:MISSION:line-1",
    name: "ESTABLISHMENT Les Lilas",
    context: "Mission SOS",
    source: "BOOKING",
  },
];

const apiConversation: ApiConversation = {
  id: "conv-1",
  updatedAt: "2026-04-26T10:00:00.000Z",
  bookingId: "line-1",
  otherParticipant: {
    id: "establishment-1",
    firstName: null,
    lastName: null,
    avatar: null,
    role: "ESTABLISHMENT",
  },
  lastMessage: {
    content: "Conversation initiée depuis Mission SOS.",
    createdAt: "2026-04-26T10:00:00.000Z",
  },
  unreadCount: 0,
};

let apiMessages: ApiMessage[];

describe("InboxClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    apiMessages = [
      {
        id: "msg-system",
        content: "Conversation initiée depuis Mission SOS.",
        senderId: "system",
        receiverId: "u-freelance",
        conversationId: "conv-1",
        createdAt: "2026-04-26T10:00:00.000Z",
        isRead: true,
      },
    ];
    messagingMocks.fetchApiConversations.mockResolvedValue([apiConversation]);
    messagingMocks.fetchApiMessages.mockImplementation(async () => apiMessages);
    messagingMocks.callMarkAsRead.mockResolvedValue(undefined);
    messagingMocks.sendMessage.mockImplementation(async ({ content }: { content: string }) => {
      apiMessages = [
        ...apiMessages,
        {
          id: "msg-user",
          content,
          senderId: "u-freelance",
          receiverId: "establishment-1",
          conversationId: "conv-1",
          createdAt: "2026-04-26T10:05:00.000Z",
          isRead: true,
        },
      ];

      return { success: true };
    });
  });

  it("affiche les conversations disponibles", async () => {
    render(
      <InboxClient
        currentUserId="u-freelance"
        currentUserRole="FREELANCE"
        initialSeeds={seeds}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByText("ESTABLISHMENT Les Lilas").length).toBeGreaterThan(0);
    });
  });

  it("affiche le thread de la conversation active", async () => {
    render(
      <InboxClient
        currentUserId="u-freelance"
        currentUserRole="FREELANCE"
        initialSeeds={seeds}
      />,
    );

    await waitFor(() => {
      const thread = screen.getByTestId("thread-messages");
      expect(thread).toBeInTheDocument();
      expect(within(thread).getByText(/Conversation initiée depuis Mission SOS/i)).toBeInTheDocument();
    });
  });

  it("envoie un message et refresh le thread", async () => {
    render(
      <InboxClient
        currentUserId="u-freelance"
        currentUserRole="FREELANCE"
        initialSeeds={seeds}
      />,
    );

    const textarea = await screen.findByPlaceholderText(/Votre message/i);
    fireEvent.change(textarea, { target: { value: "Bonjour, je suis disponible." } });
    fireEvent.click(screen.getByRole("button", { name: /Envoyer/i }));

    await waitFor(() => {
      const thread = screen.getByTestId("thread-messages");
      expect(within(thread).getByText("Bonjour, je suis disponible.")).toBeInTheDocument();
    });
  });

  it("affiche l'état vide quand il n'y a aucune conversation", async () => {
    render(
      <InboxClient
        currentUserId="u-freelance"
        currentUserRole="FREELANCE"
        initialSeeds={[]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Aucune conversation/i)).toBeInTheDocument();
    });
  });

  it("affiche l'état erreur quand un message d'erreur initial est fourni", async () => {
    render(
      <InboxClient
        currentUserId="u-freelance"
        currentUserRole="FREELANCE"
        initialSeeds={[]}
        initialLoadError="Impossible de charger les conversations liées à vos missions et ateliers."
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Impossible de charger les conversations/i)).toBeInTheDocument();
    });
  });
});
