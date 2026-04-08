import React from "react";
import type { CardData } from "@/features/dashboard/types";
import type { MyHelpRequest } from "@/features/interactions/utils/data";

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

export const isMyHelpRequestCompleted = (request: MyHelpRequest) =>
  request.status === "Closed" ||
  (request.type === "contact" &&
    request.responses.some((response) => response.status === "Completed"));

export const isMyHelpRequestPaused = (request: MyHelpRequest) =>
  ["circle", "community"].includes(request.type) &&
  request.status !== "Closed" &&
  request.promoted === false;

export const isMyHelpRequestInProgress = (request: MyHelpRequest) =>
  !isMyHelpRequestCompleted(request) && !isMyHelpRequestPaused(request);

export function filterMyHelpRequests(
  requests: MyHelpRequest[],
  filters: SidebarFilters,
  search: string,
) {
  return requests.filter((request) => {
    if (
      filters.audiences.length > 0 &&
      !filters.audiences.includes(request.type)
    ) {
      return false;
    }

    if (
      filters.topics.length > 0 &&
      (!request.category || !filters.topics.includes(request.category))
    ) {
      return false;
    }

    if (filters.statuses.length > 0) {
      const matches =
        (filters.statuses.includes("inProgress") &&
          isMyHelpRequestInProgress(request)) ||
        (filters.statuses.includes("paused") && isMyHelpRequestPaused(request)) ||
        (filters.statuses.includes("completed") &&
          isMyHelpRequestCompleted(request));
      if (!matches) {
        return false;
      }
    }

    if (filters.responses.length > 0) {
      const hasResponses = request.responses.length > 0;
      const matches =
        (filters.responses.includes("none") && !hasResponses) ||
        (filters.responses.includes("has") && hasResponses);
      if (!matches) {
        return false;
      }
    }

    if (
      filters.dateFrom &&
      request.endDate &&
      new Date(request.endDate) < new Date(filters.dateFrom)
    ) {
      return false;
    }

    if (
      filters.dateTo &&
      request.endDate &&
      new Date(request.endDate) > new Date(filters.dateTo)
    ) {
      return false;
    }

    if (search) {
      const query = search.toLowerCase();
      if (
        !request.requestSummary.toLowerCase().includes(query) &&
        !request.request.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    return true;
  });
}

export function sortMyHelpRequestsForDisplay(requests: MyHelpRequest[]) {
  return [...requests].sort((a, b) => {
    const aCompleted = isMyHelpRequestCompleted(a);
    const bCompleted = isMyHelpRequestCompleted(b);

    if (aCompleted && !bCompleted) return 1;
    if (!aCompleted && bCompleted) return -1;

    const aHasDeadline = !!a.endDate;
    const bHasDeadline = !!b.endDate;

    if (aHasDeadline && !bHasDeadline) return -1;
    if (!aHasDeadline && bHasDeadline) return 1;

    if (aHasDeadline && bHasDeadline) {
      return new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime();
    }

    return 0;
  });
}

export function sortMyHelpRequestsByKey(
  requests: MyHelpRequest[],
  key:
    | "request"
    | "endDate"
    | "audience"
    | "topic"
    | "status"
    | "responses"
    | null,
  dir: "asc" | "desc",
) {
  if (!key) {
    return requests;
  }

  const direction = dir === "asc" ? 1 : -1;
  const audienceOrder = { contact: 0, circle: 1, community: 2 };
  const responseScore = (request: MyHelpRequest) => {
    if (request.responses.length === 0) return 0;
    if (request.responses.every((response) => response.status === "Completed")) {
      return 2;
    }
    return 1;
  };
  const statusScore = (request: MyHelpRequest) => {
    if (isMyHelpRequestCompleted(request)) return 2;
    if (isMyHelpRequestPaused(request)) return 1;
    return 0;
  };

  return [...requests].sort((a, b) => {
    switch (key) {
      case "request":
        return direction * a.requestSummary.localeCompare(b.requestSummary);
      case "endDate": {
        const timeA = a.endDate ? new Date(a.endDate).getTime() : Infinity;
        const timeB = b.endDate ? new Date(b.endDate).getTime() : Infinity;
        return direction * (timeA - timeB);
      }
      case "audience":
        return (
          direction *
          (audienceOrder[a.type] - audienceOrder[b.type])
        );
      case "topic":
        return direction * (a.category ?? "").localeCompare(b.category ?? "");
      case "status":
        return direction * (statusScore(a) - statusScore(b));
      case "responses":
        return direction * (responseScore(a) - responseScore(b));
      default:
        return 0;
    }
  });
}

export function computeMyRequestFilterOptions(
  requests: MyHelpRequest[],
): AvailableFilterOptions {
  const topics = new Set<string>();
  let hasContact = false;
  let hasCircle = false;
  let hasCommunity = false;
  let hasInProgress = false;
  let hasPaused = false;
  let hasCompleted = false;
  let hasNoResponses = false;
  let hasWithResponses = false;

  for (const request of requests) {
    if (request.category) topics.add(request.category);
    if (request.type === "contact") hasContact = true;
    if (request.type === "circle") hasCircle = true;
    if (request.type === "community") hasCommunity = true;

    if (isMyHelpRequestCompleted(request)) hasCompleted = true;
    else if (isMyHelpRequestPaused(request)) hasPaused = true;
    else hasInProgress = true;

    if (request.responses.length === 0) hasNoResponses = true;
    else hasWithResponses = true;
  }

  return {
    topics: [...topics].sort(),
    audience: {
      contact: hasContact,
      circle: hasCircle,
      community: hasCommunity,
    },
    statuses: {
      inProgress: hasInProgress,
      paused: hasPaused,
      completed: hasCompleted,
    },
    responses: { none: hasNoResponses, has: hasWithResponses },
  };
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
