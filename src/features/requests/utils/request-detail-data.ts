import requestsData from "../../../../data/requests.json";
import requestDetailsData from "../../../../data/request-details.json";
import dashboardData from "../../../../data/dashboard-content.json";
import profilesData from "../../../../data/profiles.json";
import categoriesData from "../../../../data/categories.json";
import currentUserData from "../../../../data/current-user.json";
import type { CardData } from "@/features/dashboard/types";
import type { AskContact } from "@/features/requests/components/HelpRequestDialog";
import { interactions, type MyHelpRequest } from "@/features/interactions/utils/data";
import { TIER_LABELS } from "@/features/profile/components/TrustTierBadge";

export type RequestCard = CardData & { category: string | null };

export type RequestConnectionNode = {
  type: "you" | "connector" | "requester";
  name?: string;
  role: string;
  avatarUrl?: string | null;
  relationship: string | null;
};

export type RequestDetail = {
  audience: string;
  audienceCategory: string;
  topics: string[];
  author: {
    role: string;
    company: string;
    connectionDegree: string;
    trustedFor: string;
  };
  connectionPath: RequestConnectionNode[];
  about: {
    career: string;
    location: string;
    trustedExpertise: string;
  };
  stats: {
    peopleHelped: number;
    requests: number;
    trustRating: string;
  };
};

export type ProfileOpenRequest = {
  requestId: string;
  title: string;
  category?: string;
  description: string;
  endDate?: string;
  responses?: MyHelpRequest["responses"];
  status?: MyHelpRequest["status"];
  type?: MyHelpRequest["type"];
  createdAt?: string;
  promoted?: boolean;
};

type ProfileOwner = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  title: string;
  company: string;
  connectionDegree?: string;
  verifiedSkills?: string[];
  trustScore?: number;
  trustTier?: string;
  peopleHelped?: number;
  totalRequests?: number;
  about?: {
    bio?: string;
    location?: string;
  };
  connectionPath?: RequestConnectionNode[];
  openRequests?: ProfileOpenRequest[];
};

type DashboardContent = {
  askForHelpCard?: {
    contacts?: AskContact[];
  };
};

function trustScoreToTier(score: number) {
  if (score < 150) return "Emerging";
  if (score < 650) return "Reliable";
  if (score < 900) return "Trustworthy";
  if (score < 990) return "Proven";
  return "Stellar";
}

export function trustRatingToTierIndex(rating: string): number {
  return TIER_LABELS.findIndex((tier) => tier === rating);
}

export const currentUserProfile = currentUserData as ProfileOwner;
export const profileOwners = [
  currentUserProfile,
  ...(profilesData as ProfileOwner[]),
];

export const profileOpenRequests: RequestCard[] = profileOwners.flatMap((profile) =>
  (profile.openRequests ?? []).map((request) => ({
    id: request.requestId,
    variant: "circle",
    name: profile.name,
    requestSummary: request.title,
    request: request.description,
    relationshipTag:
      profile.id === currentUserProfile.id
        ? "Your Request"
        : (profile.connectionDegree ?? "Connection"),
    primaryCTA: "View Details",
    avatarUrl: profile.avatarUrl ?? null,
    endDate: request.endDate ?? null,
    category: request.category ?? null,
  })),
);

export const allRequests: RequestCard[] = [
  ...(requestsData as RequestCard[]),
  ...[...interactions.helped, ...interactions.inProgress].map((request) => ({
    id: request.id,
    variant: request.variant ?? "circle",
    name: request.name,
    requestSummary: request.requestSummary,
    request: request.request,
    relationshipTag: request.relationshipTag ?? "Connection",
    primaryCTA: "Chat",
    avatarUrl: request.avatarUrl ?? null,
    endDate: request.endDate ?? null,
    category: request.category ?? null,
  })),
  ...profileOpenRequests,
].filter(
  (request, index, requests) =>
    requests.findIndex((candidate) => candidate.id === request.id) === index,
);

export const synthesizedProfileDetails = Object.fromEntries(
  profileOwners.flatMap((profile) =>
    (profile.openRequests ?? []).map((request) => [
      request.requestId,
      {
        audience: profile.id === currentUserProfile.id ? "My Circle" : "Circle",
        audienceCategory: request.category ?? "Other",
        topics: request.category ? [request.category] : [],
        author: {
          role: profile.title,
          company: profile.company,
          connectionDegree:
            profile.id === currentUserProfile.id
              ? "You"
              : (profile.connectionDegree ?? "1st"),
          trustedFor: (profile.verifiedSkills ?? []).slice(0, 3).join(", "),
        },
        connectionPath: profile.connectionPath ?? [],
        about: {
          career: profile.about?.bio ?? "",
          location: profile.about?.location ?? "",
          trustedExpertise: (profile.verifiedSkills ?? []).join(", "),
        },
        stats: {
          peopleHelped: profile.peopleHelped ?? 0,
          requests:
            profile.totalRequests ?? (profile.openRequests?.length ?? 0),
          trustRating:
            profile.trustTier ?? trustScoreToTier(profile.trustScore ?? 0),
        },
      } satisfies RequestDetail,
    ]),
  ),
);

export const allDetails: Record<string, RequestDetail> = {
  ...synthesizedProfileDetails,
  ...(requestDetailsData as Record<string, RequestDetail>),
};

export const askContacts =
  ((dashboardData as DashboardContent).askForHelpCard?.contacts ?? []) as AskContact[];

export const categoryDisplayNames: Record<string, string> = {};
export const topicToCategorySlug: Record<string, string> = {};
export const slugAlias: Record<string, string> = {};

categoriesData.categories.forEach((category) => {
  categoryDisplayNames[category.slug] = category.displayName;
  topicToCategorySlug[category.slug] = category.slug;
  topicToCategorySlug[category.displayName.toLowerCase()] = category.slug;

  category.aliases.forEach((alias) => {
    topicToCategorySlug[alias.toLowerCase()] = category.slug;
    if (alias.includes("-")) {
      slugAlias[alias] = category.slug;
    }
  });
});
