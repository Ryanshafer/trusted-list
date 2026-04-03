"use client";

import * as React from "react";
import {
  BadgeCheck,
  Bell,
  CheckCheck,
  Flag,
  HandHelping,
  MessageSquare,
  MessageSquarePlus,
  ShieldCheck,
  Star,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { UserIdentityLink } from "@/components/UserIdentityLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatMultiHelperModal } from "@/features/dashboard/components/ChatMultiHelperModal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NotificationType =
  | "circle_join_request"
  | "direct_help_request"
  | "skill_validated"
  | "volunteer_offer"
  | "circle_new_request"
  | "new_message"
  | "feedback_received"
  | "recommendation_outcome"
  | "content_flagged"
  | "moderation_decision";

interface NotificationActor {
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

export interface NotificationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function memberHref(name: string) {
  return `/trusted-list/members/${name.toLowerCase().replace(/\s+/g, "-")}`;
}

const REQUESTS_TYPES: NotificationType[] = [
  "direct_help_request",
  "volunteer_offer",
  "circle_new_request",
  "new_message",
  "feedback_received",
];
const CIRCLE_TYPES: NotificationType[] = [
  "circle_join_request",
  "skill_validated",
];
const ACTIONABLE_TYPES: NotificationType[] = [
  "circle_join_request",
  "direct_help_request",
];

// Per-type config: icon and system avatar background/icon for platform notifications
const TYPE_CONFIG: Record<
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
};

function getNotificationBody(notif: Notification): string {
  switch (notif.type) {
    case "circle_join_request":
      return "wants to join your trusted circle";
    case "direct_help_request":
      return `sent you a direct request — "${notif.payload.requestTitle}"`;
    case "skill_validated":
      return `validated your ${notif.payload.skill} skill`;
    case "volunteer_offer":
      return `volunteered to help with "${notif.payload.requestTitle}"`;
    case "circle_new_request":
      return `posted a new help request — "${notif.payload.requestTitle}"`;
    case "new_message":
      return `left a new message on "${notif.payload.requestTitle}"`;
    case "feedback_received":
      return `left feedback on "${notif.payload.requestTitle}"`;
    case "recommendation_outcome": {
      const outcomeMap: Record<string, string> = {
        accepted: "has been accepted and joined the platform",
        waitlisted: "has been placed on the waitlist",
        rejected: "was not accepted at this time",
      };
      return `Your recommendation of ${notif.payload.recommendedName} ${
        outcomeMap[notif.payload.outcome ?? ""] ?? "has been reviewed"
      }`;
    }
    case "content_flagged":
      return `Your request "${notif.payload.requestTitle}" has been flagged and is under review`;
    case "moderation_decision": {
      const decisionMap: Record<string, string> = {
        reinstated: "has been reviewed and reinstated",
        removed: "has been removed for violating community standards",
      };
      return `Your request "${notif.payload.requestTitle}" ${
        decisionMap[notif.payload.decision ?? ""] ?? "has been reviewed"
      }`;
    }
    default:
      return "";
  }
}

// ---------------------------------------------------------------------------
// System avatar (for platform notifications with no actor)
// ---------------------------------------------------------------------------

function SystemAvatar({ type }: { type: NotificationType }) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;
  return (
    <div
      className={cn(
        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
        config.systemBg,
      )}
    >
      <Icon className={cn("h-4 w-4", config.systemIconColor)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notification row
// ---------------------------------------------------------------------------

function NotificationRow({
  notif,
  onMarkRead,
}: {
  notif: Notification;
  onMarkRead: (id: string) => void;
}) {
  const [circleActionTaken, setCircleActionTaken] = React.useState<
    "accepted" | "declined" | null
  >(null);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [helpDeclined, setHelpDeclined] = React.useState(false);

  const handleRowClick = () => {
    if (!notif.read) onMarkRead(notif.id);
  };

  const handleCircleAction = (action: "accepted" | "declined") => {
    setCircleActionTaken(action);
    onMarkRead(notif.id);
  };

  const handleHelpOpen = () => {
    setHelpOpen(true);
    onMarkRead(notif.id);
  };

  const handleHelpDecline = () => {
    setHelpDeclined(true);
    onMarkRead(notif.id);
  };

  const isActionable = ACTIONABLE_TYPES.includes(notif.type);
  const body = getNotificationBody(notif);

  return (
    <>
      <div
        role={isActionable ? undefined : "button"}
        tabIndex={isActionable ? undefined : 0}
        onClick={isActionable ? undefined : handleRowClick}
        onKeyDown={
          isActionable
            ? undefined
            : (e) => {
                if (e.key === "Enter" || e.key === " ") handleRowClick();
              }
        }
        className={cn(
          "flex items-start gap-2 p-5 border-b border-border/50 transition-colors",
          !isActionable && "cursor-pointer hover:bg-muted/50",
          !notif.read && "bg-primary/[0.035]",
        )}
      >
        {/* Unread dot — h-10 wrapper centers the dot with the avatar */}
        <div className="flex items-center justify-center shrink-0 w-2 h-10 self-start">
          <div
            className={cn(
              "h-2 w-2 rounded-full transition-colors",
              notif.read ? "bg-transparent" : "bg-primary",
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-0">
          {/* Person row + timestamp */}
          <div className="flex items-center justify-between gap-2">
            {notif.actor ? (
              <UserIdentityLink
                avatarUrl={notif.actor.avatarUrl}
                name={notif.actor.name}
                href={memberHref(notif.actor.name)}
                avatarSize="sm"
                showTrustedFor={false}
                groupClass="group/person"
                className="min-w-0"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              />
            ) : (
              <div className="flex items-center gap-3">
                <SystemAvatar type={notif.type} />
                <span className="text-lg font-bold text-card-foreground leading-7">
                  The Trusted List
                </span>
              </div>
            )}
            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
              {notif.relativeTime}
            </span>
          </div>

          {/* Body + actions — pl-[52px] aligns with name (avatar w-10 + gap-3) */}
          <div className="flex flex-col gap-4 pl-[52px]">
            <p className="text-sm text-muted-foreground leading-5">{body}</p>

            {notif.type === "circle_join_request" && (
              <div className="flex items-center gap-3">
                {circleActionTaken ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full border-transparent py-1",
                      circleActionTaken === "accepted"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {circleActionTaken === "accepted" ? "Accepted" : "Declined"}
                  </Badge>
                ) : (
                  <>
                    <Button
                      size="sm"
                      className="h-6 rounded-full font-semibold text-xs px-3"
                      onClick={() => handleCircleAction("accepted")}
                    >
                      Accept {notif.actor?.name.split(" ")[0]}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 rounded-full font-semibold text-xs px-3"
                      onClick={() => handleCircleAction("declined")}
                    >
                      Decline
                    </Button>
                  </>
                )}
              </div>
            )}

            {notif.type === "direct_help_request" && (
              <div className="flex items-center gap-3">
                {helpDeclined ? (
                  <Badge
                    variant="outline"
                    className="rounded-full border-transparent py-1 bg-muted text-muted-foreground"
                  >
                    Declined
                  </Badge>
                ) : (
                  <>
                    <Button
                      size="sm"
                      className="h-6 rounded-full font-semibold text-xs px-3"
                      onClick={handleHelpOpen}
                    >
                      Help {notif.actor?.name.split(" ")[0]}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 rounded-full font-semibold text-xs px-3"
                      onClick={handleHelpDecline}
                    >
                      Decline
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ChatMultiHelperModal for direct help requests */}
      {notif.type === "direct_help_request" && notif.actor && (
        <ChatMultiHelperModal
          open={helpOpen}
          onOpenChange={setHelpOpen}
          title={notif.payload.requestTitle}
          contacts={[
            {
              id: notif.actor.id,
              name: notif.actor.name,
              role: notif.actor.trustedFor[0] ?? "",
              trustedFor: notif.actor.trustedFor.join(", "),
              avatarUrl: notif.actor.avatarUrl ?? null,
            },
          ]}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Bell className="h-5 w-5 text-muted-foreground/50" />
      </div>
      <p className="text-sm font-semibold text-foreground">
        You&apos;re all caught up
      </p>
      <p className="text-xs text-muted-foreground mt-1 leading-5">
        New notifications will appear here when there&apos;s activity in your
        network.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notification list
// ---------------------------------------------------------------------------

function NotificationList({
  notifications,
  onMarkRead,
}: {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
}) {
  if (notifications.length === 0) return <EmptyState />;
  return (
    <div>
      {notifications.map((notif) => (
        <NotificationRow key={notif.id} notif={notif} onMarkRead={onMarkRead} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export function NotificationPanel({
  open,
  onOpenChange,
  notifications,
  onMarkRead,
  onMarkAllRead,
}: NotificationPanelProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const requestsNotifs = notifications.filter((n) =>
    REQUESTS_TYPES.includes(n.type),
  );
  const circleNotifs = notifications.filter((n) =>
    CIRCLE_TYPES.includes(n.type),
  );

  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="p-0 flex flex-col sm:max-w-[440px] gap-0 [&>button]:hidden"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          closeButtonRef.current?.focus();
        }}
      >
        {/* Accessible title (visually hidden — custom header below) */}
        <SheetTitle className="sr-only">Notifications</SheetTitle>

        {/* Header */}
        <div className="flex items-center justify-between pl-5 pr-4 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-normal font-serif text-foreground">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground tabular-nums">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                onClick={onMarkAllRead}
                className="h-auto rounded-full px-0 py-0 text-xs font-medium text-primary hover:bg-transparent hover:text-primary/70 gap-1"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all as read
              </Button>
            )}
            <SheetClose asChild>
              <Button
                ref={closeButtonRef}
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-border bg-muted text-muted-foreground shadow-none hover:bg-muted"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </SheetClose>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="flex flex-col flex-1 min-h-0">
          <div className="px-5 pt-3 pb-0 shrink-0">
            <TabsList className="w-full bg-muted/70 p-1 rounded-full">
              <TabsTrigger
                value="all"
                className="flex-1 h-7 text-xs font-semibold data-[state=active]:shadow-sm rounded-full"
              >
                All
                {unreadCount > 0 && (
                  <span className="ml-1.5 text-[10px] font-bold text-muted-foreground">
                    {notifications.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="requests"
                className="flex-1 h-7 text-xs font-semibold data-[state=active]:shadow-sm rounded-full"
                disabled={requestsNotifs.length === 0}
              >
                Requests
              </TabsTrigger>
              <TabsTrigger
                value="circle"
                className="flex-1 h-7 text-xs font-semibold data-[state=active]:shadow-sm rounded-full"
                disabled={circleNotifs.length === 0}
              >
                Circle
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="all"
            className="flex-1 overflow-y-auto mt-3 data-[state=inactive]:hidden"
          >
            <NotificationList
              notifications={notifications}
              onMarkRead={onMarkRead}
            />
          </TabsContent>

          <TabsContent
            value="requests"
            className="flex-1 overflow-y-auto mt-3 data-[state=inactive]:hidden"
          >
            <NotificationList
              notifications={requestsNotifs}
              onMarkRead={onMarkRead}
            />
          </TabsContent>

          <TabsContent
            value="circle"
            className="flex-1 overflow-y-auto mt-3 data-[state=inactive]:hidden"
          >
            <NotificationList
              notifications={circleNotifs}
              onMarkRead={onMarkRead}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
