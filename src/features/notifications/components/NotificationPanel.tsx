"use client";

import * as React from "react";
import {
  Bell,
  CheckCheck,
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
import {
  ACTIONABLE_TYPES,
  CIRCLE_TYPES,
  getNotificationBody,
  memberHref,
  REQUESTS_TYPES,
  TYPE_CONFIG,
  type Notification,
  type NotificationType,
} from "@/features/notifications/utils/notification-utils";

export type { Notification } from "@/features/notifications/utils/notification-utils";

export interface NotificationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
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

function useNotificationRowState(
  notification: Notification,
  onMarkRead: (id: string) => void,
) {
  const [circleActionTaken, setCircleActionTaken] = React.useState<
    "accepted" | "declined" | null
  >(null);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [helpDeclined, setHelpDeclined] = React.useState(false);

  const markRead = React.useCallback(() => {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
  }, [notification.id, notification.read, onMarkRead]);

  const handleCircleAction = React.useCallback(
    (action: "accepted" | "declined") => {
      setCircleActionTaken(action);
      markRead();
    },
    [markRead],
  );

  const handleHelpOpen = React.useCallback(() => {
    setHelpOpen(true);
    markRead();
  }, [markRead]);

  const handleHelpDecline = React.useCallback(() => {
    setHelpDeclined(true);
    markRead();
  }, [markRead]);

  return {
    circleActionTaken,
    helpDeclined,
    helpOpen,
    handleCircleAction,
    handleHelpDecline,
    handleHelpOpen,
    markRead,
    setHelpOpen,
  };
}

function NotificationActor({
  notification,
}: {
  notification: Notification;
}) {
  if (notification.actor) {
    return (
      <UserIdentityLink
        avatarUrl={notification.actor.avatarUrl}
        name={notification.actor.name}
        href={memberHref(notification.actor.name)}
        avatarSize="sm"
        showTrustedFor={false}
        groupClass="group/person"
        className="min-w-0"
        onClick={(event: React.MouseEvent) => event.stopPropagation()}
      />
    );
  }

  return (
    <div className="flex items-center gap-3">
      <SystemAvatar type={notification.type} />
      <span className="text-lg font-bold text-card-foreground leading-7">
        The Trusted List
      </span>
    </div>
  );
}

function CircleJoinRequestActions({
  actorFirstName,
  actionTaken,
  onAction,
}: {
  actorFirstName: string | undefined;
  actionTaken: "accepted" | "declined" | null;
  onAction: (action: "accepted" | "declined") => void;
}) {
  if (actionTaken) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "rounded-full border-transparent py-1",
          actionTaken === "accepted"
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground",
        )}
      >
        {actionTaken === "accepted" ? "Accepted" : "Declined"}
      </Badge>
    );
  }

  return (
    <>
      <Button
        size="sm"
        className="h-6 rounded-full font-semibold text-xs px-3"
        onClick={() => onAction("accepted")}
      >
        Accept {actorFirstName}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-6 rounded-full font-semibold text-xs px-3"
        onClick={() => onAction("declined")}
      >
        Decline
      </Button>
    </>
  );
}

function DirectHelpRequestActions({
  actorFirstName,
  helpDeclined,
  onDecline,
  onHelp,
}: {
  actorFirstName: string | undefined;
  helpDeclined: boolean;
  onDecline: () => void;
  onHelp: () => void;
}) {
  if (helpDeclined) {
    return (
      <Badge
        variant="outline"
        className="rounded-full border-transparent py-1 bg-muted text-muted-foreground"
      >
        Declined
      </Badge>
    );
  }

  return (
    <>
      <Button
        size="sm"
        className="h-6 rounded-full font-semibold text-xs px-3"
        onClick={onHelp}
      >
        Help {actorFirstName}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-6 rounded-full font-semibold text-xs px-3"
        onClick={onDecline}
      >
        Decline
      </Button>
    </>
  );
}

function NotificationRowActions({
  notification,
  circleActionTaken,
  helpDeclined,
  onCircleAction,
  onHelpDecline,
  onHelpOpen,
}: {
  notification: Notification;
  circleActionTaken: "accepted" | "declined" | null;
  helpDeclined: boolean;
  onCircleAction: (action: "accepted" | "declined") => void;
  onHelpDecline: () => void;
  onHelpOpen: () => void;
}) {
  const actorFirstName = notification.actor?.name.split(" ")[0];

  if (notification.type === "circle_join_request") {
    return (
      <div className="flex items-center gap-3">
        <CircleJoinRequestActions
          actorFirstName={actorFirstName}
          actionTaken={circleActionTaken}
          onAction={onCircleAction}
        />
      </div>
    );
  }

  if (notification.type === "direct_help_request") {
    return (
      <div className="flex items-center gap-3">
        <DirectHelpRequestActions
          actorFirstName={actorFirstName}
          helpDeclined={helpDeclined}
          onDecline={onHelpDecline}
          onHelp={onHelpOpen}
        />
      </div>
    );
  }

  return null;
}

function NotificationRow({
  notif,
  onMarkRead,
}: {
  notif: Notification;
  onMarkRead: (id: string) => void;
}) {
  const {
    circleActionTaken,
    helpDeclined,
    helpOpen,
    handleCircleAction,
    handleHelpDecline,
    handleHelpOpen,
    markRead,
    setHelpOpen,
  } = useNotificationRowState(notif, onMarkRead);
  const isActionable = ACTIONABLE_TYPES.includes(notif.type);
  const body = getNotificationBody(notif);

  return (
    <>
      <div
        role={isActionable ? undefined : "button"}
        tabIndex={isActionable ? undefined : 0}
        onClick={isActionable ? undefined : markRead}
        onKeyDown={
          isActionable
            ? undefined
            : (e) => {
                if (e.key === "Enter" || e.key === " ") markRead();
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
            <NotificationActor notification={notif} />
            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
              {notif.relativeTime}
            </span>
          </div>

          {/* Body + actions — pl-[52px] aligns with name (avatar w-10 + gap-3) */}
          <div className="flex flex-col gap-4 pl-[52px]">
            <p className="text-sm text-muted-foreground leading-5">{body}</p>
            <NotificationRowActions
              notification={notif}
              circleActionTaken={circleActionTaken}
              helpDeclined={helpDeclined}
              onCircleAction={handleCircleAction}
              onHelpDecline={handleHelpDecline}
              onHelpOpen={handleHelpOpen}
            />
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

function NotificationPanelHeader({
  closeButtonRef,
  unreadCount,
  onMarkAllRead,
}: {
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  unreadCount: number;
  onMarkAllRead: () => void;
}) {
  return (
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
  );
}

function NotificationTabs({
  notifications,
  requestsNotifications,
  circleNotifications,
  unreadCount,
  onMarkRead,
}: {
  notifications: Notification[];
  requestsNotifications: Notification[];
  circleNotifications: Notification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
}) {
  return (
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
            disabled={requestsNotifications.length === 0}
          >
            Requests
          </TabsTrigger>
          <TabsTrigger
            value="circle"
            className="flex-1 h-7 text-xs font-semibold data-[state=active]:shadow-sm rounded-full"
            disabled={circleNotifications.length === 0}
          >
            Circle
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent
        value="all"
        className="flex-1 overflow-y-auto mt-3 data-[state=inactive]:hidden"
      >
        <NotificationList notifications={notifications} onMarkRead={onMarkRead} />
      </TabsContent>

      <TabsContent
        value="requests"
        className="flex-1 overflow-y-auto mt-3 data-[state=inactive]:hidden"
      >
        <NotificationList
          notifications={requestsNotifications}
          onMarkRead={onMarkRead}
        />
      </TabsContent>

      <TabsContent
        value="circle"
        className="flex-1 overflow-y-auto mt-3 data-[state=inactive]:hidden"
      >
        <NotificationList
          notifications={circleNotifications}
          onMarkRead={onMarkRead}
        />
      </TabsContent>
    </Tabs>
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

  const requestsNotifications = notifications.filter((n) =>
    REQUESTS_TYPES.includes(n.type),
  );
  const circleNotifications = notifications.filter((n) =>
    CIRCLE_TYPES.includes(n.type),
  );

  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="p-0 flex flex-col w-full sm:max-w-[440px] gap-0 [&>button]:hidden"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          closeButtonRef.current?.focus();
        }}
      >
        {/* Accessible title (visually hidden — custom header below) */}
        <SheetTitle className="sr-only">Notifications</SheetTitle>

        <NotificationPanelHeader
          closeButtonRef={closeButtonRef}
          unreadCount={unreadCount}
          onMarkAllRead={onMarkAllRead}
        />
        <NotificationTabs
          notifications={notifications}
          requestsNotifications={requestsNotifications}
          circleNotifications={circleNotifications}
          unreadCount={unreadCount}
          onMarkRead={onMarkRead}
        />
      </SheetContent>
    </Sheet>
  );
}
