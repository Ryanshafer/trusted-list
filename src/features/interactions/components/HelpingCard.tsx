import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessagesSquare,
  MoreHorizontal,
  Flag,
  EyeOff,
  BellPlus,
  MoreVertical,
} from "lucide-react";
import { AudienceBadge, cardVariantToAudienceKey } from "@/components/AudienceBadge";
import { UserIdentityLink } from "@/components/UserIdentityLink";
import type { CardData } from "@/features/dashboard/types";
import { FlagRequestDialog } from "@/features/moderation/components/FlagRequestDialog";
import { formatEndDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChatMultiHelperModal,
  type Message as MultiChatMessage,
  type CompletionFeedback,
} from "@/features/dashboard/components/ChatMultiHelperModal";
import completionFeedbackData from "../../../../data/interaction-completion-feedback.json";
import { interactionChats, type RawMessage } from "@/features/interactions/utils/data";
import { RequestCardPreview, CardPersonRow, RequestStatusBadge } from "@/features/dashboard/components/HelpRequestCards";
import { helpCardShellClass } from "@/features/dashboard/components/HelpRequestCards";
import { SetReminderDialog, type Reminder } from "./SetReminderDialog";
import {
  HelpRequestDialog,
  REQUEST_CATEGORIES,
  type EditPayload,
} from "@/features/requests/components/HelpRequestDialog";
import { getInitials } from "./OutgoingRequestCard";

export const HelpingCard = ({
  card,
  layout = "grid",
  onDismiss,
  onFlagged,
  onReminderSet,
  menuContext = "in-progress",
  showStatus = false,
  autoOpen = false,
}: {
  card: CardData & { status?: string; statusDate?: string };
  layout?: "grid" | "list";
  onDismiss?: (id: string) => void;
  onFlagged?: (id: string) => void;
  onReminderSet?: (reminder: Reminder) => void;
  menuContext?: "helped" | "in-progress";
  showStatus?: boolean;
  autoOpen?: boolean;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [badgePosition, setBadgePosition] = React.useState({ top: 88 });
  const [status, setStatus] = React.useState(card.status);
  const [currentCard, setCurrentCard] = React.useState(card);
  const [editOpen, setEditOpen] = React.useState(false);
  const [isDismissing, setIsDismissing] = React.useState(false);
  const [flagOpen, setFlagOpen] = React.useState(false);
  const [reminderOpen, setReminderOpen] = React.useState(false);

  // Chat state
  const [chatOpen, setChatOpen] = React.useState(false);

  React.useEffect(() => {
    if (autoOpen) setChatOpen(true);
  }, [autoOpen]);

  const FAKE_TIMESTAMPS = [
    "9:15 am – Mon Jan 12", "10:30 am – Mon Jan 12", "2:45 pm – Mon Jan 12",
    "4:00 pm – Mon Jan 12", "9:00 am – Tue Jan 13", "11:20 am – Tue Jan 13",
    "3:10 pm – Tue Jan 13", "5:00 pm – Tue Jan 13",
  ];

  const multiChatMessages: MultiChatMessage[] = React.useMemo(() => {
    const raw = (interactionChats as Record<string, RawMessage[]>)[card.id] ?? [
      { id: 1, sender: "contact", text: card.requestSummary || card.request.slice(0, 100) },
    ];
    return raw
      .filter((message) => message.sender === "user" || message.sender === "contact")
      .map((message, idx: number) => ({
        id: String(message.id),
        text: message.text,
        sender: message.sender === "user" ? ("outgoing" as const) : ("incoming" as const),
        timestamp: FAKE_TIMESTAMPS[idx] ?? "",
      }));
  }, [card.id, card.requestSummary, card.request]);

  const handleSaveEdit = (payload: EditPayload) => {
    setCurrentCard((prev) => ({
      ...prev,
      requestSummary: payload.shortDescription,
      request: payload.requestDetails,
    }));
  };

  const handleCantHelp = (event?: React.SyntheticEvent) => {
    event?.stopPropagation();
    if (isDismissing) return;
    setIsDismissing(true);
    window.setTimeout(() => {
      onDismiss?.(card.id);
    }, 250);
  };

  React.useEffect(() => {
    if (!containerRef.current) return;

    const requestPreview = containerRef.current.querySelector(
      ".group.relative.cursor-pointer",
    );
    if (requestPreview) {
      const rect = requestPreview.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const topOffset = rect.top - containerRect.top;
      setBadgePosition({ top: topOffset - 8 });
    }
  }, []);

  const isCompleted = status === "Completed";

  let connectionLabel = "Connected";

  if (currentCard.variant === "contact") {
    connectionLabel = "Directly Connected";
  } else if (currentCard.variant === "circle") {
    connectionLabel = currentCard.connectedBy
      ? `Connected by ${currentCard.connectedBy}`
      : "Connected by your network";
  } else if (currentCard.variant === "community") {
    connectionLabel =
      currentCard.relationshipTag || "Skill-aligned opportunity";
  }

  const initials = getInitials(currentCard.name);

  const dialogs = (
    <>
      <ChatMultiHelperModal
        open={chatOpen}
        onOpenChange={setChatOpen}
        title={currentCard.requestSummary ?? currentCard.request}
        contacts={[
          {
            id: card.id,
            name: currentCard.name,
            role: connectionLabel,
            trustedFor: currentCard.trustedFor ?? null,
            avatarUrl: currentCard.avatarUrl ?? null,
            isCompleted,
          },
        ]}
        messagesByContactId={{ [card.id]: multiChatMessages }}
        completionFeedbackByContactId={
          (completionFeedbackData as Record<string, CompletionFeedback>)[
            card.id
          ]
            ? {
                [card.id]: (
                  completionFeedbackData as Record<string, CompletionFeedback>
                )[card.id],
              }
            : undefined
        }
      />
      <FlagRequestDialog
        open={flagOpen}
        onOpenChange={setFlagOpen}
        requestorName={currentCard.name}
        requestorAvatarUrl={currentCard.avatarUrl || undefined}
        requestSummary={currentCard.requestSummary}
        requestText={currentCard.request}
        onSubmit={() => onFlagged?.(card.id)}
      />
      <SetReminderDialog
        open={reminderOpen}
        onOpenChange={setReminderOpen}
        requesterName={currentCard.name}
        onConfirm={(reminderTime) => {
          onReminderSet?.({
            id: `reminder-${card.id}-${Date.now()}`,
            cardId: card.id,
            requestSummary:
              currentCard.requestSummary ||
              currentCard.request.slice(0, 60) +
                (currentCard.request.length > 60 ? "…" : ""),
            requesterName: currentCard.name,
            requesterAvatarUrl: currentCard.avatarUrl || undefined,
            reminderTime,
          });
        }}
      />
      <HelpRequestDialog
        mode="edit"
        open={editOpen}
        onOpenChange={setEditOpen}
        categories={REQUEST_CATEGORIES}
        initialSummary={currentCard.requestSummary ?? undefined}
        initialDetails={currentCard.request}
        onSubmit={handleSaveEdit}
      />
    </>
  );

  if (layout === "list") {
    return (
      <>
        <TableRow
          className={`hover:bg-transparent transition-opacity duration-300 ease-in-out $
            ${
            isDismissing ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          {/* Requestor */}
          <TableCell className="py-5 pl-4">
            <UserIdentityLink
              avatarUrl={currentCard.avatarUrl}
              name={currentCard.name}
              trustedFor={currentCard.trustedFor ? [currentCard.trustedFor] : []}
              href={`/trusted-list/members/${currentCard.name.toLowerCase().replace(/\s+/g, "-")}`}
              avatarSize="sm"
              avatarBorderClass={isCompleted ? "border-success-600" : "border-background"}
              showTrustedFor={!!currentCard.trustedFor}
              className="min-w-0"
            />
          </TableCell>
          {/* Request */}
          <TableCell className="py-5">
            <a
              href={`/trusted-list/requests/view/${card.id}`}
              className="group/link flex flex-col min-w-0 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-base font-medium leading-tight text-card-foreground truncate transition-colors group-hover/link:text-primary">
                {currentCard.requestSummary}
              </p>
            </a>
          </TableCell>
          {/* End Date */}
          <TableCell className="py-5 text-base text-card-foreground whitespace-nowrap">
            {formatEndDate(currentCard.endDate, false)}
          </TableCell>
          {/* Audience */}
          <TableCell className="py-5 whitespace-nowrap">
            <AudienceBadge
              audience={cardVariantToAudienceKey(currentCard.variant)}
            />
          </TableCell>
          {/* Topic */}
          <TableCell className="py-5">
            {currentCard.category ? (
              <Badge
                variant="outline"
                className="rounded-full capitalize leading-4"
              >
                {currentCard.category}
              </Badge>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </TableCell>
          {/* Status */}
          {showStatus && (
            <TableCell className="py-5">
              {isCompleted ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-emerald-200 bg-emerald-100 font-bold text-emerald-800 leading-4"
                >
                  Complete
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="rounded-full border-blue-200 bg-blue-100 font-bold text-blue-800 leading-4"
                >
                  In Progress
                </Badge>
              )}
            </TableCell>
          )}
          {/* Actions */}
          <TableCell className="py-5 pr-4">
            <div className="flex justify-end items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="w-auto px-3 h-8 text-xs font-semibold rounded-full gap-1.5 border shadow-sm hover:bg-accent hover:text-accent-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  setChatOpen(true);
                }}
              >
                <MessagesSquare className="h-3.5 w-3.5" />
                {isCompleted ? "View" : "Chat"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {menuContext !== "helped" && onDismiss && (
                    <DropdownMenuItem onClick={handleCantHelp}>
                      <EyeOff className="mr-2 h-4 w-4" /> I can't help with this
                    </DropdownMenuItem>
                  )}
                  {menuContext !== "helped" && (
                    <DropdownMenuItem onClick={() => setReminderOpen(true)}>
                      <BellPlus className="mr-2 h-4 w-4" /> Set Reminder
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setFlagOpen(true)}
                  >
                    <Flag className="mr-2 h-4 w-4" /> Flag as inappropriate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TableCell>
        </TableRow>
        {dialogs}
      </>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative h-full transition-all duration-300 ease-in-out $
        ${
        isDismissing
          ? "translate-y-2 scale-[0.98] opacity-0 pointer-events-none"
          : "opacity-100"
      }`}
    >
      <div className="h-full">
        <Card
          className={`${helpCardShellClass} relative flex h-full flex-col overflow-hidden`}
        >
          <CardContent className="flex flex-1 flex-col gap-5 p-5">
            {/* Header: status badge + three-dot menu */}
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-center justify-between">
                <RequestStatusBadge
                  status={isCompleted ? "complete" : "in-progress"}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {menuContext !== "helped" && onDismiss && (
                      <DropdownMenuItem onClick={handleCantHelp}>
                        <EyeOff className="mr-2 h-4 w-4" /> I can't help with
                        this
                      </DropdownMenuItem>
                    )}
                    {menuContext !== "helped" && (
                      <DropdownMenuItem onClick={() => setReminderOpen(true)}>
                        <BellPlus className="mr-2 h-4 w-4" /> Set Reminder
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setFlagOpen(true)}
                    >
                      <Flag className="mr-2 h-4 w-4" /> Flag as inappropriate
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Preview: title, date, body */}
              <RequestCardPreview
                id={card.id}
                requestSummary={currentCard.requestSummary}
                request={currentCard.request}
                endDate={currentCard.endDate}
              />

              {/* Spacer: grows between content and divider */}
              <div className="flex-1" />

              {/* Divider: always at bottom of this section */}
              <div className="border-t border-border" />
            </div>

            {/* Footer: REQUESTED BY */}
            <CardPersonRow
              avatarUrl={currentCard.avatarUrl}
              name={currentCard.name}
              trustedFor={currentCard.trustedFor}
              label={isCompleted ? "WHO YOU HELPED" : "REQUESTED BY"}
              avatarBorderClass={
                isCompleted ? "border-success-600" : "border-background"
              }
              action={
                <Button
                  variant="outline"
                  className="h-10 rounded-full font-semibold border-primary text-primary gap-2 text-sm leading-none px-5"
                  onClick={() => setChatOpen(true)}
                >
                  <MessagesSquare className="h-4 w-4" />
                  {isCompleted ? "View" : "Chat"}
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>

      {dialogs}
    </div>
  );
};
