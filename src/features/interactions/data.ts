import type { CardData } from "@/features/dashboard/types";
import data from "../../../data/interactions.json";
import chats from "../../../data/interactions-chats.json";

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
  myRequests: Array<
    InteractionCard & {
      responses: HelperResponse[];
      type: "contact" | "circle" | "community";
      createdAt: string;
    }
  >;
  myHelpRequests: MyHelpRequest[];
};

const parsed = data as InteractionsData;
const chatHistory = chats as Record<string, RawMessage[]>;

export const interactions = {
  helped: parsed.helped.map((card) => ({ ...card, karma: card.karma ?? 50 })),
  inProgress: parsed.inProgress,
  myRequests: parsed.myRequests,
};

export const myHelpRequests = parsed.myHelpRequests;
export const interactionChats = chatHistory;
