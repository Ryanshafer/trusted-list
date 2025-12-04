import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, MessageCircle, Edit, Trash2, MoreHorizontal, Flag, User, Users, Globe, Megaphone, MegaphoneOff, LayoutGrid, List, Eye, EyeOff, Sparkles, Hand } from "lucide-react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { HelpRequestCard } from "@/features/dashboard/components/HelpRequestCards";
import { ChatDialog, type ChatMessage, type CompletionData } from "@/features/dashboard/components/ChatDialog";
import type { CardData } from "@/features/dashboard/types";
import { interactions, myHelpRequests, interactionChats, type HelperResponse, type MyHelpRequest } from "@/features/interactions/data";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AskForHelpDialog, type AskContact } from "@/components/AppShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Toggle } from "@/components/ui/toggle";
import askContent from "../../../../data/dashboard-content.json";


// Enhanced HelpRequestCard wrapper with status badge
const InteractionCardWithStatus = ({ card }: { card: CardData & { status?: string; statusDate?: string } }) => {
  // Status badges intentionally removed for helped/in-progress views
  return <HelpRequestCard {...card} />;
};

// Custom card for "My Requests" with different actions
const formatLeadMessage = (summary: string, details: string) => {
  const trimmedSummary = summary.trim();
  const trimmedDetails = details.trim();
  if (!trimmedSummary) return trimmedDetails;
  const cleanSummary = trimmedSummary.replace(/[.!?]\s*$/, "");
  return `${cleanSummary}. ${trimmedDetails}`;
};

const getMockMessages = (cardId: string, requestSummary: string, requestText: string): ChatMessage[] => {
  const isMyRequest = cardId.startsWith("request-") || cardId.startsWith("req-");
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

const EditRequestDialog = ({
  open,
  onOpenChange,
  card,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: CardData;
  onSave: (data: Partial<CardData>) => void;
}) => {
  const [summary, setSummary] = React.useState(card.requestSummary || "");
  const [details, setDetails] = React.useState(card.request);
  const [category, setCategory] = React.useState("Career advice");

  const handleSave = () => {
    onSave({
      requestSummary: summary,
      request: details,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Short description</Label>
            <Input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              maxLength={32}
              placeholder="e.g. Introduction to CTO needed"
            />
            <p className="text-xs text-muted-foreground text-right">{summary.length}/32</p>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Career advice">Career advice</SelectItem>
                <SelectItem value="Introduction">Introduction</SelectItem>
                <SelectItem value="Feedback">Feedback</SelectItem>
                <SelectItem value="Hiring">Hiring</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Details</Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              placeholder="Describe what you need help with..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const HelperRow = ({
  response,
  requestSummary,
  requestDetails,
}: {
  response: HelperResponse;
  requestSummary: string;
  requestDetails: string;
}) => {
  const [chatOpen, setChatOpen] = React.useState(false);
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>(() =>
    getMockMessages(response.chatId, requestSummary, requestDetails)
  );
  const [composer, setComposer] = React.useState("");
  const [status, setStatus] = React.useState(response.status);

  const handleSendMessage = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setChatMessages((prev) => [...prev, { id: Date.now(), sender: "user", text: trimmed }]);
    setComposer("");
  };

  const handleComplete = (data: CompletionData) => {
    setChatMessages(prev => [
      ...prev,
      { id: Date.now(), sender: "system", text: "Request Completed", type: "system" },
      { id: Date.now() + 1, sender: "user", text: `+50 Karma • ${data.note || "Thank you!"}`, type: "karma" }
    ]);
    setStatus("Completed");
  };

  const handleUndoComplete = () => {
    setChatMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length > 0 && newMessages[newMessages.length - 1].type === "karma") newMessages.pop();
      if (newMessages.length > 0 && newMessages[newMessages.length - 1].type === "system") newMessages.pop();
      return newMessages;
    });
    setStatus("In Progress");
  };

  const initials = response.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div
        className="flex items-center justify-between rounded-xl bg-muted/50 p-3 transition-colors hover:bg-muted/70 cursor-pointer"
        onClick={() => setChatOpen(true)}
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            {response.avatarUrl ? <AvatarImage src={response.avatarUrl} alt={response.name} className="object-cover" /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{response.name}</span>
            {status === "Completed" && (
              <span className="text-[10px] text-muted-foreground">Completed</span>
            )}
          </div>
        </div>
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
      </div>

      <ChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        contactName={response.name}
        messages={chatMessages}
        composer={composer}
        onComposerChange={setComposer}
        onSend={handleSendMessage}
        isHelpRequest={true}
        isCompleted={status === "Completed"}
        onComplete={handleComplete}
        onUndoComplete={handleUndoComplete}
      />
    </>
  );
};

const MyHelpRequestCard = ({
  request,
  hideUnpromoted = false,
  onDelete,
}: {
  request: MyHelpRequest;
  hideUnpromoted?: boolean;
  onDelete?: (id: string) => void;
}) => {
  const [currentRequest, setCurrentRequest] = React.useState(request);
  const [editOpen, setEditOpen] = React.useState(false);
  const [isPromotionActive, setIsPromotionActive] = React.useState(
    request.promoted ?? true
  );
  const [isRemoving, setIsRemoving] = React.useState(false);
  const [showAllResponses, setShowAllResponses] = React.useState(false);

  const handleSaveEdit = (updates: Partial<CardData>) => {
    setCurrentRequest(prev => ({
      ...prev,
      requestSummary: updates.requestSummary || prev.requestSummary,
      request: updates.request || prev.request
    }));
  };

  // Convert to CardData shape for EditRequestDialog
  const cardDataForEdit: CardData = {
    id: currentRequest.id,
    variant: "circle",
    name: "", // Not needed for edit
    request: currentRequest.request,
    requestSummary: currentRequest.requestSummary,
    relationshipTag: "",
    primaryCTA: "",
  };
  const formattedEndDate =
    currentRequest.endDate && !Number.isNaN(Date.parse(currentRequest.endDate))
      ? new Date(currentRequest.endDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      : null;

  const getRequestTypeInfo = (type: MyHelpRequest["type"]) => {
    switch (type) {
      case "contact": return { label: "Ask a contact", icon: User };
      case "circle": return { label: "Ask your circle", icon: Users };
      case "list": return { label: "Ask the list", icon: Globe };
    }
  };

  const typeInfo = getRequestTypeInfo(currentRequest.type);
  const TypeIcon = typeInfo.icon;
  const isPromotable = ["circle", "list"].includes(currentRequest.type);

  // Hide card if hideUnpromoted is true and promotion is stopped
  if (hideUnpromoted && !isPromotionActive && isPromotable) {
    return null;
  }

  return (
    <div
      className={`transition-all duration-200 ease-in-out ${isRemoving ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
        }`}
    >
      <Card className="relative flex h-full flex-col rounded-3xl border border-border bg-card shadow-sm">
        <CardContent className="flex flex-1 flex-col gap-4 p-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <TypeIcon className="h-3.5 w-3.5" />
                {typeInfo.label}
              </div>
              {!isPromotionActive && isPromotable && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
                  Promotion Stopped
                </Badge>
              )}
              {currentRequest.type === "contact" && currentRequest.responses[0]?.status === "Completed" && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
                  Completed
                </Badge>
              )}
            </div>
            <div className="flex items-start justify-between">
              <div className="pr-8">
                <h3 className="text-lg font-semibold leading-tight">{currentRequest.requestSummary}</h3>
                {formattedEndDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Ends {formattedEndDate}
                  </p>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2 rounded-full text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      setIsRemoving(true);
                      setTimeout(() => onDelete?.(currentRequest.id), 180);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete request
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {currentRequest.request}
          </div>

          <div className="mt-auto pt-2">
            {currentRequest.responses.length === 0 ? (
              <div className="flex flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 border-dashed text-sm"
                  onClick={() => setEditOpen(true)}
                  disabled={isPromotionActive}
                >
                  <Edit className="h-4 w-4" />
                  Edit Request
                </Button>
                {isPromotable && (
                  <Button
                    variant={isPromotionActive ? "outline" : "ghost"}
                    className={`flex-1 gap-2 text-sm ${!isPromotionActive ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setIsPromotionActive(!isPromotionActive)}
                  >
                    {isPromotionActive ? (
                      <>
                        <MegaphoneOff className="h-4 w-4" />
                        Stop promotion
                      </>
                    ) : (
                      <>
                        <Megaphone className="h-4 w-4" />
                        Resume promotion
                      </>
                    )}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Responses
                </div>
            {(showAllResponses ? currentRequest.responses : currentRequest.responses.slice(0, 2)).map(
              (response) => (
                <HelperRow
                  key={response.id}
                  response={response}
                  requestSummary={currentRequest.requestSummary}
                  requestDetails={currentRequest.request}
                />
              )
            )}
            {currentRequest.responses.length > 2 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-sm text-primary"
                onClick={() => setShowAllResponses((prev) => !prev)}
              >
                {showAllResponses
                  ? "See fewer responses"
                  : `See ${currentRequest.responses.length - 2} more responses`}
              </Button>
            )}
            {isPromotable && (
              <Button
                variant={isPromotionActive ? "outline" : "ghost"}
                size="sm"
                className={`w-full gap-2 mt-2 text-sm ${!isPromotionActive ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setIsPromotionActive(!isPromotionActive)}
                  >
                    {isPromotionActive ? (
                      <>
                        <MegaphoneOff className="h-3.5 w-3.5" />
                        Stop promotion
                      </>
                    ) : (
                      <>
                        <Megaphone className="h-3.5 w-3.5" />
                        Resume promotion
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>

        <EditRequestDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          card={cardDataForEdit}
          onSave={handleSaveEdit}
        />
      </Card>
    </div>
  );
};

const MyRequestCard = ({ card }: { card: CardData & { status?: string; statusDate?: string } }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [badgePosition, setBadgePosition] = React.useState({ top: 88 });
  const [status, setStatus] = React.useState(card.status);
  const [currentCard, setCurrentCard] = React.useState(card);
  const [editOpen, setEditOpen] = React.useState(false);

  // Chat state
  const [chatOpen, setChatOpen] = React.useState(false);
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>(() =>
    getMockMessages(card.id, card.requestSummary || "", card.request)
  );
  const [composer, setComposer] = React.useState("");

  const handleSendMessage = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setChatMessages((prev) => [...prev, { id: Date.now(), sender: "user", text: trimmed }]);
    setComposer("");
  };

  const handleComplete = (data: CompletionData) => {
    setChatMessages(prev => [
      ...prev,
      { id: Date.now(), sender: "system", text: "Request Completed", type: "system" },
      { id: Date.now() + 1, sender: "user", text: `+50 Karma • ${data.note || "Thank you!"}`, type: "karma" }
    ]);
    setStatus("Completed");
  };

  const handleUndoComplete = () => {
    setChatMessages(prev => {
      const newMessages = [...prev];
      // Remove karma message if present at end
      if (newMessages.length > 0 && newMessages[newMessages.length - 1].type === "karma") {
        newMessages.pop();
      }
      // Remove system message if present at end
      if (newMessages.length > 0 && newMessages[newMessages.length - 1].type === "system") {
        newMessages.pop();
      }
      return newMessages;
    });
    setStatus("In Progress");
  };

  const handleSaveEdit = (updates: Partial<CardData>) => {
    setCurrentCard(prev => ({ ...prev, ...updates }));
  };

  React.useEffect(() => {
    if (!containerRef.current) return;

    const requestPreview = containerRef.current.querySelector('.group.relative.cursor-pointer');
    if (requestPreview) {
      const rect = requestPreview.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const topOffset = rect.top - containerRect.top;
      setBadgePosition({ top: topOffset - 8 });
    }
  }, []);

  const initials = card.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isMyRequest = card.id.startsWith("request-");
  const isCompleted = status === "Completed";

  return (
    <div ref={containerRef} className="relative">
      <Card className="relative flex h-full flex-col rounded-3xl border border-border bg-card shadow-sm">
        <CardContent className="flex flex-1 flex-col gap-5 p-6 pb-4">
          {/* More Options Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="absolute right-2.5 top-2.5 h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete request
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Header */}
          <div className="flex items-center gap-3 pr-10">
            <Avatar className="h-12 w-12">
              {currentCard.avatarUrl ? <AvatarImage src={currentCard.avatarUrl} alt={currentCard.name} className="object-cover" /> : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="mb-1">
              <p className="text-lg font-semibold leading-tight">{currentCard.name}</p>
              {currentCard.connectedBy && (
                <p className="text-xs text-muted-foreground/60">Connected by {currentCard.connectedBy}</p>
              )}
            </div>
          </div>

          {/* Request Preview */}
          <div className="flex flex-1 flex-col gap-2">
            <div
              className="group relative cursor-pointer rounded-3xl bg-muted/50 p-4 transition-colors hover:bg-muted/70 dark:bg-muted/40"
              onClick={() => setChatOpen(true)}
            >
              <div className="relative max-h-[4.5rem] overflow-hidden [mask-image:linear-gradient(to_bottom,black_30%,transparent_100%)]">
                <p className="text-base text-foreground/90 dark:text-slate-100 leading-relaxed">
                  {currentCard.request}
                </p>
              </div>
              <div className="mt-2 flex items-center justify-center">
                <span className="text-xs font-medium text-primary py-1 px-3 rounded-full group-hover:bg-muted">
                  Read more
                </span>
              </div>
            </div>
            <div className="flex-1" />

            {/* Primary Action */}
            <div className="mt-3 flex">
              <Button className="w-full gap-1" onClick={() => setChatOpen(true)}>
                <MessageCircle className="mr-1 h-4 w-4" />
                {isCompleted ? "Read chat history" : "Chat"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Badge */}
      {/* Status badge intentionally removed for My Requests view */}

      <ChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        contactName={currentCard.name}
        messages={chatMessages}
        composer={composer}
        onComposerChange={setComposer}
        onSend={handleSendMessage}
        isHelpRequest={isMyRequest}
        isCompleted={isCompleted}
        onComplete={handleComplete}
        onUndoComplete={handleUndoComplete}
      />

      <EditRequestDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        card={currentCard}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

const FilterBar = ({
  layout,
  onLayoutChange,
  hideCompleted,
  onHideCompletedChange,
  hideUnpromoted,
  onHideUnpromotedChange,
  showCompletedFilter = true,
  showUnpromotedFilter = false,
  projection,
  primaryAction,
}: {
  layout: "grid" | "list";
  onLayoutChange: (layout: "grid" | "list") => void;
  hideCompleted: boolean;
  onHideCompletedChange: (checked: boolean) => void;
  hideUnpromoted: boolean;
  onHideUnpromotedChange: (checked: boolean) => void;
  showCompletedFilter?: boolean;
  showUnpromotedFilter?: boolean;
  projection?: {
    label: string;
    value: string;
    sublabel?: string;
    tone?: "success" | "info";
  };
  primaryAction?: React.ReactNode;
}) => {
  return (
    <section className="mb-6 flex flex-col gap-4 rounded-xl border border-border/50 bg-muted/30 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {projection && (
            <div
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 shadow-sm ${projection.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-100"
                : "border-primary/30 bg-primary/10 text-primary"
                }`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 dark:bg-white/10">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <div className="text-xs font-semibold uppercase tracking-wide">{projection.label}</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold leading-tight">{projection.value}</span>
                  {projection.sublabel && (
                    <span className="text-[11px] text-muted-foreground leading-tight">{projection.sublabel}</span>
                  )}
                </div>
              </div>
            </div>
          )}
          {(showCompletedFilter || showUnpromotedFilter) && (
            <Label className="text-sm text-muted-foreground whitespace-nowrap">Show:</Label>
          )}
          {showCompletedFilter && (
            <Toggle
              pressed={hideCompleted}
              onPressedChange={onHideCompletedChange}
              aria-label="Toggle completed visibility"
              className="gap-2"
            >
              {hideCompleted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="text-sm">Completed</span>
            </Toggle>
          )}
          {showUnpromotedFilter && (
            <Toggle
              pressed={hideUnpromoted}
              onPressedChange={onHideUnpromotedChange}
              aria-label="Toggle unpromoted visibility"
              className="gap-2"
            >
              {hideUnpromoted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="text-sm">Unpromoted</span>
            </Toggle>
          )}
        </div>
        <div className="flex items-center gap-2">
          {primaryAction}
          <Button
            variant={layout === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9"
            onClick={() => onLayoutChange("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="sr-only">Grid view</span>
          </Button>
          <Button
            variant={layout === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9"
            onClick={() => onLayoutChange("list")}
          >
            <List className="h-4 w-4" />
            <span className="sr-only">List view</span>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default function InteractionsPage() {
  const [activeTab, setActiveTab] = React.useState("in-progress");
  const [layout, setLayout] = React.useState<"grid" | "list">("grid");
  const [hideCompleted, setHideCompleted] = React.useState(false);
  const [hideUnpromoted, setHideUnpromoted] = React.useState(false);
  const [askDialogOpen, setAskDialogOpen] = React.useState(false);
  const [myRequestsData, setMyRequestsData] = React.useState(myHelpRequests);

  const defaultKarma = interactions.helped[0]?.karma ?? 50;
  const earnedKarma = interactions.helped.reduce(
    (sum, card) => sum + (card.karma ?? defaultKarma),
    0
  );
  const projectedKarma = interactions.inProgress.length * defaultKarma;

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && ["helped", "in-progress", "my-requests"].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  const askContacts = React.useMemo(
    () =>
      (askContent as { askForHelpCard: { contacts: AskContact[] } })
        .askForHelpCard.contacts,
    []
  );

  const handleRequestHelpSend = React.useCallback(
    (payload: {
      shortDescription: string;
      requestDetails: string;
      requestCategory: string;
      askMode: "contact" | "circle" | "list";
      selectedContacts: AskContact[];
      endDateEnabled: boolean;
      endDate?: Date;
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
        endDate:
          payload.endDateEnabled && payload.endDate
            ? payload.endDate.toISOString()
            : undefined,
      };

      setMyRequestsData((prev) => [newRequest, ...prev]);
      setActiveTab("my-requests");
      const params = new URLSearchParams(window.location.search);
      params.set("tab", "my-requests");
      window.history.replaceState(null, "", `?${params.toString()}`);
    },
    []
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background w-full">
        <AppSidebar />
        <SidebarInset className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden">
          <div className="flex items-center gap-3 border-b bg-background px-4 py-3 lg:hidden">
            <SidebarTrigger className="border border-border" />
          </div>
          <div className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
            <div className="mx-auto w-full max-w-7xl">
              {/* Main Header */}
              <header className="mb-8 space-y-3">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-white hover:shadow-sm">
                    <a href="/trusted-list/">
                      <ChevronLeft className="h-6 w-6" />
                      <span className="sr-only">Back to Dashboard</span>
                    </a>
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Your Help Activity</h1>
                    <p className="text-muted-foreground">All the ways you help — and get help — in one place.</p>
                  </div>
                </div>
              </header>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 rounded-xl bg-muted/50 p-1">
                  <TabsTrigger value="in-progress" className="rounded-lg data-[state=active]:bg-white/70">In Progress</TabsTrigger>
                  <TabsTrigger value="helped" className="rounded-lg data-[state=active]:bg-white/70">Helped</TabsTrigger>
                  <TabsTrigger value="my-requests" className="rounded-lg data-[state=active]:bg-white/70">My Requests</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                  <TabsContent value="helped" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <FilterBar
                      layout={layout}
                      onLayoutChange={setLayout}
                      hideCompleted={hideCompleted}
                      onHideCompletedChange={setHideCompleted}
                      hideUnpromoted={hideUnpromoted}
                      onHideUnpromotedChange={setHideUnpromoted}
                      showCompletedFilter={false}
                      showUnpromotedFilter={false}
                      projection={{
                        label: "Karma earned",
                        value: `+${earnedKarma}`,
                        sublabel: "From people you helped",
                        tone: "success",
                      }}
                    />
                    <div className={layout === "grid" ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4"}>
                      {interactions.helped
                        .filter(card => !hideCompleted || card.status !== "Completed")
                        .map((card) => (
                          <MyRequestCard key={card.id} card={card} />
                        ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="in-progress" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <FilterBar
                      layout={layout}
                      onLayoutChange={setLayout}
                      hideCompleted={hideCompleted}
                      onHideCompletedChange={setHideCompleted}
                      hideUnpromoted={hideUnpromoted}
                      onHideUnpromotedChange={setHideUnpromoted}
                      showCompletedFilter={false}
                      showUnpromotedFilter={false}
                      projection={{
                        label: "Projected karma",
                        value: `+${projectedKarma}`,
                        sublabel: "If everything completes",
                        tone: "info",
                      }}
                    />
                    <div className={layout === "grid" ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4"}>
                      {interactions.inProgress
                        .filter(card => !hideCompleted || card.status !== "Completed")
                        .map((card) => (
                          <MyRequestCard key={card.id} card={card} />
                        ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="my-requests" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <FilterBar
                      layout={layout}
                      onLayoutChange={setLayout}
                      hideCompleted={hideCompleted}
                      onHideCompletedChange={setHideCompleted}
                      hideUnpromoted={hideUnpromoted}
                      onHideUnpromotedChange={setHideUnpromoted}
                      showUnpromotedFilter={true}
                      primaryAction={
                        <Button onClick={() => setAskDialogOpen(true)}>
                          <Hand className="mr-2 h-4 w-4" />
                          Ask for help
                        </Button>
                      }
                    />
                    <div className={layout === "grid" ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4"}>
                      {myRequestsData
                        .filter(request => {
                          const hasCompletedResponse = request.responses.some(r => r.status === "Completed");
                          if (hideCompleted && hasCompletedResponse && request.type === "contact") return false;
                          return true;
                        })
                        .map((request) => (
                          <MyHelpRequestCard
                            key={request.id}
                            request={request}
                            hideUnpromoted={hideUnpromoted}
                            onDelete={(id) =>
                              setMyRequestsData((prev) =>
                                prev.filter((item) => item.id !== id)
                              )
                            }
                          />
                        ))}
                    </div>
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
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
