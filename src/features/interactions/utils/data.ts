import type { CardData } from "@/features/dashboard/types";
import data from "../../../../data/interactions.json";
import chats from "../../../../data/interactions-chats.json";
import currentUser from "../../../../data/current-user.json";

export type RawMessage = {
  id: number;
  sender: string;
  text: string;
  timestamp?: string;
};

export type InteractionCard = CardData & {
  status?: string;
  statusDate?: string;
  karma?: number;
};

export type HelperResponse = {
  id: string;
  name: string;
  role?: string;
  trustedFor?: string;
  avatarUrl?: string;
  status: "In Progress" | "Completed";
  chatId: string;
};

export type MyHelpRequest = {
  id: string;
  requestSummary: string;
  request: string;
  responses: HelperResponse[];
  status: "Open" | "Closed";
  type: "contact" | "circle" | "community";
  category?: string;
  createdAt: string;
  promoted?: boolean;
  endDate?: string;
};

type InteractionsData = {
  helped: InteractionCard[];
  inProgress: InteractionCard[];
};

const parsed = data as InteractionsData;
const chatHistory = chats as Record<string, RawMessage[]>;

const categorySlugMap: Record<string, string> = {
  "career advice": "career",
  "career development": "career",
  design: "design",
  product: "product",
  business: "business",
  wellness: "health",
  health: "health",
  education: "education",
  networking: "network",
  network: "network",
  "dev & tools": "tech",
  tech: "tech",
  other: "other",
};

const normalizeRequestCategory = (category?: string | null) => {
  if (!category) return undefined;
  return categorySlugMap[category.trim().toLowerCase()] ?? "other";
};

const currentUserRequests = ((currentUser as any).openRequests ?? []).map((request: any) => ({
  id: request.requestId,
  requestSummary: request.title,
  request: request.description,
  responses: request.responses ?? [],
  status: request.status ?? ("Open" as const),
  type: request.type ?? ("circle" as const),
  category: normalizeRequestCategory(request.category),
  createdAt: request.createdAt ?? request.endDate ?? "",
  promoted: request.promoted ?? true,
  endDate: request.endDate ?? undefined,
}));

export const interactions = {
  helped: parsed.helped.map((card) => ({ ...card, karma: card.karma ?? 50 })),
  inProgress: parsed.inProgress,
  myRequests: currentUserRequests,
};

export const myHelpRequests = currentUserRequests;
export const interactionChats = chatHistory;
