import React from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessagesSquare,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Edit,
  Trash2,
  MoreHorizontal,
  MoreVertical,
  Flag,
  User,
  Users,
  Globe,
  Megaphone,
  MegaphoneOff,
  EyeOff,
  Sparkles,
  Hand,
  BellPlus,
  Check,
  ListFilter,
  SlidersHorizontal,
  Search,
  X,
  ChevronUp,
  Calendar,
} from "lucide-react";
import { LayoutToggle } from "@/components/LayoutToggle";

import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import {
  AudienceBadge,
  cardVariantToAudienceKey,
} from "@/components/AudienceBadge";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  IncomingRequestCard,
  helpCardShellClass,
  ReadFullRequestButton,
  RequestCardPreview,
  CardPersonRow,
  RequestStatusBadge,
} from "@/features/dashboard/components/HelpRequestCards";
import type { CardData } from "@/features/dashboard/types";
import {
  interactions,
  myHelpRequests,
  interactionChats,
  type HelperResponse,
  type MyHelpRequest,
  type RawMessage,
} from "@/features/interactions/utils/data";
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
  FilterSidebar,
  FilterAccordionSection,
} from "@/components/FilterSidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AskForHelpDialog,
  type AskContact,
} from "@/features/dashboard/components/AppShell";
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
import { Checkbox } from "@/components/ui/checkbox";
import askContent from "../../../../data/dashboard-content.json";

// Helper: normalize CardData variant → audience filter key
const variantToAudienceKey = (variant: string) => {
  if (variant === "contact") return "contact";
  if (variant === "community") return "community";
  return "circle";
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

type ColumnDef = { key: string; label: string; className?: string };

const SortableTableHeader = ({
  columns,
  sortKey,
  sortDir,
  onSort,
  actionsClassName = "pr-4 text-right",
}: {
  columns: ColumnDef[];
  sortKey: string | null;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  actionsClassName?: string;
}) => (
  <TableHeader className="[&_th]:uppercase [&_th]:tracking-wider [&_th]:text-xs [&_th_button]:uppercase [&_th_button]:tracking-wider [&_th_button]:text-xs [&_tr]:border-foreground">
    <TableRow>
      {columns.map(({ key, label, className }) => {
        const active = sortKey === key;
        const Icon = active
          ? sortDir === "asc"
            ? ArrowUp
            : ArrowDown
          : ArrowUpDown;
        return (
          <TableHead key={key} className={className ?? ""}>
            <button
              onClick={() => onSort(key)}
              className="group/th flex items-center gap-1 hover:text-foreground transition-colors"
            >
              {label}
              <Icon
                className={`h-3 w-3 shrink-0 transition-opacity ${
                  active
                    ? "opacity-100 text-foreground"
                    : "opacity-0 group-hover/th:opacity-40"
                }`}
              />
            </button>
          </TableHead>
        );
      })}
      <TableHead className={actionsClassName}>Actions</TableHead>
    </TableRow>
  </TableHeader>
);

const countActiveFilters = (filters: SidebarFilters) =>
  filters.audiences.length +
  filters.topics.length +
  filters.statuses.length +
  filters.responses.length +
  (filters.dateFrom ? 1 : 0) +
  (filters.dateTo ? 1 : 0);

function filterCardData(
  cards: (CardData & { status?: string })[],
  filters: SidebarFilters,
  search: string,
) {
  const fromTime = filters.dateFrom
    ? new Date(filters.dateFrom).getTime()
    : null;
  const toTime = filters.dateTo ? new Date(filters.dateTo).getTime() : null;
  return cards.filter((card) => {
    if (
      filters.audiences.length > 0 &&
      !filters.audiences.includes(variantToAudienceKey(card.variant))
    )
      return false;
    if (
      filters.topics.length > 0 &&
      (!card.category || !filters.topics.includes(card.category))
    )
      return false;
    if (filters.statuses.length > 0) {
      const isCompleted = card.status === "Completed";
      const matches =
        (filters.statuses.includes("completed") && isCompleted) ||
        (filters.statuses.includes("inProgress") && !isCompleted);
      if (!matches) return false;
    }
    if (fromTime && card.endDate && new Date(card.endDate).getTime() < fromTime)
      return false;
    if (toTime && card.endDate && new Date(card.endDate).getTime() > toTime)
      return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !card.requestSummary?.toLowerCase().includes(q) &&
        !card.name?.toLowerCase().includes(q) &&
        !card.request?.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });
}

function computeCardFilterOptions(
  cards: (CardData & { status?: string })[],
  getStatus?: (card: CardData & { status?: string }) => {
    inProgress: boolean;
    completed: boolean;
  },
): AvailableFilterOptions {
  const topics = new Set<string>();
  let hasCircle = false,
    hasCommunity = false;
  let hasInProgress = false,
    hasCompleted = false;

  for (const c of cards) {
    if (c.category) topics.add(c.category);
    const key = variantToAudienceKey(c.variant);
    if (key === "circle") hasCircle = true;
    if (key === "community") hasCommunity = true;
    if (getStatus) {
      const s = getStatus(c);
      if (s.inProgress) hasInProgress = true;
      if (s.completed) hasCompleted = true;
    }
  }

  return {
    topics: [...topics].sort(),
    audience: { contact: false, circle: hasCircle, community: hasCommunity },
    statuses: {
      inProgress: hasInProgress,
      paused: false,
      completed: hasCompleted,
    },
    responses: { none: false, has: false },
  };
}

function useSortState<K extends string>(
  initialKey: K | null,
  initialDir: "asc" | "desc" = "asc",
) {
  const [sortKey, setSortKey] = React.useState<K | null>(initialKey);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">(initialDir);
  const handleSort = (key: string) => {
    const k = key as K;
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  };
  return { sortKey, sortDir, handleSort };
}

type Reminder = {
  id: string;
  cardId: string;
  requestSummary: string;
  requesterName: string;
  requesterAvatarUrl?: string;
  reminderTime: string;
};

const formatReminderTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  if (diffDays <= 0) return `Today at ${timeStr}`;
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  return `${weekday} at ${timeStr}`;
};

// Custom card for "My Requests" with different actions
const formatLeadMessage = (summary: string, details: string) => {
  const trimmedSummary = summary.trim();
  const trimmedDetails = details.trim();
  if (!trimmedSummary) return trimmedDetails;
  const cleanSummary = trimmedSummary.replace(/[.!?]\s*$/, "");
  return `${cleanSummary}. ${trimmedDetails}`;
};

const getMockMessages = (
  cardId: string,
  requestSummary: string,
  requestText: string,
): RawMessage[] => {
  const isMyRequest =
    cardId.startsWith("request-") || cardId.startsWith("req-");
  const preset = interactionChats[cardId];

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

const REMINDER_PRESETS = [
  { key: "tomorrow", label: "Tomorrow morning" },
  { key: "3days", label: "In 3 days" },
  { key: "nextweek", label: "Next week" },
  { key: "custom", label: "Pick a date…" },
] as const;

const getPresetDate = (key: string): Date => {
  const d = new Date();
  if (key === "tomorrow") {
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
  } else if (key === "3days") {
    d.setDate(d.getDate() + 3);
    d.setHours(9, 0, 0, 0);
  } else if (key === "nextweek") {
    d.setDate(d.getDate() + 7);
    d.setHours(9, 0, 0, 0);
  }
  return d;
};

const SetReminderDialog = ({
  open,
  onOpenChange,
  requesterName,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requesterName: string;
  onConfirm: (reminderTime: string) => void;
}) => {
  const [selectedPreset, setSelectedPreset] =
    React.useState<string>("tomorrow");
  const [customDate, setCustomDate] = React.useState("");
  const [customTime, setCustomTime] = React.useState("09:00");

  React.useEffect(() => {
    if (open) {
      setSelectedPreset("tomorrow");
      setCustomDate("");
      setCustomTime("09:00");
    }
  }, [open]);

  const handleConfirm = () => {
    let reminderTime: string;
    if (selectedPreset === "custom") {
      if (!customDate) return;
      reminderTime = new Date(
        `${customDate}T${customTime || "09:00"}`,
      ).toISOString();
    } else {
      reminderTime = getPresetDate(selectedPreset).toISOString();
    }
    onConfirm(reminderTime);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellPlus className="h-4 w-4 text-primary" />
            Set a reminder
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Remind you to follow up on{" "}
            <span className="font-medium text-foreground">
              {requesterName}'s
            </span>{" "}
            request.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {REMINDER_PRESETS.map((preset) => (
              <button
                key={preset.key}
                onClick={() => setSelectedPreset(preset.key)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium text-left transition-colors ${
                  selectedPreset === preset.key
                    ? "border-primary bg-primary-10 text-primary"
                    : "border-border bg-background hover:bg-muted-50 text-foreground"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {selectedPreset === "custom" && (
            <div className="flex gap-2">
              <Input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="flex-1"
                min={new Date().toISOString().split("T")[0]}
              />
              <Input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="w-28"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-full font-semibold"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="rounded-full font-semibold"
            onClick={handleConfirm}
            disabled={selectedPreset === "custom" && !customDate}
          >
            Set Reminder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

type HelpingCardSortKey = "name" | "request" | "endDate" | "audience" | "topic";

const sortHelpingCards = (
  cards: (CardData & {
    status?: string;
    statusDate?: string;
    karma?: number;
  })[],
  key: HelpingCardSortKey | null,
  dir: "asc" | "desc",
) => {
  if (!key) return cards;
  const d = dir === "asc" ? 1 : -1;
  return [...cards].sort((a, b) => {
    switch (key) {
      case "name":
        return d * (a.name ?? "").localeCompare(b.name ?? "");
      case "request":
        return (
          d * (a.requestSummary ?? "").localeCompare(b.requestSummary ?? "")
        );
      case "endDate": {
        if (!a.endDate && !b.endDate) return 0;
        if (!a.endDate) return d;
        if (!b.endDate) return -d;
        return (
          d * (new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
        );
      }
      case "audience":
        return (
          d *
          variantToAudienceKey(a.variant).localeCompare(
            variantToAudienceKey(b.variant),
          )
        );
      case "topic":
        return d * (a.category ?? "").localeCompare(b.category ?? "");
      default:
        return 0;
    }
  });
};

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

function buildCompletionFeedback(
  responses: HelperResponse[],
): Record<string, CompletionFeedback> {
  const result: Record<string, CompletionFeedback> = {};
  for (const r of responses) {
    const stored = (
      completionFeedbackData as Record<string, CompletionFeedback>
    )[r.chatId];
    if (stored) result[r.id] = stored;
  }
  return result;
}

function buildMultiChatMessages(
  responses: HelperResponse[],
): Record<string, MultiChatMessage[]> {
  const result: Record<string, MultiChatMessage[]> = {};
  for (const r of responses) {
    const raw = interactionChats[r.chatId] ?? [];
    result[r.id] = raw
      .filter((m) => m.sender === "user" || m.sender === "contact")
      .map((m, idx) => ({
        id: String(m.id ?? idx),
        sender:
          m.sender === "user" ? ("outgoing" as const) : ("incoming" as const),
        text: m.text,
        timestamp: FAKE_TIMESTAMPS[idx] ?? "",
      }));
  }
  return result;
}

const OutgoingRequestCard = ({
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
      className={`hover:bg-transparent transition-opacity duration-200 ${
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
                    className={`h-8 w-8 shrink-0 border-2 shadow-md ${
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
                      className={`flex items-center justify-center w-full h-full rounded-full ${
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
          messagesByContactId={buildMultiChatMessages(currentRequest.responses)}
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
      className={`transition-all duration-200 ease-in-out relative h-full ${
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
                      <MoreVertical className="h-4 w-4" />
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
                              className={`h-10 w-10 shrink-0 border-2 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] ${
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
                                className={`h-10 w-10 shrink-0 border-2 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] ${
                                  overflowDone
                                    ? "border-success-600"
                                    : "border-background"
                                }`}
                              >
                                <AvatarFallback
                                  className={`text-sm font-semibold ${
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
                            <div className="flex items-center gap-2 min-w-0">
                              <button
                                className="rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                                onClick={() => {
                                  setMultiChatInitialId(r.id);
                                  setMultiChatOpen(true);
                                }}
                                title={r.name}
                              >
                                <Avatar
                                  className={`h-10 w-10 border-2 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] ${
                                    isCompleted
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
                              <div className="flex flex-col min-w-0">
                                <span className="text-base font-semibold text-card-foreground truncate leading-6">
                                  {r.name}
                                </span>
                                <span className="text-xs text-muted-foreground leading-4 line-clamp-2">
                                  Trusted for {r.trustedFor}
                                </span>
                              </div>
                            </div>
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

const HelpingCard = ({
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

  const multiChatMessages: MultiChatMessage[] = React.useMemo(() => {
    const raw =
      interactionChats[card.id] ??
      getMockMessages(card.id, card.requestSummary || "", card.request);
    return raw
      .filter((m) => m.sender === "user" || m.sender === "contact")
      .map((m) => ({
        id: String(m.id),
        text: m.text,
        sender:
          m.sender === "user" ? ("outgoing" as const) : ("incoming" as const),
        timestamp: "",
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
          className={`hover:bg-transparent transition-opacity duration-300 ease-in-out ${
            isDismissing ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          {/* Requestor */}
          <TableCell className="py-5 pl-4">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                className={`h-10 w-10 shrink-0 border-2 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] ${
                  isCompleted ? "border-success-600" : "border-background"
                }`}
              >
                {currentCard.avatarUrl ? (
                  <AvatarImage
                    src={currentCard.avatarUrl}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-base font-medium truncate leading-tight">
                  {currentCard.name}
                </span>{" "}
              </div>
            </div>
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
      className={`relative h-full transition-all duration-300 ease-in-out ${
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

const ReminderListRow = ({
  card,
  reminderLabel,
  onClear,
}: {
  card: CardData;
  reminderLabel: string;
  onClear: () => void;
}) => {
  const [chatOpen, setChatOpen] = React.useState(false);
  const [flagOpen, setFlagOpen] = React.useState(false);
  const [isDismissing, setIsDismissing] = React.useState(false);

  const rawFirstName = card.name.split(" ")[0] ?? card.name;
  const firstName =
    rawFirstName.length > 12 ? rawFirstName.slice(0, 12) + "…" : rawFirstName;
  const initials = getInitials(card.name);

  const initialText = React.useMemo(() => {
    const s = card.requestSummary?.trim() ?? "";
    const d = card.request.trim();
    if (!s) return d;
    return `${s.replace(/[.!?]\s*$/, "")}. ${d}`;
  }, [card.requestSummary, card.request]);

  const initialMessages = React.useMemo(
    (): MultiChatMessage[] => [
      { id: "seed", sender: "incoming", text: initialText, timestamp: "" },
    ],
    [initialText],
  );

  const handleDismiss = () => {
    if (isDismissing) return;
    setIsDismissing(true);
    setTimeout(() => onClear(), 250);
  };

  return (
    <>
      <TableRow
        className={`hover:bg-transparent transition-opacity duration-300 ease-in-out ${
          isDismissing ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        {/* Requestor */}
        <TableCell className="py-5 pl-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-10 w-10 shrink-0 border-2 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] border-background">
              {card.avatarUrl ? (
                <AvatarImage src={card.avatarUrl} className="object-cover" />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="text-base font-medium truncate leading-tight">
              {card.name}
            </span>
          </div>
        </TableCell>
        {/* Request */}
        <TableCell className="py-5">
          <a
            href={`/trusted-list/requests/view/${card.id}`}
            className="group/link flex flex-col min-w-0 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-medium leading-tight text-card-foreground truncate transition-colors group-hover/link:text-primary">
              {card.requestSummary}
            </p>
          </a>
        </TableCell>
        {/* Reminder */}
        <TableCell className="py-5 whitespace-nowrap">
          <span className="inline-flex items-center gap-1 rounded-full border border-lime-200 bg-lime-50 px-2.5 py-1 text-xs font-medium text-lime-700">
            <BellPlus className="h-3 w-3 shrink-0" />
            {reminderLabel}
          </span>
        </TableCell>
        {/* Audience */}
        <TableCell className="py-5 whitespace-nowrap">
          <AudienceBadge audience={cardVariantToAudienceKey(card.variant)} />
        </TableCell>
        {/* Topic */}
        <TableCell className="py-5">
          {card.category ? (
            <Badge
              variant="outline"
              className="rounded-full capitalize leading-4"
            >
              {card.category}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        {/* Actions */}
        <TableCell className="py-5 pr-4">
          <div className="flex justify-end items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="max-w-[9rem] px-3 h-8 text-xs font-semibold rounded-full gap-1.5 border shadow-sm hover:bg-accent hover:text-accent-foreground overflow-hidden"
              onClick={(e) => {
                e.stopPropagation();
                setChatOpen(true);
              }}
            >
              <MessagesSquare className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Help {firstName}</span>
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
                <DropdownMenuItem onClick={handleDismiss}>
                  <EyeOff className="mr-2 h-4 w-4" /> I can't help with this
                </DropdownMenuItem>
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

      <ChatMultiHelperModal
        open={chatOpen}
        onOpenChange={setChatOpen}
        title={card.requestSummary ?? card.request.slice(0, 60)}
        contacts={[
          {
            id: card.id,
            name: card.name,
            role: "",
            trustedFor: card.trustedFor ?? null,
            avatarUrl: card.avatarUrl ?? null,
          },
        ]}
        messagesByContactId={{ [card.id]: initialMessages }}
      />

      <FlagRequestDialog
        open={flagOpen}
        onOpenChange={setFlagOpen}
        requestorName={card.name}
        requestorAvatarUrl={card.avatarUrl || undefined}
        requestSummary={card.requestSummary}
        requestText={card.request}
        onSubmit={handleDismiss}
      />
    </>
  );
};

const RemindersTabContent = ({
  reminders,
  onDismiss,
  inProgressCards,
  layout,
  onLayoutChange,
}: {
  reminders: Reminder[];
  onDismiss: (id: string) => void;
  inProgressCards: (CardData & { status?: string; statusDate?: string })[];
  layout: "grid" | "list";
  onLayoutChange: (layout: "grid" | "list") => void;
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<SidebarFilters>(
    defaultSidebarFilters,
  );
  type ReminderSortKey = "name" | "request" | "reminder" | "audience" | "topic";
  const { sortKey, sortDir, handleSort } =
    useSortState<ReminderSortKey>("reminder");

  const cardById = React.useMemo(
    () => new Map(inProgressCards.map((c) => [c.id, c])),
    [inProgressCards],
  );

  const filterOptions = React.useMemo((): AvailableFilterOptions => {
    const topics = new Set<string>();
    let hasCircle = false,
      hasCommunity = false;
    for (const reminder of reminders) {
      const card = cardById.get(reminder.cardId);
      if (!card) continue;
      if (card.category) topics.add(card.category);
      const key = variantToAudienceKey(card.variant);
      if (key === "circle") hasCircle = true;
      if (key === "community") hasCommunity = true;
    }
    return {
      topics: [...topics].sort(),
      audience: { contact: false, circle: hasCircle, community: hasCommunity },
      statuses: { inProgress: false, paused: false, completed: false },
      responses: { none: false, has: false },
    };
  }, [reminders, cardById]);

  const activeFilterCount = filters.audiences.length + filters.topics.length;

  const filtered = reminders.filter((reminder) => {
    const card = cardById.get(reminder.cardId);
    if (!card) return false;
    if (
      filters.audiences.length > 0 &&
      !filters.audiences.includes(variantToAudienceKey(card.variant))
    )
      return false;
    if (
      filters.topics.length > 0 &&
      (!card.category || !filters.topics.includes(card.category))
    )
      return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !card.requestSummary?.toLowerCase().includes(q) &&
        !card.name?.toLowerCase().includes(q) &&
        !card.request?.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const cardA = cardById.get(a.cardId);
    const cardB = cardById.get(b.cardId);
    const d = sortDir === "asc" ? 1 : -1;
    switch (sortKey) {
      case "name":
        return d * (cardA?.name ?? "").localeCompare(cardB?.name ?? "");
      case "request":
        return (
          d *
          (cardA?.requestSummary ?? "").localeCompare(
            cardB?.requestSummary ?? "",
          )
        );
      case "reminder":
        return (
          d *
          (new Date(a.reminderTime).getTime() -
            new Date(b.reminderTime).getTime())
        );
      case "audience":
        return (
          d *
          variantToAudienceKey(cardA?.variant ?? "").localeCompare(
            variantToAudienceKey(cardB?.variant ?? ""),
          )
        );
      case "topic":
        return d * (cardA?.category ?? "").localeCompare(cardB?.category ?? "");
      default:
        return (
          new Date(a.reminderTime).getTime() -
          new Date(b.reminderTime).getTime()
        );
    }
  });

  return (
    <>
      <FilterBar
        layout={layout}
        onLayoutChange={onLayoutChange}
        onOpenFilterSidebar={() => setFilterOpen(true)}
        isFiltered={activeFilterCount > 0}
        activeFilterCount={activeFilterCount}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <FilterSidebar
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={(f) => setFilters(f as SidebarFilters)}
        appliedFilters={filters}
        defaultFilters={defaultSidebarFilters}
        audienceOptions={filterOptions.audience}
        extraSections={buildFilterExtraSections(filterOptions)}
      />

      {reminders.length === 0 ? (
        <Empty className="w-full border min-h-[380px] rounded-3xl border-border-50 bg-muted-25">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BellPlus />
            </EmptyMedia>
            <EmptyTitle>No pending reminders</EmptyTitle>
            <EmptyDescription>
              When you snooze a request to revisit later, it'll show up here so
              nothing slips through.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : layout === "grid" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((reminder) => {
            const card = cardById.get(reminder.cardId);
            if (!card) return null;
            return (
              <IncomingRequestCard
                key={reminder.id}
                {...card}
                reminderLabel={formatReminderTime(reminder.reminderTime)}
                onClear={() => onDismiss(reminder.id)}
              />
            );
          })}
        </div>
      ) : (
        <div className="hidden lg:block rounded-xl overflow-x-auto">
          <Table className="table-fixed min-w-[67rem]">
            <SortableTableHeader
              columns={[
                { key: "name", label: "Requestor", className: "pl-4 w-[15%]" },
                { key: "request", label: "Request", className: "w-[30%]" },
                { key: "reminder", label: "Reminder", className: "w-[12rem]" },
                { key: "audience", label: "Audience", className: "w-[10rem]" },
                { key: "topic", label: "Topic" },
              ]}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              actionsClassName="pr-4 w-[13rem] text-right"
            />
            <TableBody className="[&_tr]:bg-card">
              {sorted.map((reminder) => {
                const card = cardById.get(reminder.cardId);
                if (!card) return null;
                return (
                  <ReminderListRow
                    key={reminder.id}
                    card={card}
                    reminderLabel={formatReminderTime(reminder.reminderTime)}
                    onClear={() => onDismiss(reminder.id)}
                  />
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
};

// ─── Filter Sidebar ────────────────────────────────────────────────────────

type SidebarFilters = {
  dateFrom: string;
  dateTo: string;
  audiences: string[];
  topics: string[];
  statuses: string[];
  responses: string[];
};

const defaultSidebarFilters: SidebarFilters = {
  dateFrom: "",
  dateTo: "",
  audiences: [],
  topics: [],
  statuses: [],
  responses: [],
};

type AvailableFilterOptions = {
  topics: string[];
  audience: { contact: boolean; circle: boolean; community: boolean };
  statuses: { inProgress: boolean; paused: boolean; completed: boolean };
  responses: { none: boolean; has: boolean };
};

function buildFilterExtraSections(options: AvailableFilterOptions) {
  return (
    pending: SidebarFilters,
    toggle: (field: string, value: string) => void,
  ) => (
    <>
      {options.topics.length > 0 && (
        <FilterAccordionSection title="Topic">
          {options.topics.map((topic) => (
            <div key={topic} className="flex items-center gap-3">
              <Checkbox
                id={`filter-topic-${topic}`}
                checked={pending.topics.includes(topic)}
                onCheckedChange={() => toggle("topics", topic)}
              />
              <Label
                htmlFor={`filter-topic-${topic}`}
                className="cursor-pointer font-normal"
              >
                <Badge
                  variant="outline"
                  className="rounded-full capitalize font-bold leading-4"
                >
                  {topic}
                </Badge>
              </Label>
            </div>
          ))}
        </FilterAccordionSection>
      )}
      {(options.statuses.inProgress ||
        options.statuses.paused ||
        options.statuses.completed) && (
        <FilterAccordionSection title="Status">
          {options.statuses.inProgress && (
            <div className="flex items-center gap-3">
              <Checkbox
                id="filter-status-inprogress"
                checked={pending.statuses.includes("inProgress")}
                onCheckedChange={() => toggle("statuses", "inProgress")}
              />
              <Label
                htmlFor="filter-status-inprogress"
                className="cursor-pointer font-normal"
              >
                <Badge
                  variant="outline"
                  className="rounded-full border-blue-200 bg-blue-100 font-bold text-blue-800 leading-4"
                >
                  In Progress
                </Badge>
              </Label>
            </div>
          )}
          {options.statuses.paused && (
            <div className="flex items-center gap-3">
              <Checkbox
                id="filter-status-paused"
                checked={pending.statuses.includes("paused")}
                onCheckedChange={() => toggle("statuses", "paused")}
              />
              <Label
                htmlFor="filter-status-paused"
                className="cursor-pointer font-normal"
              >
                <Badge
                  variant="outline"
                  className="rounded-full border-amber-200 bg-amber-100 font-bold text-amber-800 leading-4"
                >
                  Sharing Paused
                </Badge>
              </Label>
            </div>
          )}
          {options.statuses.completed && (
            <div className="flex items-center gap-3">
              <Checkbox
                id="filter-status-completed"
                checked={pending.statuses.includes("completed")}
                onCheckedChange={() => toggle("statuses", "completed")}
              />
              <Label
                htmlFor="filter-status-completed"
                className="cursor-pointer font-normal"
              >
                <Badge
                  variant="outline"
                  className="rounded-full border-emerald-200 bg-emerald-100 font-bold text-emerald-800 leading-4"
                >
                  Completed
                </Badge>
              </Label>
            </div>
          )}
        </FilterAccordionSection>
      )}
      {(options.responses.none || options.responses.has) && (
        <FilterAccordionSection title="Responses">
          {options.responses.none && (
            <div className="flex items-center gap-3">
              <Checkbox
                id="filter-responses-none"
                checked={pending.responses.includes("none")}
                onCheckedChange={() => toggle("responses", "none")}
              />
              <Label
                htmlFor="filter-responses-none"
                className="cursor-pointer font-normal text-sm"
              >
                No responses
              </Label>
            </div>
          )}
          {options.responses.has && (
            <div className="flex items-center gap-3">
              <Checkbox
                id="filter-responses-has"
                checked={pending.responses.includes("has")}
                onCheckedChange={() => toggle("responses", "has")}
              />
              <Label
                htmlFor="filter-responses-has"
                className="cursor-pointer font-normal text-sm"
              >
                Response received
              </Label>
            </div>
          )}
        </FilterAccordionSection>
      )}
    </>
  );
}

// ─── Filter Bar ─────────────────────────────────────────────────────────────

const FilterBar = ({
  layout,
  onLayoutChange,
  showFilter = true,
  onOpenFilterSidebar,
  isFiltered = false,
  activeFilterCount = 0,
  projection,
  primaryAction,
  searchValue,
  onSearchChange,
}: {
  layout: "grid" | "list";
  onLayoutChange: (layout: "grid" | "list") => void;
  showFilter?: boolean;
  onOpenFilterSidebar?: () => void;
  isFiltered?: boolean;
  activeFilterCount?: number;
  projection?: {
    label: string;
    value: string;
    sublabel?: string;
    tone?: "success" | "info";
  };
  primaryAction?: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}) => {
  return (
    <section className="mb-6 flex items-center justify-between rounded-2xl border bg-card px-4 py-3 shadow-sm">
      {/* Left: projection + primary action + search */}
      <div className="flex items-center gap-4">
        {projection && (
          <div
            className={`flex items-center gap-3 rounded-lg border px-3 py-2 shadow-sm ${
              projection.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-primary-25 bg-primary-10 text-primary"
            }`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/75">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-xs font-semibold uppercase tracking-wide">
                {projection.label}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold leading-tight">
                  {projection.value}
                </span>
                {projection.sublabel && (
                  <span className="text-[11px] text-muted-foreground leading-tight">
                    {projection.sublabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        {primaryAction}
        {onSearchChange !== undefined && (
          <div className="flex items-center gap-2 h-9 w-80 px-3 rounded-full border bg-background">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search requests"
              value={searchValue ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground outline-none"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right: filter + layout toggle */}
      <div className="flex items-center gap-4">
        {showFilter && onOpenFilterSidebar && (
          <Button
            variant="outline"
            className={`h-9 rounded-full font-semibold gap-2 bg-background ${
              isFiltered ? "border-primary text-primary" : ""
            }`}
            onClick={onOpenFilterSidebar}
          >
            <SlidersHorizontal size={16} />
            Filter requests
            {activeFilterCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full text-[10px] font-bold px-0.5 bg-primary/10 text-primary">
                {activeFilterCount}
              </span>
            )}
          </Button>
        )}

        {/* Layout toggle pill */}
        <LayoutToggle
          layout={layout}
          onChange={onLayoutChange}
          className="border bg-background px-1.5"
        />
      </div>
    </section>
  );
};

const validTabs = [
  "helped",
  "in-progress",
  "my-requests",
  "reminders",
] as const;
type TabValue = (typeof validTabs)[number];

export default function InteractionsPage() {
  // Start with a fixed tab for SSR consistency; adjust after mount.
  const [activeTab, setActiveTab] = React.useState<TabValue>("in-progress");
  const [autoOpenCardId, setAutoOpenCardId] = React.useState<string | null>(
    null,
  );
  const [layout, setLayout] = React.useState<"grid" | "list">("grid");

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("interactions-layout");
      if (saved === "list" || saved === "grid") setLayout(saved);
    } catch {}
  }, []);

  const handleLayoutChange = React.useCallback((value: "grid" | "list") => {
    setLayout(value);
    try {
      localStorage.setItem("interactions-layout", value);
    } catch {}
  }, []);

  // Set default layout based on active tab only if no preference has been saved
  React.useEffect(() => {
    try {
      if (localStorage.getItem("interactions-layout")) return;
    } catch {}
    if (activeTab === "in-progress" || activeTab === "reminders") {
      setLayout("grid");
    } else if (activeTab === "helped" || activeTab === "my-requests") {
      setLayout("list");
    }
  }, [activeTab]);

  // Filter sidebar state
  const [openFilterSidebar, setOpenFilterSidebar] = React.useState<
    "my-requests" | "helped" | "in-progress" | null
  >(null);
  const [sidebarFilters, setSidebarFilters] = React.useState<SidebarFilters>(
    defaultSidebarFilters,
  );
  const [helpedFilters, setHelpedFilters] = React.useState<SidebarFilters>(
    defaultSidebarFilters,
  );
  const [inProgressFilters, setInProgressFilters] =
    React.useState<SidebarFilters>(defaultSidebarFilters);

  const [askDialogOpen, setAskDialogOpen] = React.useState(false);
  const [myRequestsData, setMyRequestsData] = React.useState(myHelpRequests);
  const [myRequestsSearch, setMyRequestsSearch] = React.useState("");
  const [helpedSearchQuery, setHelpedSearchQuery] = React.useState("");
  const [inProgressSearchQuery, setInProgressSearchQuery] = React.useState("");

  const handleDeleteRequest = (id: string) => {
    setMyRequestsData((prev: any[]) => {
      const index = prev.findIndex((item: any) => item.id === id);
      const item = prev[index];
      if (!item) return prev;
      const next = prev.filter((i: any) => i.id !== id);
      toast("Request deleted", {
        description: item.requestSummary,
        action: {
          label: "Undo",
          onClick: () =>
            setMyRequestsData((current: any[]) => {
              const restored = [...current];
              restored.splice(Math.min(index, current.length), 0, item);
              return restored;
            }),
        },
      });
      return next;
    });
  };
  type SortKey =
    | "request"
    | "endDate"
    | "audience"
    | "topic"
    | "status"
    | "responses";
  const { sortKey, sortDir, handleSort } = useSortState<SortKey>(
    "endDate",
    "desc",
  );
  const [helpedCards, setHelpedCards] = React.useState(interactions.helped);
  const [inProgressCards, setInProgressCards] = React.useState(
    interactions.inProgress,
  );
  const [reminders, setReminders] = React.useState<Reminder[]>([
    {
      id: "reminder-mock-1",
      cardId: "progress-1",
      requestSummary: "Pitch deck feedback for seed round",
      requesterName: "David Kim",
      requesterAvatarUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces",
      reminderTime: new Date(
        Date.now() + 1 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
    {
      id: "reminder-mock-2",
      cardId: "progress-2",
      requestSummary: "Career transition guidance",
      requesterName: "Emily Watson",
      requesterAvatarUrl:
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=faces",
      reminderTime: new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
  ]);

  const handleHelpedFlagged = React.useCallback(
    (id: string) =>
      setHelpedCards((prev) => prev.filter((item) => item.id !== id)),
    [],
  );
  const handleInProgressRemove = React.useCallback(
    (id: string) =>
      setInProgressCards((prev) => prev.filter((item) => item.id !== id)),
    [],
  );
  const handleReminderSet = React.useCallback(
    (reminder: Reminder) => setReminders((prev) => [...prev, reminder]),
    [],
  );
  const handleReminderDismiss = React.useCallback(
    (id: string) => setReminders((prev) => prev.filter((r) => r.id !== id)),
    [],
  );

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const openParam = params.get("open");
    const stored = localStorage.getItem("interactions-active-tab");
    const next = tabParam || stored;
    if (next && (validTabs as readonly string[]).includes(next)) {
      setActiveTab(next as TabValue);
    }
    if (openParam) {
      setAutoOpenCardId(openParam);
    }
    if (stored) {
      localStorage.removeItem("interactions-active-tab");
    }
  }, []);

  const askContacts = React.useMemo(
    () =>
      (askContent as { askForHelpCard: { contacts: AskContact[] } })
        .askForHelpCard.contacts,
    [],
  );

  const handleRequestHelpSend = React.useCallback(
    (payload: {
      shortDescription: string;
      requestDetails: string;
      requestCategories: string[];
      askMode: "contact" | "circle" | "community";
      selectedContacts: AskContact[];
      dueDate?: Date;
    }) => {
      const id = `request-${Date.now()}`;
      const responses =
        payload.askMode === "contact"
          ? payload.selectedContacts.map((contact, idx) => ({
              id: `${id}-resp-${idx}`,
              name: contact.name,
              status: "In Progress" as const,
              chatId: `${id}-chat-${idx}`,
            }))
          : [];

      const newRequest: MyHelpRequest = {
        id,
        requestSummary: payload.shortDescription,
        request: payload.requestDetails,
        responses,
        status: "Open",
        type: payload.askMode,
        createdAt: new Date().toISOString(),
        promoted: payload.askMode !== "contact",
        endDate: payload.dueDate ? payload.dueDate.toISOString() : undefined,
      };

      setMyRequestsData((prev: any[]) => [newRequest, ...prev]);
      setActiveTab("my-requests");
      const params = new URLSearchParams(window.location.search);
      params.set("tab", "my-requests");
      window.history.replaceState(null, "", `?${params.toString()}`);
    },
    [],
  );

  const filteredRequests = React.useMemo(() => {
    return myRequestsData
      .filter((request: any) => {
        const isCompleted =
          request.status === "Closed" ||
          (request.type === "contact" &&
            request.responses.some((r: any) => r.status === "Completed"));
        const isPromotable =
          ["circle", "community"].includes(request.type) &&
          request.status !== "Closed";
        const isPaused = isPromotable && request.promoted === false;
        const isInProgress = !isCompleted && !isPaused;

        // Audience filter
        if (
          sidebarFilters.audiences.length > 0 &&
          !sidebarFilters.audiences.includes(request.type)
        )
          return false;

        // Topic filter
        if (sidebarFilters.topics.length > 0) {
          if (
            !request.category ||
            !sidebarFilters.topics.includes(request.category)
          )
            return false;
        }

        // Status filter
        if (sidebarFilters.statuses.length > 0) {
          const matches =
            (sidebarFilters.statuses.includes("inProgress") && isInProgress) ||
            (sidebarFilters.statuses.includes("paused") && isPaused) ||
            (sidebarFilters.statuses.includes("completed") && isCompleted);
          if (!matches) return false;
        }

        // Responses filter
        if (sidebarFilters.responses.length > 0) {
          const hasResponses = request.responses.length > 0;
          const matches =
            (sidebarFilters.responses.includes("none") && !hasResponses) ||
            (sidebarFilters.responses.includes("has") && hasResponses);
          if (!matches) return false;
        }

        // Date range filter (applied to endDate)
        if (sidebarFilters.dateFrom && request.endDate) {
          if (new Date(request.endDate) < new Date(sidebarFilters.dateFrom))
            return false;
        }
        if (sidebarFilters.dateTo && request.endDate) {
          if (new Date(request.endDate) > new Date(sidebarFilters.dateTo))
            return false;
        }

        // Search filter
        if (myRequestsSearch) {
          const q = myRequestsSearch.toLowerCase();
          if (
            !request.requestSummary.toLowerCase().includes(q) &&
            !request.request.toLowerCase().includes(q)
          )
            return false;
        }

        return true;
      })
      .sort((a: any, b: any) => {
        const aIsCompleted =
          a.status === "Closed" ||
          (a.type === "contact" &&
            a.responses.some((r: any) => r.status === "Completed"));
        const bIsCompleted =
          b.status === "Closed" ||
          (b.type === "contact" &&
            b.responses.some((r: any) => r.status === "Completed"));

        if (aIsCompleted && !bIsCompleted) return 1;
        if (!aIsCompleted && bIsCompleted) return -1;

        const aHasDeadline = !!a.endDate;
        const bHasDeadline = !!b.endDate;

        if (aHasDeadline && !bHasDeadline) return -1;
        if (!aHasDeadline && bHasDeadline) return 1;

        if (aHasDeadline && bHasDeadline) {
          return (
            new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime()
          );
        }

        return 0;
      });
  }, [myRequestsData, sidebarFilters, myRequestsSearch]);

  const sortedRequests = React.useMemo(() => {
    if (!sortKey) return filteredRequests;
    const dir = sortDir === "asc" ? 1 : -1;
    const audienceOrder = { contact: 0, circle: 1, community: 2 };
    const responseScore = (r: MyHelpRequest) => {
      if (r.responses.length === 0) return 0;
      if (r.responses.every((x) => x.status === "Completed")) return 2;
      return 1;
    };
    const statusScore = (r: MyHelpRequest) => {
      const done =
        r.status === "Closed" ||
        (r.type === "contact" &&
          r.responses.some((x) => x.status === "Completed"));
      if (done) return 2;
      const paused =
        ["circle", "community"].includes(r.type) && r.promoted === false;
      return paused ? 1 : 0;
    };
    return [...filteredRequests].sort((a, b) => {
      switch (sortKey) {
        case "request":
          return dir * a.requestSummary.localeCompare(b.requestSummary);
        case "endDate": {
          const ta = a.endDate ? new Date(a.endDate).getTime() : Infinity;
          const tb = b.endDate ? new Date(b.endDate).getTime() : Infinity;
          return dir * (ta - tb);
        }
        case "audience":
          return (
            dir *
            (audienceOrder[a.type as keyof typeof audienceOrder] -
              audienceOrder[b.type as keyof typeof audienceOrder])
          );
        case "topic":
          return dir * (a.category ?? "").localeCompare(b.category ?? "");
        case "status":
          return dir * (statusScore(a) - statusScore(b));
        case "responses":
          return dir * (responseScore(a) - responseScore(b));
        default:
          return 0;
      }
    });
  }, [filteredRequests, sortKey, sortDir]);

  const availableFilterOptions = React.useMemo((): AvailableFilterOptions => {
    const topics = new Set<string>();
    let hasContact = false,
      hasCircle = false,
      hasCommunity = false;
    let hasInProgress = false,
      hasPaused = false,
      hasCompleted = false;
    let hasNoResponses = false,
      hasWithResponses = false;

    for (const r of myRequestsData) {
      if (r.category) topics.add(r.category);
      if (r.type === "contact") hasContact = true;
      if (r.type === "circle") hasCircle = true;
      if (r.type === "community") hasCommunity = true;

      const isCompleted =
        r.status === "Closed" ||
        (r.type === "contact" &&
          r.responses.some((resp: any) => resp.status === "Completed"));
      const isPromotable =
        ["circle", "community"].includes(r.type) && r.status !== "Closed";
      const isPaused = isPromotable && r.promoted === false;

      if (isCompleted) hasCompleted = true;
      else if (isPaused) hasPaused = true;
      else hasInProgress = true;

      if (r.responses.length === 0) hasNoResponses = true;
      else hasWithResponses = true;
    }

    return {
      topics: [...topics].sort(),
      audience: {
        contact: hasContact,
        circle: hasCircle,
        community: hasCommunity,
      },
      statuses: {
        inProgress: hasInProgress,
        paused: hasPaused,
        completed: hasCompleted,
      },
      responses: { none: hasNoResponses, has: hasWithResponses },
    };
  }, [myRequestsData]);

  const activeFilterCount = countActiveFilters(sidebarFilters);
  const isFiltered = activeFilterCount > 0;

  const helpedFilterOptions = React.useMemo(
    () => computeCardFilterOptions(helpedCards),
    [helpedCards],
  );

  const filteredHelpedCards = React.useMemo(
    () => filterCardData(helpedCards, helpedFilters, helpedSearchQuery),
    [helpedCards, helpedFilters, helpedSearchQuery],
  );

  const helpedActiveFilterCount = countActiveFilters(helpedFilters);

  const inProgressFilterOptions = React.useMemo(
    () =>
      computeCardFilterOptions(inProgressCards, (c) => ({
        inProgress: c.status !== "Completed",
        completed: c.status === "Completed",
      })),
    [inProgressCards],
  );

  const filteredInProgressCards = React.useMemo(
    () =>
      filterCardData(inProgressCards, inProgressFilters, inProgressSearchQuery),
    [inProgressCards, inProgressFilters, inProgressSearchQuery],
  );

  const inProgressActiveFilterCount = countActiveFilters(inProgressFilters);

  const {
    sortKey: helpedSortKey,
    sortDir: helpedSortDir,
    handleSort: handleHelpedSort,
  } = useSortState<HelpingCardSortKey>("endDate", "desc");
  const {
    sortKey: inProgressSortKey,
    sortDir: inProgressSortDir,
    handleSort: handleInProgressSort,
  } = useSortState<HelpingCardSortKey>("endDate");

  const sortedHelpedCards = React.useMemo(
    () => sortHelpingCards(filteredHelpedCards, helpedSortKey, helpedSortDir),
    [filteredHelpedCards, helpedSortKey, helpedSortDir],
  );

  const sortedInProgressCards = React.useMemo(
    () =>
      sortHelpingCards(
        filteredInProgressCards,
        inProgressSortKey,
        inProgressSortDir,
      ),
    [filteredInProgressCards, inProgressSortKey, inProgressSortDir],
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background w-full">
        <AppSidebar />
        <SidebarInset className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden">
          <div className="flex items-center gap-3 border-b bg-background px-4 py-5 lg:hidden">
            <SidebarTrigger className="border border-border" />
          </div>
          <div className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
            <div className="mx-auto w-full">
              {/* Main Header */}
              <header className="mb-10 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h1 className="font-serif text-5xl font-normal leading-none">
                    My Help Activity
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    All the ways you help and get help — in one place.
                  </p>
                </div>
                <Button
                  className="rounded-full font-semibold shrink-0"
                  onClick={() => setAskDialogOpen(true)}
                >
                  <Hand className="mr-2 h-4 w-4" />
                  Ask for help
                </Button>
              </header>

              {/* Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={(val) => setActiveTab(val as TabValue)}
                className="w-full"
              >
                <div className="flex justify-center h-12">
                  <TabsList className="inline-flex gap-1.5 rounded-full p-1 min-w-[400px]">
                    <TabsTrigger
                      value="in-progress"
                      className="rounded-full px-4 font-medium min-w-[100px] justify-center data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground"
                    >
                      In Progress
                    </TabsTrigger>
                    <TabsTrigger
                      value="reminders"
                      className="group rounded-full px-4 font-medium gap-1.5 min-w-[120px] justify-between data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground"
                    >
                      <span>Reminders</span>
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-card text-xs font-medium text-primary group-data-[state=active]:bg-secondary">
                        {reminders.length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="helped"
                      className="rounded-full px-4 font-medium min-w-[100px] justify-center data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground"
                    >
                      Helped
                    </TabsTrigger>
                    <TabsTrigger
                      value="my-requests"
                      className="rounded-full px-4 font-medium min-w-[120px] justify-center data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground"
                    >
                      My Requests
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="mt-4 min-h-[500px]">
                  <TabsContent
                    value="helped"
                    className="mt-2"
                    style={{ position: "relative" }}
                  >
                    <FilterBar
                      layout={layout}
                      onLayoutChange={handleLayoutChange}
                      onOpenFilterSidebar={() => setOpenFilterSidebar("helped")}
                      isFiltered={helpedActiveFilterCount > 0}
                      activeFilterCount={helpedActiveFilterCount}
                      searchValue={helpedSearchQuery}
                      onSearchChange={setHelpedSearchQuery}
                    />
                    {sortedHelpedCards.length === 0 &&
                    (helpedActiveFilterCount > 0 || helpedSearchQuery) ? (
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <ListFilter />
                          </EmptyMedia>
                          <EmptyTitle>No results match your filters</EmptyTitle>
                          <EmptyDescription>
                            Try adjusting or clearing your filters to see
                            results.
                          </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <Button
                            variant="outline"
                            className="rounded-full font-semibold"
                            onClick={() => {
                              setHelpedFilters(defaultSidebarFilters);
                              setHelpedSearchQuery("");
                            }}
                          >
                            Reset filters
                          </Button>
                        </EmptyContent>
                      </Empty>
                    ) : layout === "list" ? (
                      <div className="hidden lg:block rounded-xl overflow-x-auto">
                        <Table className="table-fixed min-w-[67rem]">
                          <SortableTableHeader
                            columns={[
                              {
                                key: "name",
                                label: "Requestor",
                                className: "pl-4 w-[15%]",
                              },
                              {
                                key: "request",
                                label: "Request",
                                className: "w-[30%]",
                              },
                              { key: "endDate", label: "End Date" },
                              {
                                key: "audience",
                                label: "Audience",
                                className: "w-[10rem]",
                              },
                              { key: "topic", label: "Topic" },
                            ]}
                            sortKey={helpedSortKey}
                            sortDir={helpedSortDir}
                            onSort={handleHelpedSort}
                          />
                          <TableBody className="[&_tr]:bg-card">
                            {sortedHelpedCards.map((card) => (
                              <HelpingCard
                                key={card.id}
                                card={card}
                                layout="list"
                                menuContext="helped"
                                onFlagged={handleHelpedFlagged}
                              />
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {sortedHelpedCards.map((card) => (
                          <HelpingCard
                            key={card.id}
                            card={card}
                            layout="grid"
                            menuContext="helped"
                            onFlagged={handleHelpedFlagged}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent
                    value="in-progress"
                    className="mt-2"
                    style={{ position: "relative" }}
                  >
                    <FilterBar
                      layout={layout}
                      onLayoutChange={handleLayoutChange}
                      onOpenFilterSidebar={() =>
                        setOpenFilterSidebar("in-progress")
                      }
                      isFiltered={inProgressActiveFilterCount > 0}
                      activeFilterCount={inProgressActiveFilterCount}
                      searchValue={inProgressSearchQuery}
                      onSearchChange={setInProgressSearchQuery}
                    />
                    {sortedInProgressCards.length === 0 &&
                    (inProgressActiveFilterCount > 0 ||
                      inProgressSearchQuery) ? (
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <ListFilter />
                          </EmptyMedia>
                          <EmptyTitle>No results match your filters</EmptyTitle>
                          <EmptyDescription>
                            Try adjusting or clearing your filters to see
                            results.
                          </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <Button
                            variant="outline"
                            className="rounded-full font-semibold"
                            onClick={() => {
                              setInProgressFilters(defaultSidebarFilters);
                              setInProgressSearchQuery("");
                            }}
                          >
                            Reset filters
                          </Button>
                        </EmptyContent>
                      </Empty>
                    ) : layout === "list" ? (
                      <div className="hidden lg:block rounded-xl overflow-x-auto">
                        <Table className="table-fixed min-w-[67rem]">
                          <SortableTableHeader
                            columns={[
                              {
                                key: "name",
                                label: "Requestor",
                                className: "pl-4 w-[15%]",
                              },
                              {
                                key: "request",
                                label: "Request",
                                className: "w-[30%]",
                              },
                              { key: "endDate", label: "End Date" },
                              {
                                key: "audience",
                                label: "Audience",
                                className: "w-[10rem]",
                              },
                              { key: "topic", label: "Topic" },
                            ]}
                            sortKey={inProgressSortKey}
                            sortDir={inProgressSortDir}
                            onSort={handleInProgressSort}
                          />
                          <TableBody className="[&_tr]:bg-card">
                            {sortedInProgressCards.map((card) => (
                              <HelpingCard
                                key={card.id}
                                card={card}
                                layout="list"
                                menuContext="in-progress"
                                onDismiss={handleInProgressRemove}
                                onFlagged={handleInProgressRemove}
                                onReminderSet={handleReminderSet}
                                autoOpen={card.id === autoOpenCardId}
                              />
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {sortedInProgressCards.map((card) => (
                          <HelpingCard
                            key={card.id}
                            card={card}
                            layout="grid"
                            menuContext="in-progress"
                            onDismiss={handleInProgressRemove}
                            onFlagged={handleInProgressRemove}
                            onReminderSet={handleReminderSet}
                            autoOpen={card.id === autoOpenCardId}
                          />
                        ))}

                        {inProgressCards.length === 0 && (
                          <div className="flex h-full min-h-[380px] w-full items-center justify-center rounded-3xl border border-primary-25 bg-primary-10 p-8 text-center md:col-span-2 lg:col-span-3">
                            <div className="flex flex-col items-center justify-center gap-3 max-w-md">
                              <div className="space-y-2">
                                <p className="text-sm font-semibold text-primary">
                                  Community spotlight
                                </p>
                                <h3 className="text-xl font-bold text-foreground">
                                  Looking for people to help?
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Browse every open request across the Trusted
                                  List and jump into the ones that fit you best.
                                </p>
                              </div>
                              <div className="mt-2">
                                <Button
                                  asChild
                                  className="rounded-full font-semibold"
                                >
                                  <a href="/trusted-list/requests">
                                    Explore all open requests
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent
                    value="my-requests"
                    className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                    style={{ position: "relative" }}
                  >
                    <FilterBar
                      layout={layout}
                      onLayoutChange={handleLayoutChange}
                      onOpenFilterSidebar={() =>
                        setOpenFilterSidebar("my-requests")
                      }
                      isFiltered={isFiltered}
                      activeFilterCount={activeFilterCount}
                      searchValue={myRequestsSearch}
                      onSearchChange={setMyRequestsSearch}
                    />
                    {filteredRequests.length === 0 &&
                    (isFiltered || myRequestsSearch) ? (
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <ListFilter />
                          </EmptyMedia>
                          <EmptyTitle>
                            No requests match your filters
                          </EmptyTitle>
                          <EmptyDescription>
                            Try adjusting or resetting your filters to see
                            results.
                          </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <Button
                            variant="outline"
                            className="rounded-full font-semibold"
                            onClick={() => {
                              setSidebarFilters(defaultSidebarFilters);
                              setMyRequestsSearch("");
                            }}
                          >
                            Reset filters
                          </Button>
                        </EmptyContent>
                      </Empty>
                    ) : layout === "list" ? (
                      <div className="hidden lg:block rounded-xl overflow-x-auto">
                        <Table className="table-fixed min-w-[67rem]">
                          <SortableTableHeader
                            columns={[
                              {
                                key: "request",
                                label: "Request",
                                className: "pl-4 w-[35%]",
                              },
                              { key: "endDate", label: "End Date" },
                              {
                                key: "audience",
                                label: "Audience",
                                className: "w-[10rem]",
                              },
                              { key: "topic", label: "Topic" },
                              { key: "status", label: "Status" },
                              { key: "responses", label: "Responses" },
                            ]}
                            sortKey={sortKey}
                            sortDir={sortDir}
                            onSort={handleSort}
                          />
                          <TableBody className="[&_tr]:bg-card">
                            {sortedRequests.map((request: any) => (
                              <OutgoingRequestCard
                                key={request.id}
                                request={request}
                                hideUnpromoted={false}
                                contacts={askContacts}
                                onDelete={handleDeleteRequest}
                                onUpdate={(updated: any) =>
                                  setMyRequestsData((prev: any[]) =>
                                    prev.map((item: any) =>
                                      item.id === updated.id ? updated : item,
                                    ),
                                  )
                                }
                                layout="list"
                              />
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredRequests.map((request: any) => (
                          <OutgoingRequestCard
                            key={request.id}
                            request={request}
                            hideUnpromoted={false}
                            contacts={askContacts}
                            onDelete={handleDeleteRequest}
                            onUpdate={(updated: any) =>
                              setMyRequestsData((prev: any[]) =>
                                prev.map((item: any) =>
                                  item.id === updated.id ? updated : item,
                                ),
                              )
                            }
                            layout="grid"
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent
                    value="reminders"
                    className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                    style={{ position: "relative" }}
                  >
                    <RemindersTabContent
                      reminders={reminders}
                      onDismiss={handleReminderDismiss}
                      inProgressCards={inProgressCards}
                      layout={layout}
                      onLayoutChange={handleLayoutChange}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
          <AskForHelpDialog
            open={askDialogOpen}
            onOpenChange={setAskDialogOpen}
            contacts={askContacts}
            onSendRequest={handleRequestHelpSend}
          />
          <FilterSidebar
            open={openFilterSidebar === "my-requests"}
            onClose={() => setOpenFilterSidebar(null)}
            onApply={(f) => setSidebarFilters(f as SidebarFilters)}
            appliedFilters={sidebarFilters}
            defaultFilters={defaultSidebarFilters}
            audienceOptions={availableFilterOptions.audience}
            extraSections={buildFilterExtraSections(availableFilterOptions)}
          />
          <FilterSidebar
            open={openFilterSidebar === "helped"}
            onClose={() => setOpenFilterSidebar(null)}
            onApply={(f) => setHelpedFilters(f as SidebarFilters)}
            appliedFilters={helpedFilters}
            defaultFilters={defaultSidebarFilters}
            audienceOptions={helpedFilterOptions.audience}
            extraSections={buildFilterExtraSections(helpedFilterOptions)}
          />
          <FilterSidebar
            open={openFilterSidebar === "in-progress"}
            onClose={() => setOpenFilterSidebar(null)}
            onApply={(f) => setInProgressFilters(f as SidebarFilters)}
            appliedFilters={inProgressFilters}
            defaultFilters={defaultSidebarFilters}
            audienceOptions={inProgressFilterOptions.audience}
            extraSections={buildFilterExtraSections(inProgressFilterOptions)}
          />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
