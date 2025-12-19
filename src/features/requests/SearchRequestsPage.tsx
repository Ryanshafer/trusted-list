import React from "react";
import requestsData from "../../../data/requests.json";
import { AppSidebar } from "@/components/app-sidebar";
import { HelpRequestCard } from "@/features/dashboard/components/HelpRequestCards";
import type { CardData } from "@/features/dashboard/types";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LayoutGrid, List, HandHelping, MoreHorizontal, BellPlus, Flag, MessageCircle, Filter } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatDialog, type ChatMessage } from "@/features/dashboard/components/ChatDialog";
import { RemindDialog } from "@/features/dashboard/components/HelpRequestCards";
import { FlagRequestDialog } from "@/features/moderation/components/FlagRequestDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type RequestCard = CardData & { category: string };

const allRequests = requestsData as RequestCard[];

export default function SearchRequestsPage({ query: initialQuery }: { query?: string }) {
  const [ageFilter, setAgeFilter] = React.useState<string>("all");
  const [layout, setLayout] = React.useState<"grid" | "list">("grid");
  const [hiddenIds, setHiddenIds] = React.useState<Set<string>>(new Set());
  const [currentCard, setCurrentCard] = React.useState<RequestCard | null>(null);
  const [chatOpen, setChatOpen] = React.useState(false);
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);
  const [composer, setComposer] = React.useState("");
  const [flagOpen, setFlagOpen] = React.useState(false);
  const [remindOpen, setRemindOpen] = React.useState(false);
  const [remindOption, setRemindOption] = React.useState("3 days");
  const [reminderActive, setReminderActive] = React.useState(false);

  const [query, setQuery] = React.useState(initialQuery ?? "");
  React.useEffect(() => {
    if (initialQuery) return;
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const q = url.searchParams.get("q") || "";
    setQuery(q);
  }, [initialQuery]);

  const term = query.toLowerCase().trim();

  const filtered = React.useMemo(() => {
    return allRequests
      .filter((card) => {
        const haystack = `${card.name} ${card.subtitle ?? ""} ${card.requestSummary ?? ""} ${card.request}`.toLowerCase();
        return term ? haystack.includes(term) : true;
      })
      .filter((card) => !hiddenIds.has(card.id));
  }, [term, hiddenIds]);

  const formatEndDate = (dateString?: string | null) => {
    if (!dateString) return "No end date";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "No end date";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const prepareLead = (card: RequestCard) => {
    const summary = card.requestSummary?.trim() ?? "";
    const details = card.request.trim();
    return summary ? `${summary.replace(/[.!?]\\s*$/, "")}. ${details}` : details;
  };

  const handleClear = (id: string) => {
    setHiddenIds((prev) => new Set([...prev, id]));
  };

  const handleHelp = (card: RequestCard) => {
    setCurrentCard(card);
    setChatMessages([{ id: Date.now(), sender: "contact", text: prepareLead(card) }]);
    setChatOpen(true);
  };

  const handleRemind = (card: RequestCard) => {
    setCurrentCard(card);
    setRemindOpen(true);
  };

  const handleFlag = (card: RequestCard) => {
    setCurrentCard(card);
    setFlagOpen(true);
  };

  const ListRow = ({
    card,
    primaryLabel,
    onPrimary,
    onRemind,
    onCantHelp,
    onFlag,
    isLast,
  }: {
    card: CardData;
    primaryLabel: string;
    onPrimary: () => void;
    onRemind: () => void;
    onCantHelp: () => void;
    onFlag: () => void;
    isLast?: boolean;
  }) => {
    const [expanded, setExpanded] = React.useState(false);
    const initials = React.useMemo(
      () =>
        (card.name || "")
          .split(" ")
          .map((p) => p[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      [card.name],
    );

    return (
      <div className={`hidden lg:block ${isLast ? "" : "border-b border-border/60"} bg-muted/10`}>
        <div className={`grid grid-cols-12 gap-4 px-5 py-4 text-sm ${expanded ? "items-start" : "items-center"}`}>
          <div className="col-span-3 flex items-center gap-3 min-w-0">
            <Avatar className="h-10 w-10 border">
              {card.avatarUrl ? <AvatarImage src={card.avatarUrl} alt={card.name} /> : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold leading-tight truncate">{card.name}</span>
              <span className="text-xs text-muted-foreground leading-tight truncate">
                {card.subtitle || card.relationshipTag}
              </span>
            </div>
          </div>

          <div className="col-span-5 min-w-0">
            <div className="font-semibold leading-tight mb-1 truncate">
              {card.requestSummary || card.request}
            </div>
            <div className="text-sm text-muted-foreground leading-snug">
              {expanded ? (
                <>
                  {card.request}
                  <button
                    className="ml-1 text-primary hover:underline font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpanded(false);
                    }}
                  >
                    less
                  </button>
                </>
              ) : (
                <div className="flex">
                  <span className="truncate">{card.request}</span>
                  {card.request.length > 80 && (
                    <button
                      className="ml-1 whitespace-nowrap text-primary hover:underline font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(true);
                      }}
                    >
                      more
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-2 text-xs text-muted-foreground">
            <div className="truncate">{formatEndDate(card.endDate)}</div>
          </div>

          <div className="col-span-2 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={onPrimary}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              {primaryLabel}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={onRemind}>
                  <BellPlus className="mr-2 h-4 w-4" />
                  Remind me
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onCantHelp}>
                  I can't help with this request
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={onFlag}
                >
                  <Flag className="mr-2 h-4 w-4" />
                  Flag as inappropriate
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <SidebarInset className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden">
          <div className="flex items-center gap-3 border-b bg-background px-4 py-3 lg:hidden">
            <SidebarTrigger className="border border-border" />
          </div>
          <div className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
              <header className="space-y-1">
                <div className="flex items-center gap-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                  <a href="/trusted-list/requests" className="hover:underline">All Requests</a>
                  <span className="text-muted-foreground">/</span>
                  <span>{query || "Search"}</span>
                </div>
                <p className="text-muted-foreground text-base">Results for “{query || "All"}”.</p>
              </header>

              <section className="flex flex-col gap-4 rounded-xl border border-border/50 bg-muted/30 p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Select value={ageFilter} onValueChange={setAgeFilter}>
                      <SelectTrigger className="h-10 rounded-full border border-border bg-background px-4 shadow-sm flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <span className="text-sm">Filter</span>
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days">Days old</SelectItem>
                        <SelectItem value="weeks">Weeks old</SelectItem>
                        <SelectItem value="months">Months old</SelectItem>
                        <SelectItem value="all">All time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-muted/40 px-2 py-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-9 w-9 ${layout === "grid" ? "bg-background shadow-sm" : ""}`}
                      onClick={() => setLayout("grid")}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-9 w-9 ${layout === "list" ? "bg-background shadow-sm" : ""}`}
                      onClick={() => setLayout("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </section>

              <div className={layout === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
                {layout === "grid" ? (
                  filtered.map((card) => {
                    const firstName = card.name.split(" ")[0] ?? card.name;
                    return (
                      <div key={card.id} className="p-1">
                        <HelpRequestCard
                          {...card}
                          primaryCTA={`Help ${firstName}`}
                          onClear={() => handleClear(card.id)}
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className="hidden lg:block rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <div className="col-span-3">Requestor</div>
                      <div className="col-span-5">Request</div>
                      <div className="col-span-2">End Date</div>
                      <div className="col-span-2 text-right pr-2">Action</div>
                    </div>
                    {filtered.map((card, index) => {
                      const firstName = card.name.split(" ")[0] ?? card.name;
                      return (
                        <ListRow
                          key={card.id}
                          card={card}
                          primaryLabel={`Help ${firstName}`}
                          onPrimary={() => handleHelp(card)}
                          onRemind={() => handleRemind(card)}
                          onCantHelp={() => handleClear(card.id)}
                          onFlag={() => handleFlag(card)}
                          isLast={index === filtered.length - 1}
                        />
                      );
                    })}
                  </div>
                )}
                {filtered.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center text-sm text-muted-foreground">
                    No requests match this search yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
      <ChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        contactName={currentCard?.name || ""}
        messages={chatMessages}
        composer={composer}
        onComposerChange={setComposer}
        onSend={(msg) => {
          if (!msg.trim()) return;
          setChatMessages((prev) => [...prev, { id: Date.now(), sender: "user", text: msg }]);
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
        requestorName={currentCard?.name}
        requestorAvatarUrl={currentCard?.avatarUrl}
        requestSummary={currentCard?.requestSummary}
        requestText={currentCard?.request || ""}
        onSubmit={() => {
          if (currentCard) handleClear(currentCard.id);
        }}
      />
    </SidebarProvider>
  );
}
