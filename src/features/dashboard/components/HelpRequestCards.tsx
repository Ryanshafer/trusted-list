import * as React from "react";
import {
  BellPlus,
  BellRing,
  Clock,
  EyeOff,
  Flag,
  Globe,
  Hand,
  Link2,
  MoreHorizontal,
  Users,
  X,
} from "lucide-react";

import type { CardData } from "../types";
import { ChatDialog, type ChatMessage } from "./ChatDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FlagRequestDialog } from "@/features/moderation/components/FlagRequestDialog";
import { Badge } from "@/components/ui/badge";

type HelpRequestCardProps = CardData & {
  onClear?: () => void;
};

// Relationship type matching Variant G logic
export type RelationshipType = "direct" | "through-contact" | "skills-match";

// Helper to format end date as human-readable relative time
export function formatEndDate(endDate: string | null | undefined): string {
  if (!endDate) return "No deadline";

  const end = new Date(endDate);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();

  if (diffMs < 0) return "Ended";

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  // Under 60 minutes
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? "Help needed in next 1 minute" : `Help needed in next ${diffMinutes} minutes`;
  }

  // Under 24 hours
  if (diffHours < 24) {
    return diffHours === 1 ? "Help needed in next 1 hour" : `Help needed in next ${diffHours} hours`;
  }

  // Default: show the date
  return `Help needed until ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export const HelpRequestCard = (card: HelpRequestCardProps) => {
  if (card.variant === "circle") {
    return <CircleHelpCard {...card} />;
  }
  if (card.variant === "network") {
    return <NetworkHelpCard {...card} />;
  }
  if (card.variant === "opportunities") {
    return <OpportunityHelpCard {...card} />;
  }

  return <DefaultHelpCard {...card} />;
};

const MoreOptionsButton = ({
  onDismiss,
  onFlag,
}: {
  onDismiss?: () => void;
  onFlag?: () => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground"
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Open menu</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {onDismiss && (
        <DropdownMenuItem onClick={onDismiss}>
          <EyeOff className="mr-2 h-4 w-4" />
          I can't help with this request
        </DropdownMenuItem>
      )}
      <DropdownMenuItem
        className="text-destructive focus:text-destructive"
        onClick={onFlag}
      >
        <Flag className="mr-2 h-4 w-4" />
        Flag as inappropriate
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export const ConnectedCardHeader = ({
  name,
  avatarUrl,
  relationshipType,
  relationshipLabel,
  onDismiss,
  onFlag,
}: {
  name: string;
  avatarUrl?: string | null;
  relationshipType: RelationshipType;
  relationshipLabel: string;
  onDismiss?: () => void;
  onFlag?: () => void;
}) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-row items-start gap-3 pb-2 pt-5 select-none">
      <Avatar className="h-10 w-10 shrink-0 border border-border mt-0.5">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
        ) : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="font-semibold text-base truncate">{name}</span>
        <span className="text-xs text-muted-foreground flex items-start gap-1">
          {relationshipType === "direct" && <Link2 className="h-3 w-3 shrink-0 mt-0.5" />}
          {relationshipType === "through-contact" && <Users className="h-3 w-3 shrink-0 mt-0.5" />}
          {relationshipType === "skills-match" && <Globe className="h-3 w-3 shrink-0 mt-0.5" />}
          {relationshipLabel}
        </span>
      </div>
      <div className="-mt-2 -mr-2">
        <MoreOptionsButton onDismiss={onDismiss} onFlag={onFlag} />
      </div>
    </div>
  );
};

const ConnectedHelpCard = ({
  name,
  request,
  requestSummary,
  avatarUrl,
  relationshipType,
  connectionLabel,
  primaryActionLabel,
  endDate,
  onClear,
}: {
  name: string;
  request: string;
  requestSummary?: string | null;
  avatarUrl?: string | null;
  relationshipType: RelationshipType;
  connectionLabel: string;
  primaryActionLabel: string;
  endDate?: string | null;
  onClear?: () => void;
}) => {
  const [open, setOpen] = React.useState(false);
  const [chatOpen, setChatOpen] = React.useState(false);
  const [flagOpen, setFlagOpen] = React.useState(false);

  // Prepare initial chat message
  const initialLead = React.useMemo(() => {
    const trimmedSummary = requestSummary?.trim() ?? "";
    const trimmedDetails = request.trim();
    if (!trimmedSummary) return trimmedDetails;
    const cleanSummary = trimmedSummary.replace(/[.!?]\s*$/, "");
    return `${cleanSummary}. ${trimmedDetails}`;
  }, [request, requestSummary]);

  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>(() => [
    { id: Date.now(), sender: "contact", text: initialLead },
  ]);
  const [composer, setComposer] = React.useState("");
  const [celebrating, setCelebrating] = React.useState(false);
  const [remindOpen, setRemindOpen] = React.useState(false);
  const [remindOption, setRemindOption] = React.useState("3 days");
  const [reminderActive, setReminderActive] = React.useState(false);
  const [isDismissing, setIsDismissing] = React.useState(false);
  const [isHidden, setIsHidden] = React.useState(false);
  const [celebrationTarget, setCelebrationTarget] = React.useState<"card" | "dialog">("card");

  // Refs for timeouts
  const celebrationTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatOpenTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogCloseTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSendMessage = React.useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      setChatMessages((prev) => [...prev, { id: Date.now(), sender: "user", text: trimmed }]);
    },
    [setChatMessages],
  );

  const triggerConfetti = React.useCallback(
    (target: "card" | "dialog") => {
      if (celebrating) return;
      setCelebrationTarget(target);
      setCelebrating(true);
      if (target === "dialog") {
        dialogCloseTimeout.current = setTimeout(() => {
          setOpen(false);
        }, 700);
      }
      chatOpenTimeout.current = setTimeout(() => {
        setChatOpen(true);
      }, 700);
      celebrationTimeout.current = setTimeout(() => {
        setCelebrating(false);
      }, 1000);
    },
    [celebrating],
  );

  const handlePrimaryClick = () => {
    triggerConfetti("card");
  };

  const handleDialogPrimary = React.useCallback(() => {
    triggerConfetti("dialog");
  }, [triggerConfetti]);

  const openRemindDialog = React.useCallback(() => {
    setOpen(false);
    setRemindOpen(true);
  }, []);

  React.useEffect(() => {
    return () => {
      if (celebrationTimeout.current) clearTimeout(celebrationTimeout.current);
      if (chatOpenTimeout.current) clearTimeout(chatOpenTimeout.current);
      if (dialogCloseTimeout.current) clearTimeout(dialogCloseTimeout.current);
      if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
    };
  }, []);

  const handleDismiss = React.useCallback(() => {
    if (isDismissing) return;
    setIsDismissing(true);
    dismissTimeoutRef.current = setTimeout(() => {
      if (onClear) {
        onClear();
      } else {
        setIsHidden(true);
      }
    }, 250);
  }, [isDismissing, onClear]);

  if (isHidden) return null;

  // Variant G Content Display
  const contentText = requestSummary || request;

  return (
    <>
      <Card
        className={`flex flex-col overflow-hidden transition-all hover:shadow-md border-border/80 bg-card ${isDismissing ? "translate-y-4 scale-95 opacity-0" : "opacity-100"
          } duration-300 ease-in-out`}
      >
        <CardHeader className="p-0 px-5">
          <ConnectedCardHeader
            name={name}
            avatarUrl={avatarUrl}
            relationshipType={relationshipType}
            relationshipLabel={connectionLabel}
            onDismiss={onClear ? handleDismiss : undefined}
            onFlag={() => setFlagOpen(true)}
          />
        </CardHeader>

        <CardContent className="pb-0 px-5">
          <div
            className="bg-muted/40 p-4 rounded-md cursor-pointer hover:bg-muted/60 transition-colors group/bubble relative mt-2 space-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => setOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setOpen(true);
              }
            }}
          >
            {requestSummary ? (
              <p className="font-bold text-foreground leading-relaxed mb-0">
                {requestSummary}
              </p>
            ) : null}

            {/* End date display */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-0.5">
              <Clock className="w-3 h-3" />
              <span>{formatEndDate(endDate)}</span>
            </div>

            <p className="text-sm text-foreground leading-relaxed">
              {request.length > 80 ? (
                <>
                  {request.slice(0, 80).trim()}
                  <span className="text-muted-foreground">... </span>
                  <span className="text-muted-foreground font-medium">more</span>
                </>
              ) : (
                request
              )}
            </p>

            {/* Overlay for View Details */}
            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/60 backdrop-blur-[1px] opacity-0 transition-opacity duration-200 group-hover/bubble:opacity-100">
              <div className="inline-flex h-8 items-center justify-center rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground shadow-sm">
                Read details
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-6 pb-5 px-5 flex justify-end items-center">
          <div className="flex flex-row-reverse gap-2 w-full justify-start relative">
            <div className="relative">
              <Button
                onClick={handlePrimaryClick}
                variant="outline"
                className="font-semibold shadow-sm px-8 relative z-10 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                size="sm"
              >
                {primaryActionLabel}
              </Button>
              {celebrating && celebrationTarget === "card" ? <ConfettiBurst /> : null}
            </div>

            {reminderActive ? (
              <Button
                onClick={() => setReminderActive(false)}
                variant="outline"
                size="sm"
                className="shrink-0 transition-all border-lime-200 bg-lime-50 text-lime-700 hover:bg-amber-100 hover:text-amber-800 hover:border-amber-300 group/remind"
                title="Cancel reminder"
              >
                <BellRing className="w-3.5 h-3.5 mr-2 group-hover/remind:hidden" />
                <X className="w-3.5 h-3.5 mr-2 hidden group-hover/remind:block" />
                <span className="text-xs font-medium">Reminder: {remindOption}</span>
              </Button>
            ) : (
              <Button
                onClick={() => setRemindOpen(true)}
                variant="outline"
                size="sm"
                className="shrink-0 w-9 p-0 transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                title="Remind me later"
              >
                <BellPlus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <ExpandedHelpDialog
            name={name}
            request={request}
            requestSummary={requestSummary}
            avatarUrl={avatarUrl}
            relationshipType={relationshipType}
            connectionLabel={connectionLabel}
            endDate={endDate}
            primaryLabel={primaryActionLabel}
            onPrimaryAction={handleDialogPrimary}
            onRemindAction={openRemindDialog}
            confettiActive={celebrating && celebrationTarget === "dialog"}
          />
        </DialogContent>
      </Dialog>

      <ChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        contactName={name}
        messages={chatMessages}
        composer={composer}
        onComposerChange={setComposer}
        onSend={(message) => {
          handleSendMessage(message);
          setComposer("");
        }}
      />
      <RemindDialog
        open={remindOpen}
        onOpenChange={setRemindOpen}
        selection={remindOption}
        onSelectionChange={setRemindOption}
        reminderActive={reminderActive}
        onSet={() => {
          setReminderActive(true);
          setRemindOpen(false);
        }}
        onCancelReminder={() => {
          setReminderActive(false);
          setRemindOpen(false);
        }}
      />

      <FlagRequestDialog
        open={flagOpen}
        onOpenChange={setFlagOpen}
        requestorName={name}
        requestorAvatarUrl={avatarUrl || undefined}
        requestSummary={requestSummary}
        requestText={request}
        onSubmit={() => handleDismiss()}
      />
    </>
  );
};

// Default implementation wrapper
const DefaultHelpCard = (props: HelpRequestCardProps) => {
  return (
    <ConnectedHelpCard
      name={props.name}
      request={props.request}
      requestSummary={props.requestSummary}
      relationshipType="through-contact"
      connectionLabel={props.subtitle || "Connected"}
      primaryActionLabel={props.primaryCTA || "Help"}
      endDate={props.endDate}
      onClear={props.onClear}
      avatarUrl={null}
    />
  )
}

const CircleHelpCard = ({
  name,
  request,
  avatarUrl,
  requestSummary,
  endDate,
  onClear,
}: HelpRequestCardProps) => {
  const firstName = name.split(" ")[0] ?? name;

  return (
    <ConnectedHelpCard
      name={name}
      request={request}
      requestSummary={requestSummary}
      avatarUrl={avatarUrl}
      relationshipType="direct"
      connectionLabel="Directly Connected"
      primaryActionLabel={`Help ${firstName}`}
      endDate={endDate}
      onClear={onClear}
    />
  );
};

const NetworkHelpCard = ({
  name,
  request,
  requestSummary,
  connectedBy,
  endDate,
  onClear,
  avatarUrl,
}: HelpRequestCardProps) => {
  const connector = connectedBy ?? "your trusted network";
  const firstName = name.split(" ")[0] ?? name;

  return (
    <ConnectedHelpCard
      name={name}
      request={request}
      requestSummary={requestSummary}
      avatarUrl={avatarUrl}
      relationshipType="through-contact"
      connectionLabel={`Connected by ${connector}`}
      primaryActionLabel={`Help ${firstName}`}
      endDate={endDate}
      onClear={onClear}
    />
  );
};

const OpportunityHelpCard = ({
  name,
  request,
  requestSummary,
  connectionReason,
  profession,
  level,
  endDate,
  onClear,
  avatarUrl,
}: HelpRequestCardProps) => {
  const firstName = name.split(" ")[0] ?? name;
  const connectionLine = connectionReason
    ? connectionReason.toLowerCase().startsWith("you share similar skills")
      ? connectionReason
      : `You share similar skills: ${connectionReason}`
    : "Skill-aligned opportunity";

  return (
    <ConnectedHelpCard
      name={name}
      request={request}
      requestSummary={requestSummary}
      avatarUrl={avatarUrl}
      relationshipType="skills-match"
      connectionLabel={connectionLine}
      primaryActionLabel={`Help ${firstName}`}
      endDate={endDate}
      onClear={onClear}
    />
  );
};

const confettiColors = ["bg-primary", "bg-amber-400", "bg-emerald-400", "bg-rose-400", "bg-sky-400", "bg-purple-400"];
const remindOptions = ["4 hours", "12 hours", "1 day", "3 days", "1 week", "2 weeks"];

const ConfettiBurst = () => {
  const pieces = React.useMemo(
    () =>
      Array.from({ length: 24 }).map((_, index) => {
        const spread = Math.PI / 1.2;
        const baseAngle = Math.PI / 2;
        const angle = baseAngle + (Math.random() - 0.5) * spread;
        const distance = 60 + Math.random() * 30;
        const size = 1 + Math.random() * 2;
        return {
          angle,
          distance,
          rotation: Math.random() * 360,
          color: confettiColors[index % confettiColors.length],
          size,
        };
      }),
    [],
  );
  const [animate, setAnimate] = React.useState(false);

  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
      {pieces.map((piece, index) => {
        const x = Math.cos(piece.angle) * piece.distance;
        const y = -Math.sin(piece.angle) * piece.distance;
        return (
          <span
            key={`${piece.color}-${index}`}
            className={`absolute rounded-full ${piece.color}`}
            style={{
              height: `${piece.size * 4}px`,
              width: `${piece.size * 1.5}px`,
              transform: animate
                ? `translate(${x}px, ${y}px) rotate(${piece.rotation}deg)`
                : "translate(0px, 0px)",
              opacity: animate ? 0 : 1,
              transition: "transform 600ms ease-out, opacity 600ms ease-out",
            }}
          />
        );
      })}
    </div>
  );
};

const RemindDialog = ({
  open,
  onOpenChange,
  selection,
  onSelectionChange,
  reminderActive,
  onSet,
  onCancelReminder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selection: string;
  onSelectionChange: (value: string) => void;
  reminderActive: boolean;
  onSet: () => void;
  onCancelReminder: () => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>{reminderActive ? "Reminder scheduled" : "Schedule a reminder"}</DialogTitle>
        <DialogDescription>
          {reminderActive
            ? "You're set to get a nudge. Adjust the timing below or cancel the reminder."
            : "Pick when you want to be nudged again."}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Remind me in</p>
        <Select value={selection} onValueChange={onSelectionChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {remindOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {reminderActive ? (
        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-2">
          <Button variant="destructive" className="w-full sm:flex-1" onClick={onCancelReminder}>
            Cancel reminder
          </Button>
          <Button className="w-full sm:flex-1" onClick={onSet}>
            Update reminder
          </Button>
        </DialogFooter>
      ) : (
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSet}>Set reminder</Button>
        </DialogFooter>
      )}
    </DialogContent>
  </Dialog>
);

const ExpandedHelpDialog = ({
  name,
  request,
  requestSummary,
  avatarUrl,
  relationshipType,
  connectionLabel,
  endDate,
  primaryLabel,
  onPrimaryAction,
  onRemindAction,
  confettiActive = false,
}: {
  name: string;
  request: string;
  requestSummary?: string | null;
  avatarUrl?: string | null;
  relationshipType?: RelationshipType;
  connectionLabel?: string;
  endDate?: string | null;
  primaryLabel: string;
  onPrimaryAction?: () => void;
  onRemindAction?: () => void;
  confettiActive?: boolean;
}) => (
  <Card className="border-none shadow-none">
    <CardContent className="space-y-4 p-3">
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12 border border-border mt-0.5">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} className="object-cover" /> : null}
          <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-0.5">
          <p className="text-lg font-semibold">{name}</p>
          {connectionLabel ? (
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              {relationshipType === "direct" && <Link2 className="h-3 w-3 shrink-0 mt-0.5" />}
              {relationshipType === "through-contact" && <Users className="h-3 w-3 shrink-0 mt-0.5" />}
              {relationshipType === "skills-match" && <Globe className="h-3 w-3 shrink-0 mt-0.5" />}
              {connectionLabel}
            </p>
          ) : null}
        </div>
      </div>
      <div className="rounded-md bg-muted/50 p-4 space-y-2">
        {requestSummary ? (
          <p className="font-bold text-foreground leading-relaxed mb-0">
            {requestSummary}
          </p>
        ) : null}
        {/* End date display - between short and long description */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pb-0.5">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatEndDate(endDate)}</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed max-w-prose">
          {request}
        </p>
      </div>
      <div className="pt-4 flex justify-end items-center">
        <div className="flex gap-2 justify-end relative">
          <Button
            onClick={onRemindAction}
            variant="outline"
            size="sm"
            className="shrink-0 w-9 p-0 transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
            title="Remind me later"
          >
            <BellPlus className="w-4 h-4" />
          </Button>
          <div className="relative">
            <Button
              onClick={onPrimaryAction}
              className="font-semibold shadow-sm px-8 relative z-10"
              size="sm"
              autoFocus
            >
              {primaryLabel}
            </Button>
            {confettiActive ? <ConfettiBurst /> : null}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);
