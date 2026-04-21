import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { UserIdentityLink } from "@/components/UserIdentityLink";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ChatMultiHelperModal, type Message as MultiChatMessage, type CompletionFeedback } from "@/features/dashboard/components/ChatMultiHelperModal";
import completionFeedbackData from "../../../data/interaction-completion-feedback.json";
import { ConfettiBurst } from "@/features/dashboard/components/HelpRequestCards";
import { SetReminderDialog, formatReminderTime } from "@/components/SetReminderDialog";
import { FlagRequestDialog } from "@/features/moderation/components/FlagRequestDialog";
import { interactions, myHelpRequests, interactionChats } from "@/features/interactions/utils/data";
import { formatEndDate } from "@/lib/utils";
import { HelpRequestDialog, REQUEST_CATEGORIES, type AskMode } from "@/features/requests/components/HelpRequestDialog";
import { ConnectionPath } from "@/features/requests/components/ConnectionPath";
import {
  BellPlus,
  BellRing,
  BriefcaseBusiness,
  ChevronDown,
  ChevronLeft,
  Clock,
  Copy,
  Flag,
  Globe,
  MapPin,
  MessagesSquare,
  MoreVertical,
  Share,
  ShieldCheck,
  SquarePen,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { TrustTierBadge } from "@/features/profile/components/TrustTierBadge";
import {
  allDetails,
  allRequests,
  askContacts,
  categoryDisplayNames,
  currentUserProfile,
  slugAlias,
  topicToCategorySlug,
  trustRatingToTierIndex,
  type RequestConnectionNode,
} from "@/features/requests/utils/request-detail-data";






export default function RequestDetailPage({ id }: { id: string }) {
  const request = allRequests.find((r) => r.id === id);
  const detail = allDetails[id];

  if (!request || !detail) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Request not found.
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const categoryLabel = request.category ? (categoryDisplayNames[request.category] ?? null) : null;
  const categoryHref = request.category ? `/trusted-list/requests/${request.category}` : null;
  const dueDate = formatEndDate(request.endDate, false);

  const resolveNode = (node: RequestConnectionNode) => {
    if (node.type === "you") {
      return {
        ...node,
        name: currentUserProfile.name,
        role: `${currentUserProfile.title} · ${currentUserProfile.company}`,
        avatarUrl: currentUserProfile.avatarUrl ?? null,
      };
    }
    if (node.type === "requester") {
      return { 
        ...node, 
        name: request.name, 
        role: detail.author.role, 
        avatarUrl: request.avatarUrl ?? null 
      };
    }
    return { ...node, name: node.name ?? "", avatarUrl: node.avatarUrl ?? null };
  };

  const currentUserOpenRequest =
    currentUserProfile.openRequests?.find((request) => request.requestId === id) ??
    null;
  const myHelpReq = myHelpRequests.find((request) => request.id === id) ?? null;
  const isOwnRequest = !!myHelpReq || !!currentUserOpenRequest;
  const resolvedAuthor = isOwnRequest
    ? { ...detail.author, name: currentUserProfile.name, avatarUrl: currentUserProfile.avatarUrl, role: `${currentUserProfile.title} · ${currentUserProfile.company}` }
    : { ...detail.author, name: request.name, avatarUrl: request.avatarUrl ?? null };
  const resolvedAbout = isOwnRequest
    ? {
        ...detail.about,
        career: currentUserProfile.about?.bio ?? detail.about.career,
        location: currentUserProfile.about?.location ?? detail.about.location,
      }
    : detail.about;
  const resolvedStats = isOwnRequest
    ? {
        trustRating: currentUserProfile.trustTier ?? detail.stats.trustRating,
        peopleHelped: currentUserProfile.peopleHelped ?? detail.stats.peopleHelped,
        requests: currentUserProfile.totalRequests ?? detail.stats.requests,
      }
    : detail.stats;

  const firstName = resolvedAuthor.name.split(" ")[0];

  const [chatOpen, setChatOpen] = React.useState(false);
  const chatInitialMessage = React.useMemo<MultiChatMessage[]>(() => {
    const summary = request.requestSummary?.trim() ?? "";
    const body = request.request.trim();
    const lead = summary ? `${summary.replace(/[.!?]\s*$/, "")}. ${body}` : body;
    return [{ id: String(Date.now()), sender: "incoming", text: lead, timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) }];
  }, [request.requestSummary, request.request]);
  const [celebrating, setCelebrating] = React.useState(false);
  const [remindOpen, setRemindOpen] = React.useState(false);
  const [reminderIso, setReminderIso] = React.useState<string | null>(null);
  const [flagOpen, setFlagOpen] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const copyTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Own-request specific state
  type RequestStatus = "active" | "paused" | "complete";
  const [isDeleted, setIsDeleted] = React.useState(false);
  const [requestStatus, setRequestStatus] = React.useState<RequestStatus>(() => {
    if (!isOwnRequest) return "active";
    if (!myHelpReq) return "active";
    const req = myHelpReq;
    const isComplete =
      req.status === "Closed" ||
      (req.type === "contact" &&
        req.responses.some((response) => response.status === "Completed"));
    if (isComplete) return "complete";
    const isPromotable = ["circle", "community"].includes(req.type);
    if (isPromotable && req.promoted === false) return "paused";
    return "active";
  });
  const [editOpen, setEditOpen] = React.useState(false);
  const [viewConvsOpen, setViewConvsOpen] = React.useState(false);
  const [localSummary, setLocalSummary] = React.useState(request.requestSummary ?? "");
  const [localRequest, setLocalRequest] = React.useState(request.request);

  const askModeToAudienceLabel: Record<AskMode, string> = {
    contact: "My Contact",
    circle: "My Circle",
    community: "The Trusted List",
  } as const;

  // Chat data for own requests
  const [localAudience, setLocalAudience] = React.useState<string>(
    askModeToAudienceLabel[myHelpReq?.type as AskMode ?? "circle"] ?? detail.audience
  );
  const hasChats = !!(myHelpReq && myHelpReq.responses.length > 0);
  const rawResponses = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const resp of myHelpReq?.responses ?? []) {
      if (resp.trustedFor) map[resp.id] = resp.trustedFor;
    }
    return map;
  }, [myHelpReq]);

  const multiContacts = React.useMemo(
    () =>
      myHelpReq?.responses.map((response) => ({
        id: response.id,
        name: response.name,
        role: response.role ?? "",
        trustedFor: rawResponses[response.id] ?? null,
        avatarUrl: response.avatarUrl ?? null,
        isCompleted: response.status === "Completed",
      })) ?? [],
    [myHelpReq, rawResponses]
  );
  const multiMessages = React.useMemo(() => {
    const result: Record<string, MultiChatMessage[]> = {};
    for (const response of myHelpReq?.responses ?? []) {
      const raw = interactionChats[response.chatId] ?? [];
      result[response.id] = raw
        .filter((m) => m.sender === "user" || m.sender === "contact")
        .map((m) => ({
          id: String(m.id),
          text: m.text,
          sender: m.sender === "user" ? ("outgoing" as const) : ("incoming" as const),
          timestamp: "",
        }));
    }
    return result;
  }, [myHelpReq]);

  const multiFeedback = React.useMemo(() => {
    const feedbackData = completionFeedbackData as Record<string, CompletionFeedback>;
    const result: Record<string, CompletionFeedback> = {};
    for (const response of myHelpReq?.responses ?? []) {
      const entry = feedbackData[response.chatId];
      if (entry) result[response.id] = entry;
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }, [myHelpReq]);

  // Detect if the current user is actively helping this request (helper perspective)
  const inProgressCard = React.useMemo(
    () => interactions.inProgress.find((request) => request.id === id) ?? null,
    [id]
  );
  const isInProgress = !isOwnRequest && !!inProgressCard;

  const helpedCard = React.useMemo(
    () => interactions.helped.find((request) => request.id === id) ?? null,
    [id]
  );
  const isHelped = !isOwnRequest && !!helpedCard;

  const [helperChatOpen, setHelperChatOpen] = React.useState(false);

  const helperChatMessages = React.useMemo((): MultiChatMessage[] => {
    if (!isInProgress && !isHelped) return [];
    const raw = interactionChats[id] ?? [];
    return raw
      .filter((m) => m.sender === "user" || m.sender === "contact")
      .map((m) => ({
        id: String(m.id),
        text: m.text,
        sender: m.sender === "user" ? ("outgoing" as const) : ("incoming" as const),
        timestamp: "",
      }));
  }, [id, isInProgress]);

  const helperChatFeedback = React.useMemo(() => {
    if (!isInProgress && !isHelped) return undefined;
    const entry = (completionFeedbackData as Record<string, CompletionFeedback>)[id];
    return entry ? { [id]: entry } : undefined;
  }, [id, isInProgress]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleDeleteRequest = () => {
    const prevStatus = requestStatus;
    setIsDeleted(true);
    toast("Request deleted", {
      description: localSummary || request.requestSummary,
      action: {
        label: "Undo",
        onClick: () => {
          setIsDeleted(false);
          setRequestStatus(prevStatus);
        },
      },
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
      copyTimeout.current = setTimeout(() => setCopied(false), 2500);
    });
  };

  const chatOpenTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const celebrationTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (chatOpenTimeout.current) clearTimeout(chatOpenTimeout.current);
      if (celebrationTimeout.current) clearTimeout(celebrationTimeout.current);
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
    };
  }, []);

  const handleHelpClick = () => {
    if (celebrating) return;
    setCelebrating(true);
    chatOpenTimeout.current = setTimeout(() => setChatOpen(true), 700);
    celebrationTimeout.current = setTimeout(() => setCelebrating(false), 1000);
  };

  return (
    <>
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col overflow-hidden">

        {/* ── Breadcrumb ─────────────────────────────────────────── */}
        <div className="bg-card border-b border-border shrink-0">
          <div className="flex items-center gap-4 px-10 py-5">
            <Button
              variant="secondary"
              size="icon"
              className="h-9 w-9 rounded-full shrink-0"
              onClick={() => window.history.back()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Breadcrumb>
              <BreadcrumbList className="text-lg gap-2.5 sm:gap-2.5">
                <BreadcrumbItem>
                  <BreadcrumbLink href="/trusted-list/requests">All Requests</BreadcrumbLink>
                </BreadcrumbItem>
                {categoryLabel && categoryHref && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink href={categoryHref}>{categoryLabel}</BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                )}
                <BreadcrumbSeparator />
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Main content */}
          <div className="flex-1 bg-card overflow-y-auto">
            <div className="flex flex-col gap-6 p-10">

              {/* Metadata row */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  {/* Audience badge */}
                  <Badge variant="outline" className="rounded-full gap-1 border-blue-200 bg-blue-50 text-blue-800 font-semibold leading-4">
                    <Globe className="h-3 w-3 text-blue-700 mb-0.5 shrink-0" />
                    {isOwnRequest ? localAudience : detail.audience}
                  </Badge>
                  {/* Due date */}
                  {dueDate && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground leading-none">
                      <Clock className="h-3 w-3 shrink-0 mb-0.5" />
                      <span>{dueDate}</span>
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="font-serif text-5xl font-light text-foreground leading-tight">
                  {isOwnRequest ? (localSummary || localRequest.slice(0, 60)) : (request.requestSummary ?? request.request.slice(0, 60))}
                </h1>
              </div>

              {/* Author card */}
              {(() => {
                const authorSlug = isOwnRequest ? "/trusted-list/profile" : `/trusted-list/members/${resolvedAuthor.name.toLowerCase().replace(/\s+/g, "-")}`;
                return (
                  <UserIdentityLink
                    avatarUrl={resolvedAuthor.avatarUrl}
                    name={resolvedAuthor.name}
                    connectionDegree={isOwnRequest || detail.author.connectionDegree !== "none" ? (isOwnRequest ? "You" : detail.author.connectionDegree) : undefined}
                    trustedFor={
                      isOwnRequest
                        ? (currentUserProfile.verifiedSkills ?? [])
                        : resolvedAuthor.trustedFor
                          ? [resolvedAuthor.trustedFor]
                          : undefined
                    }
                    href={authorSlug}
                    avatarSize="lg"
                    groupClass="group/member"
                  />
                );
              })()}

              {/* Body text */}
              <p className="font-sans text-xl leading-relaxed text-card-foreground whitespace-pre-wrap max-w-[65ch] mt-6">
                {isOwnRequest ? localRequest : request.request}
              </p>

              {/* Topics */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground tracking-widest uppercase">Topics</span>
                {detail.topics.map((topic: string) => {
                  const topicLower = topic.toLowerCase();
                  const categorySlug = topicToCategorySlug[topicLower] || topicLower;
                  return (
                    <a key={topic} href={`/trusted-list/requests/${categorySlug}`}>
                      <Badge variant="secondary" className="rounded-full leading-4 hover:bg-accent hover:text-accent-foreground transition-colors">
                        {topic}
                      </Badge>
                    </a>
                  );
                })}
              </div>

              {/* Actions bar */}
              <div className="flex items-center justify-between border-t border-border pt-4 mt-6">
                <div className="flex items-center gap-3">
                  {isOwnRequest ? (
                    <>
                      <Button
                        onClick={() => setViewConvsOpen(true)}
                        disabled={!hasChats || isDeleted}
                        className="rounded-full h-10 font-semibold px-6 text-sm leading-none bg-primary text-primary-foreground shadow-none"
                      >
                        <MessagesSquare className="h-4 w-4 mr-2 mb-0.5 shrink-0" />
                        View conversations
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditOpen(true)}
                        disabled={isDeleted || (myHelpReq?.responses.length ?? 0) > 0}
                        className="rounded-full h-10 font-semibold px-6 text-sm leading-none shadow-none"
                      >
                        <SquarePen className="h-4 w-4 mr-2 mb-0.5 shrink-0" />
                        Edit Request
                      </Button>
                    </>
                  ) : isInProgress || isHelped ? (
                    <Button
                      onClick={() => setHelperChatOpen(true)}
                      className="rounded-full h-10 font-semibold px-6 text-sm leading-none bg-primary text-primary-foreground shadow-none"
                    >
                      <MessagesSquare className="h-4 w-4 mr-2 mb-0.5 shrink-0" />
                      Chat
                    </Button>
                  ) : (
                    <>
                      <div className="relative">
                        <Button
                          onClick={handleHelpClick}
                          className="rounded-full h-10 font-semibold px-6 text-sm leading-none bg-primary text-primary-foreground relative z-10 shadow-none"
                        >
                          Help {firstName}
                        </Button>
                        {celebrating && <ConfettiBurst />}
                      </div>
                      {reminderIso ? (
                        <Button
                          onClick={() => setReminderIso(null)}
                          variant="outline"
                          className="rounded-full h-10 font-semibold px-6 text-sm leading-none shadow-none border-lime-200 bg-lime-50 text-lime-700 hover:bg-amber-100 hover:text-amber-800 hover:border-amber-300 group/remind"
                          title="Cancel reminder"
                        >
                          <BellRing className="h-4 w-4 mr-2 mb-0.5 shrink-0 group-hover/remind:hidden" />
                          <X className="h-4 w-4 mr-2 mb-0.5 shrink-0 hidden group-hover/remind:block" />
                          {formatReminderTime(reminderIso)}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setRemindOpen(true)}
                          variant="outline"
                          className="rounded-full h-10 font-semibold px-6 text-sm leading-none shadow-none"
                        >
                          <BellPlus className="h-4 w-4 mr-2 mb-0.5 shrink-0" />
                          Remind me
                        </Button>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Popover open={shareOpen} onOpenChange={setShareOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" disabled={isDeleted} className="rounded-full h-10 font-semibold px-6 text-sm leading-none">
                        <Share className="h-4 w-4 mr-2 mb-0.5 shrink-0" />
                        Share
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="end">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-end justify-between px-1 pt-1">
                          <p className="text-sm font-semibold text-popover-foreground leading-none">
                            Share this request
                          </p>
                          <p
                            className="text-sm leading-none transition-opacity duration-300"
                            style={{ color: "var(--success-600, #059669)", opacity: copied ? 1 : 0 }}
                          >
                            Copied!
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            readOnly
                            value={shareUrl}
                            className="h-8 w-[240px] text-sm text-popover-foreground bg-background shadow-none focus-visible:ring-0"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 shrink-0 rounded-full"
                            onClick={handleCopy}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isDeleted} className="rounded-full h-9 w-9">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isOwnRequest ? (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={handleDeleteRequest}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Request
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setFlagOpen(true)}
                        >
                          <Flag className="mr-2 h-4 w-4" />
                          Flag as inappropriate
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

            </div>
          </div>

          {/* Right sidebar */}
          <aside className="w-80 shrink-0 bg-background border-l border-border overflow-y-auto px-7 py-8 flex flex-col gap-7">

            {isOwnRequest ? (
              /* ── Own request sidebar ── */
              <>
                {/* Status dropdown */}
                <div className="flex flex-col gap-3.5">
                  <p className="text-xs text-muted-foreground tracking-widest uppercase">Your Request Status</p>
                  {isDeleted ? (
                    <p className="text-2xl font-normal text-destructive leading-8">Deleted</p>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-1.5 text-2xl font-normal text-foreground leading-8 hover:opacity-70 transition-opacity text-left">
                          <span className={`inline-flex items-center justify-center p-1 rounded-full shrink-0 ${requestStatus === "active" ? "bg-blue-400/20" : requestStatus === "paused" ? "bg-amber-400/20" : "bg-emerald-400/20"}`}>
                            <span className={`block h-3 w-3 rounded-full shrink-0 ${requestStatus === "active" ? "bg-blue-400" : requestStatus === "paused" ? "bg-amber-400" : "bg-emerald-400"}`} />
                          </span>
                          {requestStatus === "active" ? "Publicly Sharing" : requestStatus === "paused" ? "Sharing Paused" : "Complete"}
                          <ChevronDown className="h-5 w-5 shrink-0 text-foreground ml-0.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setRequestStatus("active")}>
                          Publicly Sharing
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRequestStatus("paused")}>
                          Sharing Paused
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRequestStatus("complete")}>
                          Complete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <Separator />
              </>
            ) : (
              /* ── Other user connection path ── */
              <>
                {(isInProgress || isHelped) && (
                  <>
                    <div className="flex flex-col gap-3.5">
                      <p className="text-xs text-muted-foreground tracking-widest uppercase">Request Status</p>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center justify-center p-1 rounded-full shrink-0 ${isHelped ? "bg-emerald-400/20" : "bg-blue-400/20"}`}>
                          <span className={`block h-3 w-3 rounded-full shrink-0 ${isHelped ? "bg-emerald-400" : "bg-blue-400"}`} />
                        </span>
                        <span className="text-2xl font-normal text-foreground leading-8">
                          {isHelped ? "Complete" : "In Progress"}
                        </span>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}
                <ConnectionPath
                  connectionPath={detail.connectionPath}
                  connectionDegree={detail.author.connectionDegree}
                  resolveNode={resolveNode}
                />
                <Separator />
              </>
            )}

            {/* About */}
            <div className="flex flex-col gap-3.5">
              <p className="text-xs text-muted-foreground tracking-widest uppercase">
                About {firstName}
              </p>
              <div className="flex flex-col gap-3.5">
                <div className="flex gap-3 items-start">
                  <BriefcaseBusiness className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">{resolvedAbout.career}</p>
                </div>
                <div className="flex gap-3 items-start">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">{resolvedAbout.location}</p>
                </div>
                <div className="flex gap-3 items-start">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    <span className="text-sm text-muted-foreground whitespace-nowrap leading-5">Trusted for:</span>
                    {(isOwnRequest
                      ? (currentUserProfile.verifiedSkills ?? [])
                      : resolvedAbout.trustedExpertise.split(",").map((skill) => skill.trim())
                    ).slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold text-muted-foreground bg-background border border-primary/50 leading-4"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Stats — own request: Trust Rating first, text-xl; other: peopleHelped first, text-2xl */}
            {isOwnRequest ? (
              <div className="flex flex-col gap-4 font-sans">
                <div className="w-full">
                  <TrustTierBadge
                    tierIndex={trustRatingToTierIndex(resolvedStats.trustRating)}
                    static={true}
                    className="w-full justify-center text-base inline-flex items-center"
                    iconClassName="h-5 w-5"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xl text-foreground">{resolvedStats.peopleHelped}</span>
                    <span className="text-xs text-muted-foreground">Helped</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xl text-foreground">{resolvedStats.requests}</span>
                    <span className="text-xs text-muted-foreground">Requests</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 font-sans">
                <div className="w-full border-b border-border pb-4">
                  <TrustTierBadge
                    tierIndex={trustRatingToTierIndex(resolvedStats.trustRating)}
                    static={true}
                    className="w-full justify-left text-3xl inline-flex items-center gap-1 text-foreground"
                    iconClassName="h-8 w-8"
                  />
                  <span className="text-xs text-muted-foreground">Trust Score</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-2xl text-foreground">{resolvedStats.peopleHelped}</span>
                    <span className="text-xs text-muted-foreground">People helped</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-2xl text-foreground">{resolvedStats.requests}</span>
                    <span className="text-xs text-muted-foreground">Requests made</span>
                  </div>
                </div>
              </div>
            )}

          </aside>
        </div>
      </SidebarInset>
    </SidebarProvider>

    <ChatMultiHelperModal
      open={chatOpen}
      onOpenChange={setChatOpen}
      title={request.requestSummary ?? request.request.slice(0, 60)}
      contacts={[{
        id,
        name: resolvedAuthor.name,
        role: detail.author.connectionDegree || "Connection",
        trustedFor: resolvedAuthor.trustedFor ?? null,
        avatarUrl: resolvedAuthor.avatarUrl ?? null,
      }]}
      messagesByContactId={{ [id]: chatInitialMessage }}
    />

    <SetReminderDialog
      open={remindOpen}
      onOpenChange={setRemindOpen}
      requesterName={resolvedAuthor.name}
      onConfirm={(iso) => setReminderIso(iso)}
    />

    <FlagRequestDialog
      open={flagOpen}
      onOpenChange={setFlagOpen}
      requestorName={resolvedAuthor.name}
      requestorAvatarUrl={resolvedAuthor.avatarUrl ?? undefined}
      requestSummary={request.requestSummary}
      requestText={request.request}
      onSubmit={() => setFlagOpen(false)}
    />

    {/* Edit Request dialog (own requests only) */}
    <HelpRequestDialog
      mode="edit"
      open={editOpen}
      onOpenChange={setEditOpen}
      categories={REQUEST_CATEGORIES}
      initialSummary={localSummary}
      initialDetails={localRequest}
      initialCategories={request.category ? [request.category] : []}
      contacts={askContacts}
      initialAskMode={myHelpReq?.type ?? "circle"}
      initialDueDate={request.endDate ? new Date(request.endDate) : undefined}
      onSubmit={(payload) => {
        setLocalSummary(payload.shortDescription);
        setLocalRequest(payload.requestDetails);
        setLocalAudience(askModeToAudienceLabel[payload.askMode]);
      }}
    />

    {/* View conversations modal (own requests only) */}
    {hasChats && (
      <ChatMultiHelperModal
        open={viewConvsOpen}
        onOpenChange={setViewConvsOpen}
        title={localSummary || localRequest.slice(0, 60)}
        contacts={multiContacts}
        messagesByContactId={multiMessages}
        completionFeedbackByContactId={multiFeedback}
      />
    )}

    {/* Chat modal (helper perspective — in progress or complete) */}
    {(isInProgress || isHelped) && (
      <ChatMultiHelperModal
        open={helperChatOpen}
        onOpenChange={setHelperChatOpen}
        title={request.requestSummary ?? request.request.slice(0, 60)}
        contacts={[{
          id,
          name: resolvedAuthor.name,
          role: detail.author.connectionDegree || "Connection",
          trustedFor: resolvedAuthor.trustedFor ?? null,
          avatarUrl: resolvedAuthor.avatarUrl ?? null,
          isCompleted: isHelped,
        }]}
        messagesByContactId={{ [id]: helperChatMessages }}
        completionFeedbackByContactId={helperChatFeedback}
      />
    )}
    </>
  );
}
