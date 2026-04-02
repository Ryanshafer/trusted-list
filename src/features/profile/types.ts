export interface ContributionItem {
  requestId: string;
  requesterName: string;
  requesterAvatarUrl: string | null;
  requesterConnectionDegree: string;
  requesterTrustedFor: string[];
  requestTitle: string;
  feedbackSubject: string;
  feedbackBody: string;
}

export interface OpenRequest {
  requestId: string;
  title: string;
  category: string;
  description: string;
  endDate: string | null;
  responses?: Array<{
    id: string;
    name: string;
    role?: string;
    avatarUrl?: string;
    status: "In Progress" | "Completed";
    chatId: string;
    trustedFor?: string;
  }>;
  status?: "Open" | "Closed";
  type?: "contact" | "circle" | "community";
  createdAt?: string;
  promoted?: boolean;
}

export interface CircleMember {
  userId: string;
  name: string;
  avatarUrl: string | null;
  connectionDegree: string;
  verifiedSkills?: string[];
  /** userId of the person who invited this member — identifies the viewer's sponsor */
  invitedBy?: string | null;
  /** true when the profile owner directly nominated/invited this member */
  invitedByMe?: boolean;
  /** pending invitation — member hasn't joined yet */
  awaiting?: boolean;
}

export interface ConnectionPathNode {
  type: "you" | "connector" | "requester";
  name?: string;
  role: string;
  avatarUrl?: string | null;
  relationship: string | null;
}

export interface Recommendation {
  recommenderName: string;
  recommenderAvatarUrl: string | null;
  recommenderConnectionDegree: string;
  recommenderTrustedFor: string[];
  body: string;
}

export interface OwnWordsEntry {
  question: string;
  answer: string;
}

export interface JobEntry {
  startDate: string;
  endDate: string;
  location: string;
  title: string;
  company: string;
  description?: string;
}

export interface EducationEntry {
  graduationYear: string;
  institution: string;
  location: string;
  degree: string;
  field: string;
}

export type JobStatus = "open_to_right_role" | "actively_looking" | null;

export interface TrustScoreDimension {
  dimension: string;
  value: number;
}

export interface ProfileData {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  title: string;
  company: string;
  trustScore: number;
  trustTier: string;
  jobStatus: JobStatus;
  verifiedSkills: string[];
  connectionDegree?: string | null;
  about: {
    bio: string;
    location: string;
    websiteUrl?: string | null;
    linkedInUrl?: string | null;
    githubUrl?: string | null;
  };
  circle: CircleMember[];
  connectionPath: ConnectionPathNode[];
  openRequests: OpenRequest[];
  contributions: {
    skillsInAction: string[];
    items: ContributionItem[];
  };
  recommendations: Recommendation[];
  inTheirOwnWords: OwnWordsEntry[];
  experience: {
    jobs: JobEntry[];
    education: EducationEntry[];
  };
  trustScoreBreakdown?: TrustScoreDimension[];
}

export interface ViewerData {
  userId?: string;
  name: string;
  firstName: string;
  avatarUrl: string | null;
  role: string;
  sharedConnectionIds?: string[];
}
