import React from "react";
import type { CardData } from "@/features/dashboard/types";

export const variantToAudienceKey = (variant: string) => {
  if (variant === "contact") return "contact";
  if (variant === "community") return "community";
  return "circle";
};

export type SidebarFilters = {
  dateFrom: string;
  dateTo: string;
  audiences: string[];
  topics: string[];
  statuses: string[];
  responses: string[];
};

export const defaultSidebarFilters: SidebarFilters = {
  dateFrom: "",
  dateTo: "",
  audiences: [],
  topics: [],
  statuses: [],
  responses: [],
};

export type AvailableFilterOptions = {
  topics: string[];
  audience: { contact: boolean; circle: boolean; community: boolean };
  statuses: { inProgress: boolean; paused: boolean; completed: boolean };
  responses: { none: boolean; has: boolean };
};

export const countActiveFilters = (filters: SidebarFilters) =>
  filters.audiences.length +
  filters.topics.length +
  filters.statuses.length +
  filters.responses.length +
  (filters.dateFrom ? 1 : 0) +
  (filters.dateTo ? 1 : 0);

export function filterCardData(
  cards: (CardData & { status?: string })[],
  filters: SidebarFilters,
  search: string,
) {
  const fromTime = filters.dateFrom
    ? new Date(filters.dateFrom).getTime()
    : null;
  const toTime = filters.dateTo ? new Date(filters.dateTo).getTime() : null;
  return cards.filter((card) => {
    if (
      filters.audiences.length > 0 &&
      !filters.audiences.includes(variantToAudienceKey(card.variant))
    )
      return false;
    if (
      filters.topics.length > 0 &&
      (!card.category || !filters.topics.includes(card.category))
    )
      return false;
    if (filters.statuses.length > 0) {
      const isCompleted = card.status === "Completed";
      const matches =
        (filters.statuses.includes("completed") && isCompleted) ||
        (filters.statuses.includes("inProgress") && !isCompleted);
      if (!matches) return false;
    }
    if (fromTime && card.endDate && new Date(card.endDate).getTime() < fromTime)
      return false;
    if (toTime && card.endDate && new Date(card.endDate).getTime() > toTime)
      return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !card.requestSummary?.toLowerCase().includes(q) &&
        !card.name?.toLowerCase().includes(q) &&
        !card.request?.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });
}

export function computeCardFilterOptions(
  cards: (CardData & { status?: string })[],
  getStatus?: (card: CardData & { status?: string }) => {
    inProgress: boolean;
    completed: boolean;
  },
): AvailableFilterOptions {
  const topics = new Set<string>();
  let hasCircle = false,
    hasCommunity = false;
  let hasInProgress = false,
    hasCompleted = false;

  for (const c of cards) {
    if (c.category) topics.add(c.category);
    const key = variantToAudienceKey(c.variant);
    if (key === "circle") hasCircle = true;
    if (key === "community") hasCommunity = true;
    if (getStatus) {
      const s = getStatus(c);
      if (s.inProgress) hasInProgress = true;
      if (s.completed) hasCompleted = true;
    }
  }

  return {
    topics: [...topics].sort(),
    audience: { contact: false, circle: hasCircle, community: hasCommunity },
    statuses: {
      inProgress: hasInProgress,
      paused: false,
      completed: hasCompleted,
    },
    responses: { none: false, has: false },
  };
}

export function useSortState<K extends string>(
  initialKey: K | null,
  initialDir: "asc" | "desc" = "asc",
) {
  const [sortKey, setSortKey] = React.useState<K | null>(initialKey);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">(initialDir);
  const handleSort = (key: string) => {
    const k = key as K;
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  };
  return { sortKey, sortDir, handleSort };
}

export type HelpingCardSortKey = "name" | "request" | "endDate" | "audience" | "topic";

export const sortHelpingCards = (
  cards: (CardData & {
    status?: string;
    statusDate?: string;
    karma?: number;
  })[],
  key: HelpingCardSortKey | null,
  dir: "asc" | "desc",
) => {
  if (!key) return cards;
  const d = dir === "asc" ? 1 : -1;
  return [...cards].sort((a, b) => {
    switch (key) {
      case "name":
        return d * (a.name ?? "").localeCompare(b.name ?? "");
      case "request":
        return (
          d * (a.requestSummary ?? "").localeCompare(b.requestSummary ?? "")
        );
      case "endDate": {
        if (!a.endDate && !b.endDate) return 0;
        if (!a.endDate) return d;
        if (!b.endDate) return -d;
        return (
          d * (new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
        );
      }
      case "audience":
        return (
          d *
          variantToAudienceKey(a.variant).localeCompare(
            variantToAudienceKey(b.variant),
          )
        );
      case "topic":
        return d * (a.category ?? "").localeCompare(b.category ?? "");
      default:
        return 0;
    }
  });
};