export type SectionKey = "circle" | "network" | "opportunities";
export type CardVariant = SectionKey;

export type CardData = {
  id: string;
  variant: CardVariant;
  name: string;
  subtitle?: string | null;
  requestSummary?: string | null;
  request: string;
  relationshipTag: string;
  primaryCTA: string;
  secondaryCTA?: string;
  connectedVia?: string | null;
  connectedBy?: string | null;
  connectionReason?: string | null;
  profession?: string | null;
  level?: string | null;
  avatarUrl?: string | null;
  endDate?: string | null; // ISO date string or null for ongoing
};

export type UserProfile = {
  name: string;
  role: string;
};

export type NavLink = {
  label: string;
  href: string;
  active: boolean;
};
