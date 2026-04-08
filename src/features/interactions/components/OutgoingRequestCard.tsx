import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  MoreHorizontal,
  Megaphone,
  MegaphoneOff,
  Check,
  MessagesSquare,
  User,
} from "lucide-react";
import { AudienceBadge } from "@/components/AudienceBadge";
import {
  IncomingRequestCard,
  helpCardShellClass,
  ReadFullRequestButton,
  RequestCardPreview,
  CardPersonRow,
  RequestStatusBadge,
} from "@/features/dashboard/components/HelpRequestCards";
import { UserIdentityLink } from "@/components/UserIdentityLink";
import type { CardData } from "@/features/dashboard/types";
import type { HelperResponse, MyHelpRequest, RawMessage } from "@/features/interactions/utils/data";
import { interactionChats } from "@/features/interactions/utils/data";
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
  HelpRequestDialog,
  REQUEST_CATEGORIES,
  type EditPayload,
} from "@/features/requests/components/HelpRequestDialog";
import {
  ChatMultiHelperModal,
  type Message as MultiChatMessage,
  type CompletionFeedback,
} from "@/features/dashboard/components/ChatMultiHelperModal";
import completionFeedbackData from "../../../../data/interaction-completion-feedback.json";
import currentUser from "../../../../data/current-user.json";
import type { AskContact } from "@/features/dashboard/components/AppShell";

export const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const formatLeadMessage = (summary: string, details: string) => {
  const trimmedSummary = summary.trim();
  const trimmedDetails = details.trim();
  if (!trimmedSummary) return trimmedDetails;
  const cleanSummary = trimmedSummary.replace(/[.!?]\s*$/, "");
  return `${cleanSummary}. ${trimmedDetails}`;
};

export const getMockMessages = (
  cardId: string,
  requestSummary: string,
  requestText: string,
) => {
  const isMyRequest =
    cardId.startsWith("request-") || cardId.startsWith("req-");

  const preset = (interactionChats as Record<string, RawMessage[]>)[cardId];

  if (preset) {
    return preset;
  }

  return [
    {
      id: 1,
      sender: isMyRequest ? "user" : "contact",
      text: formatLeadMessage(requestSummary, requestText),
    },
  ];
};

export const buildCompletionFeedback = (
  responses: HelperResponse[],
) => {
  const result: Record<string, CompletionFeedback> = {};
  for (const r of responses) {
    const stored = (
      completionFeedbackData as Record<string, CompletionFeedback>
    )[r.chatId];
    if (stored) result[r.id] = stored;
  }
  return result;
};

export const buildMultiChatMessages = (
  responses: HelperResponse[],
  requestSummary = "",
  requestText = "",
): Record<string, MultiChatMessage[]> => {
  const result: Record<string, MultiChatMessage[]> = {};
  const FAKE_TIMESTAMPS = [
    "9:15 am – Mon Jan 12",
    "10:30 am – Mon Jan 12",
    "2:45 pm – Mon Jan 12",
    "4:00 pm – Mon Jan 12",
    "9:00 am – Tue Jan 13",
    "11:20 am – Tue Jan 13",
    "3:10 pm – Tue Jan 13",
    "5:00 pm – Tue Jan 13",
  ];

  for (const r of responses) {
    const raw = (interactionChats as Record<string, RawMessage[]>)[r.chatId] ?? [];
    const mapped: MultiChatMessage[] = raw
      .filter((message) => message.sender === "user" || message.sender === "contact")
      .map((message, idx: number) => ({
        id: String(message.id ?? idx),
        sender:
          message.sender === "user" ? ("outgoing" as const) : ("incoming" as const),
        text: message.text,
        timestamp: FAKE_TIMESTAMPS[idx] ?? "",
      }));

    // Fall back to a single lead message so the chat is never blank
    result[r.id] = mapped.length > 0
      ? mapped
      : [{ id: `lead-${r.id}`, sender: "outgoing", text: formatLeadMessage(requestSummary, requestText), timestamp: FAKE_TIMESTAMPS[0] }];
  }
  return result;
};

export const OutgoingRequestCard = ({
  request,
  hideUnpromoted = false,
  onDelete,
  onUpdate,
  layout = "grid",
  contacts = [],
}: {
  request: MyHelpRequest;
  hideUnpromoted?: boolean;
  onDelete?: (id: string) => void;
  onUpdate?: (updatedRequest: MyHelpRequest) => void;
  layout?: "grid" | "list";
  contacts?: AskContact[];
}) => {
  const [currentRequest, setCurrentRequest] = React.useState(request);
  const [editOpen, setEditOpen] = React.useState(false);
  const [isPromotionActive, setIsPromotionActive] = React.useState(
    request.promoted ?? true,
  );
  const [isRemoving, setIsRemoving] = React.useState(false);
  const [multiChatOpen, setMultiChatOpen] = React.useState(false);
  const [multiChatInitialId, setMultiChatInitialId] = React.useState<
    string | undefined
  >(undefined);

  React.useEffect(() => {
    setCurrentRequest(request);
    setIsPromotionActive(request.promoted ?? true);
  }, [request]);

  const handleSaveEdit = (payload: EditPayload) => {
    const updated = {
      ...currentRequest,
      requestSummary: payload.shortDescription || currentRequest.requestSummary,
      request: payload.requestDetails || currentRequest.request,
      type: payload.askMode,
    };
    setCurrentRequest(updated);
    onUpdate?.(updated);
  };

  const handleCompleteRequest = () => {
    const updated = {
      ...currentRequest,
      status: "Closed" as const,
      promoted: false,
    };
    setCurrentRequest(updated);
    setIsPromotionActive(false);
    onUpdate?.(updated);
  };

  const togglePromotion = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = !isPromotionActive;
    setIsPromotionActive(newValue);
    onUpdate?.({ ...currentRequest, promoted: newValue });
  };

  const listViewDate = formatEndDate(currentRequest.endDate, false);

  const isPromotable =
    ["circle", "community"].includes(currentRequest.type) &&
    currentRequest.status !== "Closed";

  // Hide card if hideUnpromoted is true and promotion is stopped
  if (hideUnpromoted && !isPromotionActive && isPromotable) {
    return null;
  }

  const isCompleted =
    currentRequest.status === "Closed" ||
    (currentRequest.type === "contact" &&
      currentRequest.responses.some((r) => r.status === "Completed"));
  const isEditable = !isCompleted && currentRequest.responses.length === 0;

  const isPaused = !isCompleted && isPromotable && !isPromotionActive;
  const hasHelpers = currentRequest.responses.length > 0;
  const isMany = currentRequest.responses.length > 1;

  const RowView = (
    <TableRow
      className={`hover:bg-transparent transition-opacity duration-200 $
        ${
        isRemoving ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Request: linked title + truncated body */}
      <TableCell className="py-5 pl-4">
        <a
          href={`/trusted-list/requests/view/${currentRequest.id}`}
          className="group/link flex flex-col min-w-0 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-base font-medium leading-tight text-card-foreground truncate transition-colors group-hover/link:text-primary">
            {currentRequest.requestSummary}
          </p>
        </a>
      </TableCell>

      {/* End Date */}
      <TableCell className="py-5 text-base text-card-foreground whitespace-nowrap">
        {listViewDate}
      </TableCell>

      {/* Audience */}
      <TableCell className="py-5 whitespace-nowrap">
        <AudienceBadge audience={currentRequest.type} />
      </TableCell>

      {/* Topic */}
      <TableCell className="py-5">
        {currentRequest.category ? (
          <Badge
            variant="outline"
            className="rounded-full capitalize leading-4"
          >
            {currentRequest.category}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Status */}
      <TableCell className="py-5">
        {isCompleted ? (
          <Badge
            variant="outline"
            className="rounded-full border-emerald-200 bg-emerald-100 font-bold text-emerald-800 leading-4"
          >
            Complete
          </Badge>
        ) : isPaused ? (
          <Badge
            variant="outline"
            className="rounded-full border-amber-200 bg-amber-100 font-bold text-amber-800 leading-4"
          >
            Paused
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="rounded-full border-blue-200 bg-blue-100 font-bold text-blue-800 leading-4"
          >
            Open
          </Badge>
        )}
      </TableCell>

      {/* Responses */}
      <TableCell className="py-5">
        {hasHelpers ? (
          <div className="flex items-center -space-x-2 pr-2">
            {currentRequest.responses.slice(0, 3).map((r, i) => {
              const rInitials = getInitials(r.name);
              const rDone = r.status === "Completed";
              return (
                <button
                  key={r.id}
                  className="rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ zIndex: i + 1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMultiChatInitialId(r.id);
                    setMultiChatOpen(true);
                  }}
                  title={r.name}
                >
                  <Avatar
                    className={`h-8 w-8 shrink-0 border-2 shadow-md $
                      ${
                      rDone ? "border-emerald-600" : "border-background"
                    }`}
                  >
                    {r.avatarUrl ? (
                      <AvatarImage src={r.avatarUrl} className="object-cover" />
                    ) : null}
                    <AvatarFallback className="text-xs font-semibold bg-accent text-foreground">
                      {rInitials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              );
            })}
            {currentRequest.responses.length > 3 &&
              (() => {
                const overflowDone = currentRequest.responses
                  .slice(3)
                  .every((r) => r.status === "Completed");
                return (
                  <button
                    className="flex items-center justify-center h-8 w-8 rounded-full border-2 shadow-md text-xs font-semibold shrink-0 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    style={{ zIndex: 10 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMultiChatInitialId(undefined);
                      setMultiChatOpen(true);
                    }}
                  >
                    <span
                      className={`flex items-center justify-center w-full h-full rounded-full $
                        ${
                        overflowDone
                          ? "bg-emerald-600 text-white"
                          : "bg-card text-card-foreground"
                      }`}
                    >
                      +{currentRequest.responses.length - 3}
                    </span>
                  </button>
                );
              })()}
          </div>
        ) : (
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted border-2 border-dashed border-muted-foreground/25">
            <User className="h-4 w-4 text-muted-foreground/25" />
          </div>
        )}
      </TableCell>

      {/* Actions */}
      <TableCell className="py-5 pr-4">
        <div className="flex justify-end">
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
              <DropdownMenuItem
                onClick={() => setEditOpen(true)}
                disabled={!isEditable}
              >
                <Edit className="mr-2 h-4 w-4" /> Edit Request
              </DropdownMenuItem>
              {!isCompleted && (
                <DropdownMenuItem onClick={handleCompleteRequest}>
                  <Check className="mr-2 h-4 w-4" /> Complete request
                </DropdownMenuItem>
              )}
              {isPromotable && (
                <DropdownMenuItem onClick={togglePromotion}>
                  {isPromotionActive ? (
                    <>
                      <MegaphoneOff className="mr-2 h-4 w-4" /> Stop sharing
                    </>
                  ) : (
                    <>
                      <Megaphone className="mr-2 h-4 w-4" /> Resume sharing
                    </>
                  )}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  setIsRemoving(true);
                  setTimeout(() => onDelete?.(currentRequest.id), 180);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Request
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );

  const dialogs = (
    <>
      <HelpRequestDialog
        mode="edit"
        open={editOpen}
        onOpenChange={setEditOpen}
        categories={REQUEST_CATEGORIES}
        contacts={contacts}
        initialSummary={currentRequest.requestSummary}
        initialDetails={currentRequest.request}
        initialCategories={
          currentRequest.category ? [currentRequest.category] : []
        }
        initialDueDate={
          currentRequest.endDate ? new Date(currentRequest.endDate) : undefined
        }
        initialAskMode={currentRequest.type}
        onSubmit={handleSaveEdit}
      />
      {hasHelpers && (
        <ChatMultiHelperModal
          open={multiChatOpen}
          onOpenChange={setMultiChatOpen}
          title={currentRequest.requestSummary}
          contacts={currentRequest.responses.map((r) => ({
            id: r.id,
            name: r.name,
            role: r.role ?? "Helper",
            trustedFor: r.trustedFor ?? null,
            avatarUrl: r.avatarUrl ?? null,
            isCompleted: r.status === "Completed",
          }))}
          messagesByContactId={buildMultiChatMessages(currentRequest.responses, currentRequest.requestSummary, currentRequest.request)}
          completionFeedbackByContactId={buildCompletionFeedback(
            currentRequest.responses,
          )}
          requesterName={currentUser.firstName}
          initialContactId={multiChatInitialId}
        />
      )}
    </>
  );

  if (layout === "list") {
    return (
      <>
        {RowView}
        {dialogs}
      </>
    );
  }

  return (
    <div
      className={`transition-all duration-200 ease-in-out relative h-full $
        ${
        isRemoving
          ? "opacity-0 scale-95 pointer-events-none"
          : "opacity-100 scale-100"
      }`}
    >
      <div className="h-full">
        <Card
          className={`${helpCardShellClass} relative flex h-full flex-col overflow-hidden`}
        >
          <CardContent className="flex flex-1 flex-col gap-5 p-5">
            {/* Header + preview wrapper — 8px gap between badge and content (Figma "Container") */}
            <div className="flex flex-1 flex-col gap-2">
              {/* Header: status badge + three-dot menu */}
              <div className="flex items-center justify-between">
                {isCompleted ? (
                  <RequestStatusBadge status="completed" />
                ) : isPaused ? (
                  <RequestStatusBadge status="paused" />
                ) : (
                  <AudienceBadge audience={currentRequest.type} />
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setEditOpen(true)}
                      disabled={!isEditable}
                    >
                      <Edit className="mr-2 h-4 w-4" /> Edit request
                    </DropdownMenuItem>
                    {!isCompleted && (
                      <DropdownMenuItem onClick={handleCompleteRequest}>
                        <Check className="mr-2 h-4 w-4" /> Complete request
                      </DropdownMenuItem>
                    )}
                    {isPromotable && (
                      <DropdownMenuItem onClick={togglePromotion}>
                        {isPromotionActive ? (
                          <>
                            <MegaphoneOff className="mr-2 h-4 w-4" /> Stop
                            sharing
                          </>
                        ) : (
                          <>
                            <Megaphone className="mr-2 h-4 w-4" /> Resume
                            sharing
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => {
                        setIsRemoving(true);
                        setTimeout(() => onDelete?.(currentRequest.id), 180);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete request
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Preview: title, date, body text */}
              <RequestCardPreview
                id={currentRequest.id}
                requestSummary={currentRequest.requestSummary}
                request={currentRequest.request}
                endDate={currentRequest.endDate}
              />

              {/* Spacer: grows between content and divider */}
              <div className="flex-1" />

              {/* Divider: always at bottom of this section */}
              <div className="border-t border-border" />
            </div>

            {/* Footer: WHO'S HELPING / WHO HELPED */}
            {hasHelpers && (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-normal text-muted-foreground">
                  {isCompleted ? "WHO HELPED" : "WHO'S HELPING"}
                </p>
                {isMany ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center -space-x-2.5 pr-2.5">
                      {currentRequest.responses.slice(0, 3).map((r, i) => {
                        const rInitials = getInitials(r.name);
                        const rDone = r.status === "Completed";
                        return (
                          <button
                            key={r.id}
                            className="rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            style={{ zIndex: i + 1 }}
                            onClick={() => {
                              setMultiChatInitialId(r.id);
                              setMultiChatOpen(true);
                            }}
                            title={r.name}
                          >
                            <Avatar
                              className={`h-10 w-10 shrink-0 border-2 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] $
                                ${
                                rDone
                                  ? "border-success-600"
                                  : "border-background"
                              }`}
                            >
                              {r.avatarUrl ? (
                                <AvatarImage
                                  src={r.avatarUrl}
                                  className="object-cover"
                                />
                              ) : null}
                              <AvatarFallback>{rInitials}</AvatarFallback>
                            </Avatar>
                          </button>
                        );
                      })}
                      {currentRequest.responses.length > 3 &&
                        (() => {
                          const overflowDone = currentRequest.responses
                            .slice(3)
                            .every((r) => r.status === "Completed");
                          return (
                            <button
                              className="rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              style={{ zIndex: 10 }}
                              onClick={() => {
                                setMultiChatInitialId(undefined);
                                setMultiChatOpen(true);
                              }}
                            >
                              <Avatar
                                className={`h-10 w-10 shrink-0 border-2 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] $
                                  ${
                                  overflowDone
                                    ? "border-success-600"
                                    : "border-background"
                                }`}
                              >
                                <AvatarFallback
                                  className={`text-sm font-semibold $
                                    ${
                                    overflowDone
                                      ? "bg-success-600 text-primary-foreground"
                                      : "bg-card text-card-foreground"
                                  }`}
                                >
                                  +{currentRequest.responses.length - 3}
                                </AvatarFallback>
                              </Avatar>
                            </button>
                          );
                        })()}
                    </div>
                    <Button
                      variant="outline"
                      className="h-10 rounded-full font-semibold border-primary text-primary gap-2 text-sm leading-none shrink-0 px-5"
                      onClick={() => setMultiChatOpen(true)}
                    >
                      <MessagesSquare className="h-4 w-4" />
                      View Conversations
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    {currentRequest.responses[0] &&
                      (() => {
                        const r = currentRequest.responses[0];
                        const rInitials = getInitials(r.name);
                        return (
                          <>
                            <UserIdentityLink
                              avatarUrl={r.avatarUrl}
                              name={r.name}
                              trustedFor={r.trustedFor ? [r.trustedFor] : []}
                              href={`/trusted-list/members/${r.name.toLowerCase().replace(/\s+/g, "-")}`}
                              avatarSize="sm"
                              avatarBorderClass={isCompleted ? "border-success-600" : "border-background"}
                              showTrustedFor={!!r.trustedFor}
                              className="min-w-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMultiChatInitialId(r.id);
                                setMultiChatOpen(true);
                              }}
                            />
                            <Button
                              variant="outline"
                              className="h-10 rounded-full font-semibold border-primary text-primary gap-2 text-sm leading-none shrink-0 px-5"
                              onClick={() => {
                                setMultiChatInitialId(r.id);
                                setMultiChatOpen(true);
                              }}
                            >
                              <MessagesSquare className="h-4 w-4" />
                              Chat
                            </Button>
                          </>
                        );
                      })()}
                  </div>
                )}
              </div>
            )}

            {!hasHelpers && (
              <div className="flex justify-end">
                <ReadFullRequestButton
                  href={`/trusted-list/requests/view/${currentRequest.id}`}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {dialogs}
    </div>
  );
};
