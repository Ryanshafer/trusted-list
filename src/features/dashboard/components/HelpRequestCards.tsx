import * as React from "react";
import {
  ArrowRight,
  BellPlus,
  BellRing,
  Clock,
  EyeOff,
  Flag,
  Globe,
  MoreVertical,
  Users,
  X,
} from "lucide-react";
import { AudienceBadge, cardVariantToAudienceKey, type AudienceKey } from "@/components/AudienceBadge";

import type { CardData, CardVariant } from "../types";
import { ChatMultiHelperModal, type Message as MultiChatMessage } from "./ChatMultiHelperModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserIdentityLink } from "@/components/UserIdentityLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatEndDate } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FlagRequestDialog } from "@/features/moderation/components/FlagRequestDialog";
import { SetReminderDialog, formatReminderTime } from "@/components/SetReminderDialog";

type HelpRequestCardProps = CardData & {
  reminderLabel?: string;
  onClear?: () => void;
  onReminderSet?: (label: string) => void;
  onReminderClear?: () => void;
};

// Relationship type matching Variant G logic
export type RelationshipType = "direct" | "through-contact" | "skills-match";

function getDegreeBadge(variant: CardVariant, override?: string | null): string | null {
  if (override != null) return override;
  if (variant === "contact") return "1st";
  if (variant === "circle") return "1st";
  if (variant === "community") return "3rd+";
  return null;
}



export const IncomingRequestCard = (card: HelpRequestCardProps) => {
  if (card.variant === "contact") return <DirectConnectionCard {...card} />;
  if (card.variant === "circle") return <NetworkConnectionCard {...card} />;
  if (card.variant === "community") return <SkillsMatchCard {...card} />;
  return <FallbackRequestCard {...card} />;
};

// Shared card shell — single source of truth for all help card components.
// Any card-level interactive behavior (hover, transitions) belongs here so all variants stay in sync.
export const helpCardShellClass = "relative rounded-2xl border border-border-50 bg-card shadow-md transition-shadow hover:shadow-xl";

// ---------------------------------------------------------------------------
// Shared card sub-components
// ---------------------------------------------------------------------------

/** The linked serif title + date + body block used in every grid card variant. */
export interface RequestCardPreviewProps {
  id: string;
  requestSummary?: string | null;
  request: string;
  endDate?: string | null;
  meta?: React.ReactNode;
}

export function RequestCardPreview({ id, requestSummary, request, endDate, meta }: RequestCardPreviewProps) {
  return (
    <a href={`/trusted-list/requests/view/${id}`} className="group flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        {requestSummary && (
          <p className="font-serif text-2xl leading-7 text-card-foreground transition-colors group-hover:text-primary">
            {requestSummary}
          </p>
        )}
        {(meta || endDate) && (
          <div className="flex items-center gap-1 leading-none text-xs text-muted-foreground">
            {meta ?? (
              <>
                <Clock className="h-3 w-3 shrink-0 mb-0.5" />
                <span>{formatEndDate(endDate)}</span>
              </>
            )}
          </div>
        )}
      </div>
      <p className="line-clamp-2 text-sm leading-relaxed text-card-foreground">
        {request}
      </p>
    </a>
  );
}

/** Avatar + name + trustedFor + optional label + right-side action slot. */
export interface CardPersonRowProps {
  avatarUrl?: string | null;
  name: string;
  trustedFor?: string | null;
  /** Section label rendered above the row, e.g. "REQUESTED BY", "WHO YOU HELPED" */
  label?: string;
  /** Button or icon rendered on the right side */
  action?: React.ReactNode;
  /** Border color class for the avatar ring. Defaults to "border-background". */
  avatarBorderClass?: string;
}

export function CardPersonRow({ avatarUrl, name, trustedFor, label, action, avatarBorderClass }: CardPersonRowProps) {
  // Convert trustedFor string to array for UserIdentityLink
  const trustedForArray = trustedFor ? [trustedFor] : [];
  return (
    <div className="flex flex-col gap-3">
      {label && <p className="text-sm font-normal text-muted-foreground">{label}</p>}
      <div className="flex items-center justify-between gap-2">
        <UserIdentityLink
          avatarUrl={avatarUrl}
          name={name}
          trustedFor={trustedForArray}
          href={`/trusted-list/members/${name.toLowerCase().replace(/\s+/g, "-")}`}
          avatarSize="sm"
          avatarBorderClass={avatarBorderClass ?? "border-background"}
          showTrustedFor={!!trustedFor}
          groupClass="group/member"
        />
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

/** Status badge for grid cards: Complete, Completed, In Progress, Sharing Paused, Open. */
export type RequestStatus = "complete" | "completed" | "in-progress" | "paused" | "open";

const STATUS_CONFIG: Record<RequestStatus, { label: string; className: string }> = {
  "complete":    { label: "Complete",       className: "border-emerald-200 bg-emerald-100 font-bold text-emerald-700" },
  "completed":   { label: "Completed",      className: "border-emerald-200 bg-emerald-100 font-bold text-emerald-700" },
  "in-progress": { label: "In Progress",    className: "border-blue-200 bg-blue-100 font-semibold text-blue-800" },
  "paused":      { label: "Sharing Paused", className: "border-amber-200 bg-amber-100 font-bold text-amber-800" },
  "open":        { label: "Open",           className: "border-blue-200 bg-blue-100 font-bold text-blue-800" },
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={`rounded-full leading-4 ${className}`}>{label}</Badge>
  );
}

export function ReadFullRequestButton({ href, className }: { href: string; className?: string }) {
  return (
    <Button
      asChild
      variant="outline"
      className={`h-10 rounded-full border-primary bg-card px-5 text-sm font-semibold leading-none text-primary hover:bg-primary hover:text-primary-foreground ${className ?? ""}`}
    >
      <a href={href}>
        Read the full request
        <ArrowRight className="h-4 w-4" />
      </a>
    </Button>
  );
}

const MoreOptionsButton = ({
  onDismiss,
  onFlag,
}: {
  onDismiss?: () => void;
  onFlag?: () => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground">
        <MoreVertical className="h-4 w-4" />
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
      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onFlag}>
        <Flag className="mr-2 h-4 w-4" />
        Flag as inappropriate
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

// Kept for backwards compatibility with any external consumers
export const ConnectedCardHeader = ({
  name,
  avatarUrl,
  relationshipType,
  relationshipLabel,
  degreeBadge,
  onDismiss,
  onFlag,
}: {
  name: string;
  avatarUrl?: string | null;
  relationshipType: RelationshipType;
  relationshipLabel: string;
  degreeBadge?: string | null;
  onDismiss?: () => void;
  onFlag?: () => void;
}) => {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="flex flex-row items-start gap-3 pb-2 pt-5 select-none">
      <UserIdentityLink
        avatarUrl={avatarUrl}
        name={name}
        connectionDegree={degreeBadge ?? undefined}
        href={`/trusted-list/members/${name.toLowerCase().replace(/\s+/g, "-")}`}
        avatarSize="sm"
        avatarBorderClass="border-border mt-0.5"
        showTrustedFor={false}
        groupClass="group/member"
        className="flex-1 min-w-0"
      />
      <div className="-mt-2 -mr-2">
        <MoreOptionsButton onDismiss={onDismiss} onFlag={onFlag} />
      </div>
    </div>
  );
};

const IncomingRequestCardBase = ({
  id,
  name,
  request,
  requestSummary,
  avatarUrl,
  primaryActionLabel,
  endDate,
  onClear,
  reminderLabel,
  onReminderSet,
  onReminderClear,
  audience,
  category,
  trustedFor,
  degreeBadge,
}: {
  id: string;
  name: string;
  request: string;
  requestSummary?: string | null;
  avatarUrl?: string | null;
  primaryActionLabel: string;
  endDate?: string | null;
  onClear?: () => void;
  reminderLabel?: string;
  onReminderSet?: (label: string) => void;
  onReminderClear?: () => void;
  audience?: AudienceKey;
  category?: string | null;
  trustedFor?: string | null;
  degreeBadge?: string | null;
}) => {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const [chatOpen, setChatOpen] = React.useState(false);
  const [flagOpen, setFlagOpen] = React.useState(false);
  const chatInitialMessage = React.useMemo<MultiChatMessage[]>(() => {
    const trimmedSummary = requestSummary?.trim() ?? "";
    const trimmedDetails = request.trim();
    const lead = trimmedSummary
      ? `${trimmedSummary.replace(/[.!?]\s*$/, "")}. ${trimmedDetails}`
      : trimmedDetails;
    return [{ id: String(Date.now()), sender: "incoming", text: lead, timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) }];
  }, [requestSummary, request]);
  const [celebrating, setCelebrating] = React.useState(false);
  const [remindOpen, setRemindOpen] = React.useState(false);
  const [reminderIso, setReminderIso] = React.useState<string | null>(null);
  const [reminderDisplayLabel, setReminderDisplayLabel] = React.useState<string | null>(
    reminderLabel ?? null,
  );
  const [isDismissing, setIsDismissing] = React.useState(false);
  const [isHidden, setIsHidden] = React.useState(false);

  const celebrationTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatOpenTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setReminderDisplayLabel(reminderLabel ?? null);
  }, [reminderLabel]);

  React.useEffect(() => {
    return () => {
      if (celebrationTimeout.current) clearTimeout(celebrationTimeout.current);
      if (chatOpenTimeout.current) clearTimeout(chatOpenTimeout.current);
      if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
    };
  }, []);

  const handleHelpClick = () => {
    if (celebrating) return;
    setCelebrating(true);
    chatOpenTimeout.current = setTimeout(() => setChatOpen(true), 700);
    celebrationTimeout.current = setTimeout(() => setCelebrating(false), 1000);
  };

  const handleDismiss = React.useCallback(() => {
    if (isDismissing) return;
    setIsDismissing(true);
    dismissTimeoutRef.current = setTimeout(() => {
      if (onClear) onClear();
      else setIsHidden(true);
    }, 250);
  }, [isDismissing, onClear]);

  if (isHidden) return null;

  return (
    <>
    <div
      className={`relative h-full transition-all duration-300 ease-in-out ${
        isDismissing ? "translate-y-4 scale-95 opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <Card className={`${helpCardShellClass} flex h-full flex-col overflow-hidden`}>
        <CardContent className="flex flex-1 flex-col gap-5 p-5">

          {/* Top: audience badge + ⋮ menu */}
          <div className="flex items-center justify-between">
            {audience ? (
              <AudienceBadge audience={audience} category={category} />
            ) : (
              <div />
            )}
            <MoreOptionsButton onDismiss={onClear ? handleDismiss : undefined} onFlag={() => setFlagOpen(true)} />
          </div>

          {/* Content: title, date, body */}
          <div className="flex flex-col flex-1 gap-3">
            <RequestCardPreview id={id} requestSummary={requestSummary} request={request} endDate={endDate} />
          </div>

          {/* User info */}
          <div className="flex items-center gap-3 pt-5 border-t border-border">
            <UserIdentityLink
              avatarUrl={avatarUrl}
              name={name}
              connectionDegree={degreeBadge ?? undefined}
              trustedFor={trustedFor ? [trustedFor] : []}
              href={`/trusted-list/members/${name.toLowerCase().replace(/\s+/g, "-")}`}
              avatarSize="md"
              showTrustedFor={!!trustedFor}
              groupClass="group/member"
              className="min-w-0"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            {reminderDisplayLabel ? (
              <Button
                onClick={() => {
                  setReminderIso(null);
                  setReminderDisplayLabel(null);
                  onReminderClear?.();
                }}
                variant="outline"
                className="rounded-full font-semibold h-10 px-5 text-sm leading-none border-lime-200 bg-lime-50 text-lime-700 hover:bg-amber-100 hover:text-amber-800 hover:border-amber-300 group/remind gap-2"
                title="Cancel reminder"
              >
                <BellRing className="h-4 w-4 shrink-0 mb-0.5 group-hover/remind:hidden" />
                <X className="h-4 w-4 shrink-0 mb-0.5 hidden group-hover/remind:block" />
                {reminderDisplayLabel}
              </Button>
            ) : (
              <Button
                onClick={() => setRemindOpen(true)}
                variant="outline"
                className="rounded-full font-semibold h-10 px-5 text-sm leading-none gap-2"
              >
                <BellPlus className="h-4 w-4 shrink-0 mb-0.5" />
                Remind me
              </Button>
            )}

            <div className="relative shrink-0">
              <Button
                onClick={handleHelpClick}
                variant="outline"
                className="rounded-full font-semibold h-10 px-5 text-sm leading-none border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground relative z-10"
              >
                {primaryActionLabel}
              </Button>
              {celebrating && <ConfettiBurst />}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>

    <ChatMultiHelperModal
        open={chatOpen}
        onOpenChange={setChatOpen}
        title={requestSummary ?? request.slice(0, 60)}
        contacts={[{
          id,
          name,
          role: "",
          trustedFor: trustedFor ?? null,
          avatarUrl: avatarUrl ?? null,
        }]}
        messagesByContactId={{ [id]: chatInitialMessage }}
      />

      <SetReminderDialog
        open={remindOpen}
        onOpenChange={setRemindOpen}
        requesterName={name}
        onConfirm={(iso) => {
          const nextLabel = formatReminderTime(iso);
          setReminderIso(iso);
          setReminderDisplayLabel(nextLabel);
          onReminderSet?.(nextLabel);
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

const FallbackRequestCard = (props: HelpRequestCardProps) => (
  <IncomingRequestCardBase
    id={props.id}
    name={props.name}
    request={props.request}
    requestSummary={props.requestSummary}
    primaryActionLabel={props.primaryCTA || `Help ${props.name.split(" ")[0]}`}
    endDate={props.endDate}
    onClear={props.onClear}
    avatarUrl={props.avatarUrl}

    onReminderSet={props.onReminderSet}
    onReminderClear={props.onReminderClear}
    audience={cardVariantToAudienceKey(props.variant)}
    category={props.category}
    trustedFor={props.trustedFor ?? props.profession ?? undefined}
    degreeBadge={getDegreeBadge(props.variant, props.degreeBadge)}
  />
);

const DirectConnectionCard = (props: HelpRequestCardProps) => (
  <IncomingRequestCardBase
    id={props.id}
    name={props.name}
    request={props.request}
    requestSummary={props.requestSummary}
    avatarUrl={props.avatarUrl}
    primaryActionLabel={`Help ${props.name.split(" ")[0]}`}
    endDate={props.endDate}
    onClear={props.onClear}

    onReminderSet={props.onReminderSet}
    onReminderClear={props.onReminderClear}
    audience={cardVariantToAudienceKey(props.variant)}
    category={props.category}
    trustedFor={props.trustedFor ?? props.profession ?? undefined}
    degreeBadge={getDegreeBadge(props.variant, props.degreeBadge)}
  />
);

const NetworkConnectionCard = (props: HelpRequestCardProps) => (
  <IncomingRequestCardBase
    id={props.id}
    name={props.name}
    request={props.request}
    requestSummary={props.requestSummary}
    avatarUrl={props.avatarUrl}
    primaryActionLabel={`Help ${props.name.split(" ")[0]}`}
    endDate={props.endDate}
    onClear={props.onClear}

    onReminderSet={props.onReminderSet}
    onReminderClear={props.onReminderClear}
    audience={cardVariantToAudienceKey(props.variant)}
    category={props.category}
    trustedFor={props.trustedFor ?? props.profession ?? undefined}
    degreeBadge={getDegreeBadge(props.variant, props.degreeBadge)}
  />
);

const SkillsMatchCard = (props: HelpRequestCardProps) => (
  <IncomingRequestCardBase
    id={props.id}
    name={props.name}
    request={props.request}
    requestSummary={props.requestSummary}
    avatarUrl={props.avatarUrl}
    primaryActionLabel={`Help ${props.name.split(" ")[0]}`}
    endDate={props.endDate}
    onClear={props.onClear}

    onReminderSet={props.onReminderSet}
    onReminderClear={props.onReminderClear}
    audience={cardVariantToAudienceKey(props.variant)}
    category={props.category}
    trustedFor={props.trustedFor ?? props.profession ?? undefined}
    degreeBadge={getDegreeBadge(props.variant, props.degreeBadge)}
  />
);

const confettiColors = ["bg-primary", "bg-amber-400", "bg-emerald-400", "bg-rose-400", "bg-sky-400", "bg-purple-400"];

export const ConfettiBurst = () => {
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
