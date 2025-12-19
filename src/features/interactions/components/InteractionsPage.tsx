import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, MessageCircle, Edit, Trash2, MoreHorizontal, Flag, User, Users, Globe, Megaphone, MegaphoneOff, LayoutGrid, List, Eye, EyeOff, Sparkles, Hand, Clock, BellPlus, Check, Filter } from "lucide-react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { HelpRequestCard, formatEndDate, ConnectedCardHeader, type RelationshipType } from "@/features/dashboard/components/HelpRequestCards";
import { ChatDialog, type ChatMessage, type CompletionData } from "@/features/dashboard/components/ChatDialog";
import type { CardData } from "@/features/dashboard/types";
import { interactions, myHelpRequests, interactionChats, type HelperResponse, type MyHelpRequest } from "@/features/interactions/data";
import { FlagRequestDialog } from "@/features/moderation/components/FlagRequestDialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

// Simple date formatter for list views (just the date, no "Help needed" text)
const formatDateOnly = (endDate: string | null | undefined): string => {
  if (!endDate) return "No deadline";
  const date = new Date(endDate);
  if (isNaN(date.getTime())) return "No deadline";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

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

const HelperAvatar = ({
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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="relative cursor-pointer transition-transform hover:scale-105 hover:z-10 group/avatar"
              onClick={(e) => { e.stopPropagation(); setChatOpen(true); }}
            >
              <Avatar className="h-8 w-8 border-2 border-background ring-1 ring-border/10">
                {response.avatarUrl ? <AvatarImage src={response.avatarUrl} alt={response.name} className="object-cover" /> : null}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              {status === "Completed" && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 rounded-full p-[1px] border-2 border-background text-white shadow-sm">
                  <Check className="h-2 w-2 stroke-[3]" />
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Chat with {response.name}</p>
            <TooltipPrimitive.Arrow className="fill-primary" width={10} height={5} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

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
  onUpdate,
  layout = "grid",
}: {
  request: MyHelpRequest;
  hideUnpromoted?: boolean;
  onDelete?: (id: string) => void;
  onUpdate?: (updatedRequest: MyHelpRequest) => void;
  layout?: "grid" | "list";
}) => {
  const [currentRequest, setCurrentRequest] = React.useState(request);
  const [editOpen, setEditOpen] = React.useState(false);
  const [isPromotionActive, setIsPromotionActive] = React.useState(
    request.promoted ?? true
  );
  const [isRemoving, setIsRemoving] = React.useState(false);
  const [showAllResponses, setShowAllResponses] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  React.useEffect(() => {
    setCurrentRequest(request);
    setIsPromotionActive(request.promoted ?? true);
  }, [request]);

  const handleSaveEdit = (updates: Partial<CardData>) => {
    const updated = {
      ...currentRequest,
      requestSummary: updates.requestSummary || currentRequest.requestSummary,
      request: updates.request || currentRequest.request
    };
    setCurrentRequest(updated);
    onUpdate?.(updated);
  };

  const handleCompleteRequest = () => {
    const updated = {
      ...currentRequest,
      status: "Closed" as const,
      promoted: false
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
  const formattedEndDate = formatEndDate(currentRequest.endDate);
  const listViewDate = formatDateOnly(currentRequest.endDate);

  const getRequestTypeInfo = (type: MyHelpRequest["type"]) => {
    switch (type) {
      case "contact": return { label: "Contact", icon: User };
      case "circle": return { label: "Circle", icon: Users };
      case "list": return { label: "List", icon: Globe };
    }
  };

  const typeInfo = getRequestTypeInfo(currentRequest.type);
  const TypeIcon = typeInfo.icon;
  const isPromotable = ["circle", "list"].includes(currentRequest.type) && currentRequest.status !== "Closed";

  // Hide card if hideUnpromoted is true and promotion is stopped
  if (hideUnpromoted && !isPromotionActive && isPromotable) {
    return null;
  }

  // Calculate Status Label
  const isCompleted = currentRequest.status === "Closed" || (currentRequest.type === "contact" && currentRequest.responses.some(r => r.status === "Completed"));
  const isEditable = !isCompleted && (!isPromotable || !isPromotionActive);

  let statusLabel = "Active";
  let statusColor = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";

  if (isCompleted) {
    statusLabel = "Completed";
    statusColor = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  } else if (isPromotable && !isPromotionActive) {
    statusLabel = "Paused";
    statusColor = "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  }

  const RowView = (
    <div className={`hidden lg:grid grid-cols-12 gap-4 px-6 py-4 text-sm ${isExpanded ? "items-start" : "items-center"}`}>
      {/* Request: Col 4 */}
      <div className="col-span-4 min-w-0 pr-6">
        <div className={`font-semibold ${isExpanded ? "whitespace-normal" : "truncate"}`}>
          {currentRequest.requestSummary}
        </div>
        <div className="text-xs text-muted-foreground">
          {isExpanded ? (
            <>
              {currentRequest.request}
              <span
                className="text-primary hover:underline ml-1 cursor-pointer font-medium"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
              >
                less
              </span>
            </>
          ) : (
            <div className="flex">
              <span className="truncate">
                {currentRequest.request}
              </span>
              {currentRequest.request.length > 60 && (
                <span
                  className="text-primary hover:underline ml-1 cursor-pointer font-medium whitespace-nowrap"
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
                >
                  more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Type: Col 1 (Text Only, Shortened) */}
      <div className="col-span-1 flex items-center min-w-0">
        <span className="font-medium text-muted-foreground truncate">{typeInfo.label}</span>
      </div>

      {/* End Date: Col 1 */}
      <div className="col-span-1 text-xs text-muted-foreground min-w-0">
        <div className="flex items-center gap-1.5 truncate">
          <span>{listViewDate}</span>
        </div>
      </div>

      {/* Status: Col 1 */}
      <div className="col-span-1">
        <Badge variant="secondary" className={`text-[10px] h-5 px-1.5 font-normal ${statusColor}`}>
          {statusLabel}
        </Badge>
      </div>

      {/* Responses: Col 3 */}
      <div className={`col-span-3 flex pl-2 justify-start ${showAllResponses ? "flex-wrap gap-1 space-x-0" : "-space-x-2 overflow-hidden"}`}>
        {(showAllResponses ? currentRequest.responses : currentRequest.responses.slice(0, 7)).map(response => (
          <HelperAvatar
            key={response.id}
            response={response}
            requestSummary={currentRequest.requestSummary}
            requestDetails={currentRequest.request}
          />
        ))}

        {!showAllResponses && currentRequest.responses.length > 7 && (
          <button
            className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-[10px] font-medium border-2 border-background ring-2 ring-background hover:bg-muted/80 transition-colors z-10"
            onClick={(e) => { e.stopPropagation(); setShowAllResponses(true); }}
          >
            +{currentRequest.responses.length - 7}
          </button>
        )}

        {showAllResponses && currentRequest.responses.length > 7 && (
          <button
            className="text-[10px] text-primary hover:underline ml-2 self-center font-medium"
            onClick={(e) => { e.stopPropagation(); setShowAllResponses(false); }}
          >
            Show less
          </button>
        )}

        {currentRequest.responses.length === 0 && (
          <div className="h-8 w-8 rounded-full bg-muted/30 border-2 border-dashed border-muted-foreground/30" />
        )}
      </div>

      {/* Action & More: Col 2 */}
      <div className="col-span-2 flex justify-end items-center gap-1">
        {isPromotable ? (
          <Button
            variant={isPromotionActive ? "outline" : "secondary"}
            size="sm"
            className={`w-auto px-3 h-8 text-xs font-semibold gap-1.5 border shadow-sm ${!isPromotionActive ? "text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200" : "hover:bg-accent hover:text-accent-foreground"}`}
            onClick={togglePromotion}
          >
            {isPromotionActive ? (
              <>
                <MegaphoneOff className="h-3.5 w-3.5" /> Stop Promotion
              </>
            ) : (
              <>
                <Megaphone className="h-3.5 w-3.5" /> Resume Promotion
              </>
            )}
          </Button>
        ) : (
          <span className="w-auto"></span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0" onClick={e => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditOpen(true)} disabled={!isEditable}>
              <Edit className="mr-2 h-4 w-4" /> Edit Request
            </DropdownMenuItem>
            {!isCompleted && (
              <DropdownMenuItem onClick={handleCompleteRequest}>
                <Check className="mr-2 h-4 w-4" /> Complete request
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="text-destructive" onClick={() => { setIsRemoving(true); setTimeout(() => onDelete?.(currentRequest.id), 180); }}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete Request
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div
      className={`transition-all duration-200 ease-in-out relative h-full ${isRemoving ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
        } ${layout === "list" ? "lg:border-b lg:border-border/50 lg:last:border-0" : ""}`}
    >
      <div className={layout === "list" ? "lg:hidden h-full" : "h-full"}>
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
                {isCompleted && (
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
                      {formattedEndDate}
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
                      onClick={() => setEditOpen(true)}
                      disabled={!isEditable}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit request
                    </DropdownMenuItem>
                    {!isCompleted && (
                      <DropdownMenuItem onClick={handleCompleteRequest}>
                        <Check className="mr-2 h-4 w-4" /> Complete request
                      </DropdownMenuItem>
                    )}
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
                    disabled={!isEditable}
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
        </Card>
      </div>

      {layout === "list" && RowView}

      <EditRequestDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        card={cardDataForEdit}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

const MyRequestCard = ({
  card,
  layout = "grid",
  onDismiss,
  onFlagged,
  menuContext = "in-progress",
}: {
  card: CardData & { status?: string; statusDate?: string };
  layout?: "grid" | "list";
  onDismiss?: (id: string) => void;
  onFlagged?: (id: string) => void;
  menuContext?: "helped" | "in-progress";
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [badgePosition, setBadgePosition] = React.useState({ top: 88 });
  const [status, setStatus] = React.useState(card.status);
  const [currentCard, setCurrentCard] = React.useState(card);
  const [editOpen, setEditOpen] = React.useState(false);

  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isDismissing, setIsDismissing] = React.useState(false);
  const [flagOpen, setFlagOpen] = React.useState(false);

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

    const requestPreview = containerRef.current.querySelector('.group.relative.cursor-pointer');
    if (requestPreview) {
      const rect = requestPreview.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const topOffset = rect.top - containerRect.top;
      setBadgePosition({ top: topOffset - 8 });
    }
  }, []);

  const isMyRequest = card.id.startsWith("request-");
  const isCompleted = status === "Completed";

  let relationshipType: RelationshipType = "through-contact";
  let connectionLabel = "Connected";

  if (currentCard.variant === "circle") {
    relationshipType = "direct";
    connectionLabel = "Directly Connected";
  } else if (currentCard.variant === "network") {
    relationshipType = "through-contact";
    connectionLabel = currentCard.connectedBy ? `Connected by ${currentCard.connectedBy}` : "Connected by your network";
  } else if (currentCard.variant === "opportunities") {
    relationshipType = "skills-match";
    connectionLabel = currentCard.relationshipTag || "Skill-aligned opportunity";
  }

  const initials = currentCard.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      ref={containerRef}
      className={`relative h-full transition-all duration-300 ease-in-out ${
        isDismissing ? "translate-y-2 scale-[0.98] opacity-0 pointer-events-none" : "opacity-100"
      } ${layout === "list" ? "lg:border-b lg:border-border/50 lg:last:border-0" : ""}`}
    >
      <div className={layout === "list" ? "lg:hidden h-full" : "h-full"}>
        <Card className="relative flex h-full flex-col rounded-3xl border border-border bg-card shadow-sm">
          <CardHeader className="p-0 px-5">
            <ConnectedCardHeader
              name={currentCard.name}
              avatarUrl={currentCard.avatarUrl}
              relationshipType={relationshipType}
              relationshipLabel={connectionLabel}
              onDismiss={onDismiss ? () => handleCantHelp() : undefined}
              onFlag={() => setFlagOpen(true)}
            />
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-2 p-5 pt-0">

            {/* Request Preview */}
            <div className="flex flex-1 flex-col gap-2">
              <div
                className="bg-muted/40 p-4 rounded-md cursor-pointer hover:bg-muted/60 transition-colors group/bubble relative mt-2 space-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => setChatOpen(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setChatOpen(true);
                  }
                }}
              >
                {currentCard.requestSummary ? (
                  <p className="font-bold text-foreground leading-relaxed mb-0.5">
                    {currentCard.requestSummary}
                  </p>
                ) : null}

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{formatEndDate(currentCard.endDate)}</span>
                </div>

                <p className="text-sm text-foreground leading-relaxed">
                  {currentCard.request.length > 80 ? (
                    <>
                      {currentCard.request.slice(0, 80).trim()}
                      <span className="text-muted-foreground">... </span>
                      <span className="text-muted-foreground font-medium">more</span>
                    </>
                  ) : (
                    currentCard.request
                  )}
                </p>

                {/* Overlay for View Details */}
                <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/60 backdrop-blur-[1px] opacity-0 transition-opacity duration-200 group-hover/bubble:opacity-100">
                  <div className="inline-flex h-8 items-center justify-center rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground shadow-sm">
                    Read details
                  </div>
                </div>
              </div>
              <div className="flex-1" />

              {/* Primary Action */}
              <div className="mt-3 flex">
                <Button
                  variant="outline"
                  className="w-full gap-1 font-semibold border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={() => setChatOpen(true)}
                >
                  <MessageCircle className="mr-1 h-4 w-4" />
                  {isCompleted ? "Read chat history" : "Chat"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {layout === "list" && (
        <div className={`hidden lg:grid grid-cols-12 gap-4 px-6 py-4 text-sm ${isExpanded ? "items-start" : "items-center"}`}>
          {/* User: Col 3 (Avatar + Name) */}
          <div className="col-span-3 flex items-center gap-3 min-w-0">
            <Avatar className="h-9 w-9 border shrink-0">
              {currentCard.avatarUrl ? <AvatarImage src={currentCard.avatarUrl} /> : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="font-medium truncate leading-tight">{currentCard.name}</span>
              <span className="text-[11px] text-muted-foreground truncate leading-tight">{connectionLabel}</span>
            </div>
          </div>

          {/* Request: Col 5 (Expanded) */}
          <div className="col-span-5 min-w-0 pr-6">
            <div className={`font-semibold leading-tight mb-0.5 group-hover:text-primary transition-colors ${isExpanded ? "whitespace-normal" : "truncate"}`}>
              {currentCard.requestSummary}
            </div>
            <div className="text-xs text-muted-foreground">
              {isExpanded ? (
                <>
                  {currentCard.request}
                  <span
                    className="text-primary hover:underline ml-1 cursor-pointer font-medium"
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                  >
                    less
                  </span>
                </>
              ) : (
                <div className="flex">
                  <span className="truncate">
                    {currentCard.request}
                  </span>
                  {currentCard.request.length > 60 && (
                    <span
                      className="text-primary hover:underline ml-1 cursor-pointer font-medium whitespace-nowrap"
                      onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
                    >
                      more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* End Date: Col 2 */}
          <div className="col-span-2 text-xs text-muted-foreground flex items-center gap-1.5 min-w-0">
            {formatDateOnly(currentCard.endDate)}
          </div>

          {/* Action & More: Col 2 */}
          <div className="col-span-2 flex justify-end items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="w-auto px-3 h-8 text-xs font-semibold gap-1.5 border shadow-sm hover:bg-accent hover:text-accent-foreground"
              onClick={(e) => { e.stopPropagation(); setChatOpen(true); }}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {isCompleted ? "Read chat history" : "Chat"}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
	            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {menuContext !== "helped" && onDismiss ? (
                <DropdownMenuItem onClick={handleCantHelp}>
                  <EyeOff className="mr-2 h-4 w-4" />
                  I can't help with this request
                </DropdownMenuItem>
              ) : null}
              {menuContext !== "helped" ? (
                <DropdownMenuItem>
                  <BellPlus className="mr-2 h-4 w-4" /> Set Reminder
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setFlagOpen(true);
                }}
              >
                <Flag className="mr-2 h-4 w-4" />
                Flag as inappropriate
              </DropdownMenuItem>
            </DropdownMenuContent>
	            </DropdownMenu>
	          </div>
	        </div>
	      )}

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

      <FlagRequestDialog
        open={flagOpen}
        onOpenChange={setFlagOpen}
        requestorName={currentCard.name}
        requestorAvatarUrl={currentCard.avatarUrl || undefined}
        requestSummary={currentCard.requestSummary}
        requestText={currentCard.request}
        onSubmit={() => onFlagged?.(card.id)}
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
  filters = {},
  onFilterChange,
  availableFilters = {},
  onResetFilters,
  showFilter = true,
  projection,
  primaryAction,
}: {
  layout: "grid" | "list";
  onLayoutChange: (layout: "grid" | "list") => void;
  filters?: Record<string, boolean>;
  onFilterChange?: (key: string, value: boolean) => void;
  availableFilters?: Record<string, boolean>;
  onResetFilters?: () => void;
  showFilter?: boolean;
  projection?: {
    label: string;
    value: string;
    sublabel?: string;
    tone?: "success" | "info";
  };
  primaryAction?: React.ReactNode;
}) => {
  const isFiltered = Object.values(filters).some(Boolean);

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
          {primaryAction}
        </div>
        <div className="flex items-center gap-2">
          {showFilter && onFilterChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={isFiltered ? "secondary" : "outline"}
                  size="sm"
                  className={`h-9 gap-2 ${isFiltered ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90" : "bg-background"}`}
                >
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Hide requests</span>
                  {isFiltered && onResetFilters && (
                    <span
                      className="text-xs font-normal text-muted-foreground hover:text-primary cursor-pointer px-1"
                      onClick={(e) => {
                        e.preventDefault();
                        onResetFilters();
                      }}
                    >
                      Reset
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(filters).map(([key, value]) => {
                  let label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                  if (key === 'hideUnpromoted') label = 'Unpromoted'; // Adjust labels as needed
                  if (key === 'hideActive') label = 'Active';
                  if (key === 'hideCompleted') label = 'Completed';
                  if (key === 'hidePaused') label = 'Paused'; // Map 'Unpromoted' to 'Paused' if preferred label
                  if (key === 'hideContact') label = 'Contact';
                  if (key === 'hideCircle') label = 'Circle';
                  if (key === 'hideList') label = 'List';

                  const isDisabled = !value && !availableFilters[key];

                  return (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={value}
                      onCheckedChange={(checked) => onFilterChange(key, checked)}
                      disabled={isDisabled}
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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

  // Set default layout based on active tab
  React.useEffect(() => {
    if (activeTab === "in-progress") {
      setLayout("grid");
    } else if (activeTab === "helped" || activeTab === "my-requests") {
      setLayout("list");
    }
  }, [activeTab]);

  // Filter states
  const [filters, setFilters] = React.useState({
    hideCompleted: false,
    hideUnpromoted: false, // Paused
    hideActive: false,
    hideContact: false,
    hideCircle: false,
    hideList: false,
  });

  const handleFilterChange = (key: string, value: boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      hideCompleted: false,
      hideUnpromoted: false,
      hideActive: false,
      hideContact: false,
      hideCircle: false,
      hideList: false,
    });
  };

  const [askDialogOpen, setAskDialogOpen] = React.useState(false);
  const [myRequestsData, setMyRequestsData] = React.useState(myHelpRequests);
  const [helpedCards, setHelpedCards] = React.useState(interactions.helped);
  const [inProgressCards, setInProgressCards] = React.useState(interactions.inProgress);

  const defaultKarma = helpedCards[0]?.karma ?? 50;
  const earnedKarma = helpedCards.reduce(
    (sum, card) => sum + (card.karma ?? defaultKarma),
    0
  );
  const projectedKarma = inProgressCards.length * defaultKarma;


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

  const filteredRequests = React.useMemo(() => {
    return myRequestsData
      .filter(request => {
        const isCompleted = request.status === "Closed" || (request.type === "contact" && request.responses.some(r => r.status === "Completed"));
        const isPromotable = ["circle", "list"].includes(request.type) && request.status !== "Closed";
        const isPaused = isPromotable && request.promoted === false;
        const isActive = isPromotable && (request.promoted ?? true);

        if (filters.hideCompleted && isCompleted) return false;
        if (filters.hideUnpromoted && isPaused) return false;
        if (filters.hideActive && isActive) return false;
        if (filters.hideContact && request.type === "contact") return false;
        if (filters.hideCircle && request.type === "circle") return false;
        if (filters.hideList && request.type === "list") return false;

        return true;
      })
      .sort((a, b) => {
        const aIsCompleted = a.status === "Closed" || (a.type === "contact" && a.responses.some(r => r.status === "Completed"));
        const bIsCompleted = b.status === "Closed" || (b.type === "contact" && b.responses.some(r => r.status === "Completed"));

        // Closed requests go to the end
        if (aIsCompleted && !bIsCompleted) return 1;
        if (!aIsCompleted && bIsCompleted) return -1;

        // Both are open or both are closed
        const aHasDeadline = !!a.endDate;
        const bHasDeadline = !!b.endDate;

        // Within the same status group, requests with deadlines come before those without
        if (aHasDeadline && !bHasDeadline) return -1;
        if (!aHasDeadline && bHasDeadline) return 1;

        // Both have deadlines or both don't have deadlines
        if (aHasDeadline && bHasDeadline) {
          // Sort by deadline (soonest first)
          return new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime();
        }

        // Both don't have deadlines - maintain original order
        return 0;
      });
  }, [myRequestsData, filters]);

  const availableFilters = React.useMemo(() => {
    const counts = {
      hideCompleted: false,
      hideUnpromoted: false,
      hideActive: false,
      hideContact: false,
      hideCircle: false,
      hideList: false,
    };

    filteredRequests.forEach(request => {
      const isCompleted = request.status === "Closed" || (request.type === "contact" && request.responses.some(r => r.status === "Completed"));
      const isPromotable = ["circle", "list"].includes(request.type) && request.status !== "Closed";
      const isPaused = isPromotable && request.promoted === false;
      const isActive = isPromotable && (request.promoted ?? true);

      if (isCompleted) counts.hideCompleted = true;
      if (isPaused) counts.hideUnpromoted = true;
      if (isActive) counts.hideActive = true;
      if (request.type === "contact") counts.hideContact = true;
      if (request.type === "circle") counts.hideCircle = true;
      if (request.type === "list") counts.hideList = true;
    });

    return counts;
  }, [filteredRequests]);

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
                      showFilter={false}
                      projection={{
                        label: "Karma earned",
                        value: `+${earnedKarma}`,
                        sublabel: "From people you helped",
                        tone: "success",
                      }}
                    />
                    {layout === "list" && (
                      <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        <div className="col-span-3">Requestor</div>
                        <div className="col-span-5">Request</div>
                        <div className="col-span-2">End Date</div>
                        <div className="col-span-2 text-right pr-2">Action</div>
                      </div>
                    )}
                    <div className={layout === "grid" ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4 lg:gap-0 lg:border lg:rounded-xl lg:bg-muted/10 lg:overflow-hidden lg:shadow-sm"}>
                      {helpedCards
                        .filter(card => !filters.hideCompleted || card.status !== "Completed")
                        .sort((a, b) => {
                          // Sort by end date (most recent first)
                          if (!a.endDate && !b.endDate) return 0;
                          if (!a.endDate) return 1;
                          if (!b.endDate) return -1;
                          return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
                        })
                        .map((card) => (
                          <MyRequestCard
                            key={card.id}
                            card={card}
                            layout={layout}
                            menuContext="helped"
                            onFlagged={(id) =>
                              setHelpedCards((prev) =>
                                prev.filter((item) => item.id !== id)
                              )
                            }
                          />
                        ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="in-progress" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <FilterBar
                      layout={layout}
                      onLayoutChange={setLayout}
                      showFilter={false}
                      projection={{
                        label: "Projected karma",
                        value: `+${projectedKarma}`,
                        sublabel: "If everything completes",
                        tone: "info",
                      }}
                    />
                    {layout === "list" && (
                      <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        <div className="col-span-3">Requestor</div>
                        <div className="col-span-5">Request</div>
                        <div className="col-span-2">End Date</div>
                        <div className="col-span-2 text-right pr-2">Action</div>
                      </div>
                    )}
                    <div className={layout === "grid" ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4 lg:gap-0 lg:border lg:rounded-xl lg:bg-muted/10 lg:overflow-hidden lg:shadow-sm"}>
                      {inProgressCards
                        .filter(card => !filters.hideCompleted || card.status !== "Completed")
                        .sort((a, b) => {
                          // Requests with deadlines come first, sorted by soonest ending
                          const aHasDeadline = !!a.endDate;
                          const bHasDeadline = !!b.endDate;

                          if (aHasDeadline && !bHasDeadline) return -1;
                          if (!aHasDeadline && bHasDeadline) return 1;

                          if (aHasDeadline && bHasDeadline) {
                            return new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime();
                          }

                          return 0;
                        })
                        .map((card) => (
                          <MyRequestCard
                            key={card.id}
                            card={card}
                            layout={layout}
                            menuContext="in-progress"
                            onDismiss={(id) =>
                              setInProgressCards((prev) =>
                                prev.filter((item) => item.id !== id)
                              )
                            }
                            onFlagged={(id) =>
                              setInProgressCards((prev) =>
                                prev.filter((item) => item.id !== id)
                              )
                            }
                          />
                        ))}

                      {inProgressCards.filter(card => !filters.hideCompleted || card.status !== "Completed").length === 0 && (
                        <div className={`flex h-full min-h-[380px] w-full items-center justify-center rounded-3xl border border-primary/30 bg-primary/10 p-8 text-center ${layout === "grid" ? "md:col-span-2 lg:col-span-3" : ""}`}>
                          <div className="flex flex-col items-center justify-center gap-3 max-w-md">
                            <div className="space-y-2">
                              <p className="text-sm font-semibold text-primary">Community spotlight</p>
                              <h3 className="text-xl font-bold text-foreground">Looking for people to help?</h3>
                              <p className="text-sm text-muted-foreground">
                                Browse every open request across the Trusted List and jump into the ones that fit you best.
                              </p>
                            </div>
                            <div className="mt-2">
                              <Button asChild>
                                <a href="/trusted-list/requests">Explore all open requests</a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="my-requests" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <FilterBar
                      layout={layout}
                      onLayoutChange={setLayout}
                      filters={filters}
                      onFilterChange={handleFilterChange}
                      availableFilters={availableFilters}
                      onResetFilters={handleResetFilters}
                      primaryAction={
                        <Button onClick={() => setAskDialogOpen(true)}>
                          <Hand className="mr-2 h-4 w-4" />
                          Ask for help
                        </Button>
                      }
                    />
                    {layout === "list" && (
                      <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        <div className="col-span-4">Request</div>
                        <div className="col-span-1">Connection</div>
                        <div className="col-span-1">End Date</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-3">Responses</div>
                        <div className="col-span-2 text-right pr-2">Action</div>
                      </div>
                    )}
                    <div className={layout === "grid" ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4 lg:gap-0 lg:border lg:rounded-xl lg:bg-muted/10 lg:overflow-hidden lg:shadow-sm"}>
                      {filteredRequests
                        .map((request) => (
                          <MyHelpRequestCard
                            key={request.id}
                            request={request}
                            hideUnpromoted={filters.hideUnpromoted} /* Prop might be deprecated in card but keeping for compatibility? */
                            onDelete={(id) =>
                              setMyRequestsData((prev) =>
                                prev.filter((item) => item.id !== id)
                              )
                            }
                            onUpdate={(updated) =>
                              setMyRequestsData((prev) =>
                                prev.map(item => item.id === updated.id ? updated : item)
                              )
                            }
                            layout={layout}
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
