import {
  BadgeCheck,
  CreditCard,
  Flag,
  HandHelping,
  MessageSquare,
  MessageSquarePlus,
  ShieldCheck,
  Star,
  UserCheck,
  UserPlus,
  Clock,
} from "lucide-react";
import type * as React from "react";

export type NotificationType =
  | "circle_join_request"
  | "direct_help_request"
  | "skill_validated"
  | "volunteer_offer"
  | "circle_new_request"
  | "new_message"
  | "feedback_received"
  | "recommendation_outcome"
  | "content_flagged"
  | "moderation_decision"
  // Admin-only types
  | "member_application"
  | "payment_failed"
  | "subscription_expiring";

export interface NotificationActor {
  id: string;
  name: string;
  avatarUrl: string | null;
  trustedFor: string[];
}

export interface Notification {
  id: string;
  type: NotificationType;
  read: boolean;
  relativeTime: string;
  actor: NotificationActor | null;
  payload: Record<string, string | undefined>;
}

export const REQUESTS_TYPES: NotificationType[] = [
  "direct_help_request",
  "volunteer_offer",
  "circle_new_request",
  "new_message",
  "feedback_received",
  // Admin
  "member_application",
  "payment_failed",
];

export const CIRCLE_TYPES: NotificationType[] = [
  "circle_join_request",
  "skill_validated",
  // Admin
  "subscription_expiring",
  "content_flagged",
];

export const ACTIONABLE_TYPES: NotificationType[] = [
  "circle_join_request",
  "direct_help_request",
];

export const TYPE_CONFIG: Record<
  NotificationType,
  {
    icon: React.ElementType;
    systemBg: string;
    systemIconColor: string;
    label: string;
  }
> = {
  circle_join_request: {
    icon: UserPlus,
    systemBg: "bg-primary/10",
    systemIconColor: "text-primary",
    label: "Circle request",
  },
  direct_help_request: {
    icon: HandHelping,
    systemBg: "bg-primary/10",
    systemIconColor: "text-primary",
    label: "Help request",
  },
  skill_validated: {
    icon: BadgeCheck,
    systemBg: "bg-primary/10",
    systemIconColor: "text-primary",
    label: "Skill validated",
  },
  volunteer_offer: {
    icon: HandHelping,
    systemBg: "bg-primary/10",
    systemIconColor: "text-primary",
    label: "Volunteer offer",
  },
  circle_new_request: {
    icon: MessageSquarePlus,
    systemBg: "bg-primary/10",
    systemIconColor: "text-primary",
    label: "New request",
  },
  new_message: {
    icon: MessageSquare,
    systemBg: "bg-primary/10",
    systemIconColor: "text-primary",
    label: "New message",
  },
  feedback_received: {
    icon: Star,
    systemBg: "bg-amber-50",
    systemIconColor: "text-amber-500",
    label: "Feedback",
  },
  recommendation_outcome: {
    icon: UserCheck,
    systemBg: "bg-primary/10",
    systemIconColor: "text-primary",
    label: "Recommendation",
  },
  content_flagged: {
    icon: Flag,
    systemBg: "bg-destructive/10",
    systemIconColor: "text-destructive",
    label: "Content flagged",
  },
  moderation_decision: {
    icon: ShieldCheck,
    systemBg: "bg-primary/10",
    systemIconColor: "text-primary",
    label: "Moderation",
  },
  member_application: {
    icon: UserPlus,
    systemBg: "bg-primary/10",
    systemIconColor: "text-primary",
    label: "Application",
  },
  payment_failed: {
    icon: CreditCard,
    systemBg: "bg-destructive/10",
    systemIconColor: "text-destructive",
    label: "Payment failed",
  },
  subscription_expiring: {
    icon: Clock,
    systemBg: "bg-amber-50",
    systemIconColor: "text-amber-500",
    label: "Expiring soon",
  },
};

export function memberHref(name: string) {
  return `/trusted-list/members/${name.toLowerCase().replace(/\s+/g, "-")}`;
}

export function getNotificationBody(notification: Notification): string {
  switch (notification.type) {
    case "circle_join_request":
      return "wants to join your trusted circle";
    case "direct_help_request":
      return `sent you a direct request — "${notification.payload.requestTitle}"`;
    case "skill_validated":
      return `validated your ${notification.payload.skill} skill`;
    case "volunteer_offer":
      return `volunteered to help with "${notification.payload.requestTitle}"`;
    case "circle_new_request":
      return `posted a new help request — "${notification.payload.requestTitle}"`;
    case "new_message":
      return `left a new message on "${notification.payload.requestTitle}"`;
    case "feedback_received":
      return `left feedback on "${notification.payload.requestTitle}"`;
    case "recommendation_outcome": {
      const outcomeMap: Record<string, string> = {
        accepted: "has been accepted and joined the platform",
        waitlisted: "has been placed on the waitlist",
        rejected: "was not accepted at this time",
      };
      return `Your recommendation of ${notification.payload.recommendedName} ${
        outcomeMap[notification.payload.outcome ?? ""] ?? "has been reviewed"
      }`;
    }
    case "content_flagged":
      return `Your request "${notification.payload.requestTitle}" has been flagged and is under review`;
    case "moderation_decision": {
      const decisionMap: Record<string, string> = {
        reinstated: "has been reviewed and reinstated",
        removed: "has been removed for violating community standards",
      };
      return `Your request "${notification.payload.requestTitle}" ${
        decisionMap[notification.payload.decision ?? ""] ?? "has been reviewed"
      }`;
    }
    case "member_application":
      return "applied to join The Trusted List and is awaiting approval";
    case "payment_failed":
      return `Payment of ${notification.payload.amount ?? "—"} failed — subscription has been paused`;
    case "subscription_expiring":
      return `Subscription expires on ${notification.payload.expiresOn ?? "—"} — renewal may be needed`;
    default:
      return "";
  }
}
