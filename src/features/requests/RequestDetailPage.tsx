import React from "react";
import requestsData from "../../../data/requests.json";
import requestDetailsData from "../../../data/request-details.json";
import interactionsData from "../../../data/interactions.json";
import dashboardData from "../../../data/dashboard-content.json";
import profilesData from "../../../data/profiles.json";
import type { CardData } from "@/features/dashboard/types";
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
import { ConfettiBurst, RemindDialog } from "@/features/dashboard/components/HelpRequestCards";
import { FlagRequestDialog } from "@/features/moderation/components/FlagRequestDialog";
import { myHelpRequests, interactionChats } from "@/features/interactions/utils/data";
import { getInitials, formatEndDate } from "@/lib/utils";
import { HelpRequestDialog, REQUEST_CATEGORIES, type AskMode } from "@/features/requests/components/HelpRequestDialog";
import { ConnectionPath } from "@/features/requests/components/ConnectionPath";
import currentUser from "../../../data/current-user.json";
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

type RequestCard = CardData & { category: string };
type RequestDetail = {
  audience: string;
  audienceCategory: string;
  topics: string[];
  author: {
    role: string;
    company: string;
    connectionDegree: string;
    trustedFor: string;
  };
  connectionPath: Array<{
    type: "you" | "connector" | "requester";
    name?: string;
    role: string;
    avatarUrl?: string | null;
    relationship: string | null;
  }>;
  about: {
    career: string;
    location: string;
    trustedExpertise: string;
  };
  stats: {
    peopleHelped: number;
    requests: number;
    trustRating: string;
  };
};

function trustScoreToTier(score: number) {
  if (score < 150) return "Emerging";
  if (score < 650) return "Reliable";
  if (score < 900) return "Trustworthy";
  if (score < 990) return "Proven";
  return "Stellar";
}

const profileOwners = [currentUser as any, ...(profilesData as any[])];

const profileOpenRequests: RequestCard[] = profileOwners.flatMap((profile: any) =>
  (profile.openRequests ?? []).map((request: any) => ({
    id: request.requestId,
    variant: "circle",
    name: profile.name,
    requestSummary: request.title,
    request: request.description,
    relationshipTag: profile.id === currentUser.id ? "Your Request" : (profile.connectionDegree ?? "Connection"),
    primaryCTA: "View Details",
    avatarUrl: profile.avatarUrl ?? null,
    endDate: request.endDate ?? null,
    category: request.category ?? null,
  }))
);

// Flatten all card sources into one lookup
const allRequests: RequestCard[] = [
  ...(requestsData as RequestCard[]),
  ...[...(interactionsData as any).helped, ...(interactionsData as any).inProgress].map((r: any) => ({
    id: r.id,
    variant: r.variant ?? "circle",
    name: r.name,
    requestSummary: r.requestSummary,
    request: r.request,
    relationshipTag: r.relationshipTag ?? "Connection",
    primaryCTA: "Chat",
    avatarUrl: r.avatarUrl ?? null,
    endDate: r.endDate ?? null,
    category: r.category ?? null,
  })),
  ...profileOpenRequests,
].filter(
  (request, index, requests) => requests.findIndex((candidate) => candidate.id === request.id) === index
);

const synthesizedProfileDetails = Object.fromEntries(
  profileOwners.flatMap((profile: any) =>
    (profile.openRequests ?? []).map((request: any) => [
      request.requestId,
      {
        audience: profile.id === currentUser.id ? "My Circle" : "Circle",
        audienceCategory: request.category ?? "Other",
        topics: request.category ? [request.category] : [],
        author: {
          role: profile.title,
          company: profile.company,
          connectionDegree: profile.id === currentUser.id ? "You" : (profile.connectionDegree ?? "1st"),
          trustedFor: (profile.verifiedSkills ?? []).slice(0, 3).join(", "),
        },
        connectionPath: profile.connectionPath ?? [],
        about: {
          career: profile.about?.bio ?? "",
          location: profile.about?.location ?? "",
          trustedExpertise: (profile.verifiedSkills ?? []).join(", "),
        },
        stats: {
          peopleHelped: profile.peopleHelped ?? 0,
          requests: profile.totalRequests ?? (profile.openRequests?.length ?? 0),
          trustRating: profile.trustTier ?? trustScoreToTier(profile.trustScore ?? 0),
        },
      } satisfies RequestDetail,
    ])
  )
);

const allDetails = {
  ...synthesizedProfileDetails,
  ...(requestDetailsData as Record<string, RequestDetail>),
};
const askContacts = (dashboardData as any).askForHelpCard?.contacts ?? [];

const categoryDisplayNames: Record<string, string> = {
  career: "Career Development",
  design: "Design",
  product: "Product",
  business: "Business",
  health: "Wellness",
  education: "Education",
  tech: "Dev & Tools",
  network: "Networking",
  other: "Other",
};






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

  const resolveNode = (node: { type: string; name?: string; role: string; avatarUrl?: string | null; relationship?: string | null }) => {
    if (node.type === "you") return { ...node, name: currentUser.name, role: `${currentUser.title} · ${currentUser.company}`, avatarUrl: currentUser.avatarUrl };
    if (node.type === "requester") return { ...node, name: request.name, avatarUrl: request.avatarUrl ?? null };
    return { ...node, name: node.name ?? "", avatarUrl: node.avatarUrl ?? null };
  };

  const currentUserOpenRequest = (currentUser as any).openRequests?.find((r: { requestId: string }) => r.requestId === id) ?? null;
  const myHelpReq = myHelpRequests.find((r: any) => r.id === id) ?? null;
  const isOwnRequest = !!myHelpReq || !!currentUserOpenRequest;
  const resolvedAuthor = isOwnRequest
    ? { ...detail.author, name: currentUser.name, avatarUrl: currentUser.avatarUrl, role: `${currentUser.title} · ${currentUser.company}` }
    : { ...detail.author, name: request.name, avatarUrl: request.avatarUrl ?? null };
  const resolvedAbout = isOwnRequest
    ? {
        ...detail.about,
        career: currentUser.about?.bio ?? detail.about.career,
        location: currentUser.about?.location ?? detail.about.location,
        linkedInUrl: currentUser.about?.linkedInUrl ?? detail.about.linkedInUrl,
      }
    : detail.about;
  const resolvedStats = isOwnRequest
    ? {
        trustRating: trustScoreToTier(currentUser.trustScore),
        peopleHelped: currentUser.peopleHelped,
        requests: currentUser.totalRequests,
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
  const [remindOption, setRemindOption] = React.useState("3 days");
  const [reminderActive, setReminderActive] = React.useState(false);
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
    const isComplete = req.status === "Closed" || (req.type === "contact" && req.responses.some((r: any) => r.status === "Completed"));
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
      if ((resp as any).trustedFor) map[(resp as any).id] = (resp as any).trustedFor;
    }
    return map;
  }, [myHelpReq]);

  const multiContacts = React.useMemo(
    () =>
      myHelpReq?.responses.map((r: any) => ({
        id: r.id,
        name: r.name,
        role: r.role ?? "",
        trustedFor: rawResponses[r.id] ?? null,
        avatarUrl: r.avatarUrl ?? null,
        isCompleted: r.status === "Completed",
      })) ?? [],
    [myHelpReq, rawResponses]
  );
  const multiMessages = React.useMemo(() => {
    const result: Record<string, MultiChatMessage[]> = {};
    for (const r of myHelpReq?.responses ?? []) {
      const raw = interactionChats[r.chatId] ?? [];
      result[r.id] = raw
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
    for (const r of myHelpReq?.responses ?? []) {
      const entry = feedbackData[r.chatId];
      if (entry) result[r.id] = entry;
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }, [myHelpReq]);

  // Detect if the current user is actively helping this request (helper perspective)
  const inProgressCard = React.useMemo(
    () => (interactionsData as any).inProgress?.find((r: any) => r.id === id) ?? null,
    [id]
  );
  const isInProgress = !isOwnRequest && !!inProgressCard;

  const helpedCard = React.useMemo(
    () => (interactionsData as any).helped?.find((r: any) => r.id === id) ?? null,
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
                    {isOwnRequest ? localAudience : detail.audience} · {detail.audienceCategory}
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
                    trustedFor={isOwnRequest ? currentUser.verifiedSkills : resolvedAuthor.trustedFor}
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
                {detail.topics.map((topic: string) => (
                  <Badge key={topic} variant="secondary" className="rounded-full leading-4">
                    {topic}
                  </Badge>
                ))}
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
                      {reminderActive ? (
                        <Button
                          onClick={() => setReminderActive(false)}
                          variant="outline"
                          className="rounded-full h-10 font-semibold px-6 text-sm leading-none shadow-none border-lime-200 bg-lime-50 text-lime-700 hover:bg-amber-100 hover:text-amber-800 hover:border-amber-300 group/remind"
                          title="Cancel reminder"
                        >
                          <BellRing className="h-4 w-4 mr-2 mb-0.5 shrink-0 group-hover/remind:hidden" />
                          <X className="h-4 w-4 mr-2 mb-0.5 shrink-0 hidden group-hover/remind:block" />
                          Reminder: {remindOption}
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
                      ? currentUser.verifiedSkills
                      : resolvedAbout.trustedExpertise.split(",").map((s: string) => s.trim())
                    ).slice(0, 3).map((skill: string) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold text-muted-foreground bg-background border border-border leading-4"
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
              <div className="flex items-start justify-between font-sans">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xl text-foreground">{resolvedStats.trustRating}</span>
                  <span className="text-xs text-muted-foreground">Trust Rating</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xl text-foreground">{resolvedStats.peopleHelped}</span>
                  <span className="text-xs text-muted-foreground">Helped</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xl text-foreground">{resolvedStats.requests}</span>
                  <span className="text-xs text-muted-foreground">Requests</span>
                </div>
              </div>
            ) : (
              <div className="flex gap-7 font-sans">
                <div className="flex flex-col gap-0.5">
                  <span className="text-2xl text-foreground">{resolvedStats.trustRating}</span>
                  <span className="text-xs text-muted-foreground">Trust Rating</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-2xl text-foreground">{resolvedStats.peopleHelped}</span>
                  <span className="text-xs text-muted-foreground">People helped</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-2xl text-foreground">{resolvedStats.requests}</span>
                  <span className="text-xs text-muted-foreground">Requests</span>
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
