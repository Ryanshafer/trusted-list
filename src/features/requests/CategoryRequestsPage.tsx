import React from "react";
import requestsData from "../../../data/requests.json";
import categoriesData from "../../../data/categories.json";
import { AppSidebar } from "@/components/app-sidebar";
import { IncomingRequestCard } from "@/features/dashboard/components/HelpRequestCards";
import type { CardData } from "@/features/dashboard/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AudienceBadge, cardVariantToAudienceKey } from "@/components/AudienceBadge";
import { MoreHorizontal, BellPlus, Bell, Flag, Search, SlidersHorizontal, X, ArrowUp, ArrowDown, ArrowUpDown, EyeOff, MessagesSquare, ListFilter } from "lucide-react";
import { FilterSidebar } from "@/components/FilterSidebar";
import { LayoutToggle } from "@/components/LayoutToggle";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserIdentityLink } from "@/components/UserIdentityLink";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatDialog, type ChatMessage } from "@/features/dashboard/components/ChatDialog";
import { SetReminderDialog, formatReminderTime } from "@/components/SetReminderDialog";
import { FlagRequestDialog } from "@/features/moderation/components/FlagRequestDialog";
import { formatEndDate } from "@/lib/utils";

type RequestCard = CardData & { category: string };

const allRequests = requestsData as RequestCard[];

// Generate category options and slug aliases from centralized data
const categoryOptions = categoriesData.categories.flatMap((category) => {
  const mainOption = { value: category.slug, label: category.displayName };
  const aliasOptions = category.aliases
    .filter(alias => alias.includes('-')) // Only include slug-style aliases
    .map(alias => ({ value: alias, label: category.displayName }));
  return [mainOption, ...aliasOptions];
});

const slugAlias: Record<string, string> = {};
categoriesData.categories.forEach((category) => {
  category.aliases.forEach((alias) => {
    if (alias.includes('-')) {
      slugAlias[alias] = category.slug;
    }
  });
});

const buildCategoryRequests = (slug: string): RequestCard[] => {
  const target = slugAlias[slug] ?? slug;
  return allRequests.filter((card) => card.category?.toLowerCase() === target);
};

type CategoryFilters = {
  dateFrom: string;
  dateTo: string;
  audiences: string[];
};

const defaultFilters: CategoryFilters = { dateFrom: "", dateTo: "", audiences: [] };

const variantToAudienceKey = (variant: string) => {
  if (variant === "contact") return "contact";
  if (variant === "community") return "community";
  return "circle";
};

type CategorySortKey = "name" | "request" | "endDate" | "audience" | "topic";

const sortCards = (cards: RequestCard[], key: CategorySortKey | null, dir: "asc" | "desc") => {
  if (!key) return cards;
  const d = dir === "asc" ? 1 : -1;
  return [...cards].sort((a, b) => {
    switch (key) {
      case "name": return d * (a.name ?? "").localeCompare(b.name ?? "");
      case "request": return d * (a.requestSummary ?? "").localeCompare(b.requestSummary ?? "");
      case "endDate": {
        if (!a.endDate && !b.endDate) return 0;
        if (!a.endDate) return d;
        if (!b.endDate) return -d;
        return d * (new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
      }
      case "audience": return d * variantToAudienceKey(a.variant).localeCompare(variantToAudienceKey(b.variant));
      case "topic": return d * (a.category ?? "").localeCompare(b.category ?? "");
      default: return 0;
    }
  });
};

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
        const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
        return (
          <TableHead key={key} className={className ?? ""}>
            <button onClick={() => onSort(key)} className="group/th flex items-center gap-1 hover:text-foreground transition-colors">
              {label}
              <Icon className={`h-3 w-3 shrink-0 transition-opacity ${active ? "opacity-100 text-foreground" : "opacity-0 group-hover/th:opacity-40"}`} />
            </button>
          </TableHead>
        );
      })}
      <TableHead className={actionsClassName}>Actions</TableHead>
    </TableRow>
  </TableHeader>
);


export default function CategoryRequestsPage({ slug }: { slug: string }) {
  const categoryLabel = categoryOptions.find((opt) => opt.value === slug)?.label || "Requests";
  const [filters, setFilters] = React.useState<CategoryFilters>(defaultFilters);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [layout, setLayout] = React.useState<"grid" | "list">("grid");
  const [search, setSearch] = React.useState("");
  const [hiddenIds, setHiddenIds] = React.useState<Set<string>>(new Set());
  const [currentCard, setCurrentCard] = React.useState<RequestCard | null>(null);
  const [chatOpen, setChatOpen] = React.useState(false);
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);
  const [composer, setComposer] = React.useState("");
  const [flagOpen, setFlagOpen] = React.useState(false);
  const [remindOpen, setRemindOpen] = React.useState(false);
  const [cardReminders, setCardReminders] = React.useState<Record<string, string>>({});

  const baseRequests = React.useMemo(() => buildCategoryRequests(slug), [slug]);

  const availableAudiences = React.useMemo(() => {
    let contact = false, circle = false, community = false;
    for (const card of baseRequests) {
      const key = variantToAudienceKey(card.variant);
      if (key === "contact") contact = true;
      if (key === "circle") circle = true;
      if (key === "community") community = true;
    }
    return { contact, circle, community };
  }, [baseRequests]);

  const activeFilterCount =
    filters.audiences.length + (filters.dateFrom ? 1 : 0) + (filters.dateTo ? 1 : 0);

  const filtered = React.useMemo(() => {
    const term = search.toLowerCase().trim();
    const fromTime = filters.dateFrom ? new Date(filters.dateFrom).getTime() : null;
    const toTime = filters.dateTo ? new Date(filters.dateTo).getTime() : null;
    return baseRequests
      .filter((card) => !hiddenIds.has(card.id))
      .filter((card) => {
        if (filters.audiences.length > 0 && !filters.audiences.includes(variantToAudienceKey(card.variant))) return false;
        if (fromTime && card.endDate && new Date(card.endDate).getTime() < fromTime) return false;
        if (toTime && card.endDate && new Date(card.endDate).getTime() > toTime) return false;
        if (term) {
          const haystack = `${card.name} ${card.subtitle ?? ""} ${card.requestSummary ?? ""} ${card.request}`.toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        return true;
      });
  }, [baseRequests, filters, hiddenIds, search]);

  const [sortKey, setSortKey] = React.useState<CategorySortKey | null>("endDate");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const handleSort = (key: string) => {
    const k = key as CategorySortKey;
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  };
  const sortedFiltered = React.useMemo(() => sortCards(filtered, sortKey, sortDir), [filtered, sortKey, sortDir]);

  const handleClear = (id: string) => {
    setHiddenIds((prev) => new Set([...prev, id]));
  };

  const prepareLead = (card: RequestCard) => {
    const summary = card.requestSummary?.trim() ?? "";
    const details = card.request.trim();
    return summary ? `${summary.replace(/[.!?]\\s*$/, "")}. ${details}` : details;
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



  const CategoryListRow = ({
    card,
    onPrimary,
    onRemind,
    onCantHelp,
    onFlag,
    reminderLabel,
    onCancelReminder,
  }: {
    card: RequestCard;
    onPrimary: () => void;
    onRemind: () => void;
    onCantHelp: () => void;
    onFlag: () => void;
    reminderLabel?: string;
    onCancelReminder: () => void;
  }) => {
    const rawFirstName = card.name.split(" ")[0] ?? card.name;
    const firstName = rawFirstName.length > 12 ? rawFirstName.slice(0, 12) + "…" : rawFirstName;
    const initials = (card.name || "").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
    return (
      <TableRow className="hover:bg-transparent">
        <TableCell className="py-5 pl-4">
          <UserIdentityLink
            avatarUrl={card.avatarUrl}
            name={card.name}
            href={`/trusted-list/members/${card.name.toLowerCase().replace(/\s+/g, "-")}`}
            avatarSize="sm"
            showTrustedFor={false}
            groupClass="group/member"
            className="min-w-0"
          />
        </TableCell>
        <TableCell className="py-5">
          <a href={`/trusted-list/requests/view/${card.id}`} className="group/link flex flex-col min-w-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <p className="text-base font-medium leading-tight text-card-foreground truncate transition-colors group-hover/link:text-primary">
              {card.requestSummary || card.request}
            </p>
          </a>
        </TableCell>
        <TableCell className="py-5 text-base text-card-foreground whitespace-nowrap">
          {formatEndDate(card.endDate, false)}
        </TableCell>
        <TableCell className="py-5 whitespace-nowrap">
          <AudienceBadge audience={cardVariantToAudienceKey(card.variant)} />
        </TableCell>
        <TableCell className="py-5">
          {card.category ? (
            <Badge variant="outline" className="rounded-full capitalize leading-4">{card.category}</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="py-5 pr-4">
          <div className="flex justify-end items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="max-w-[9rem] px-3 h-8 text-xs font-semibold rounded-full gap-1.5 border shadow-sm hover:bg-accent hover:text-accent-foreground overflow-hidden"
              onClick={onPrimary}
            >
              <MessagesSquare className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Help {firstName}</span>
            </Button>
            {reminderLabel && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancelReminder}
                className="group/reminder h-9 w-9 rounded-full border border-lime-200 bg-lime-50 text-lime-600 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
              >
                <Bell className="h-4 w-4 group-hover/reminder:hidden" />
                <X className="h-4 w-4 hidden group-hover/reminder:block" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onRemind}>
                  <BellPlus className="mr-2 h-4 w-4" /> Remind me
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onCantHelp}>
                  <EyeOff className="mr-2 h-4 w-4" /> I can't help with this
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onFlag}>
                  <Flag className="mr-2 h-4 w-4" /> Flag as inappropriate
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden">
          <div className="flex items-center gap-3 border-b bg-background px-4 py-3 lg:hidden">
            <SidebarTrigger className="border border-border" />
          </div>
          <div className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
            <div className="mx-auto flex w-full flex-col gap-6">
              <header className="flex flex-col gap-1">
                <a href="/trusted-list/requests" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  All Requests
                </a>
                <h1 className="font-serif text-5xl font-normal leading-none">{categoryLabel}</h1>
                <p className="text-lg text-muted-foreground">Browse requests tagged for this category.</p>
              </header>

              <section className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 h-9 w-80 px-3 rounded-full border bg-background">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search requests"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground outline-none"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    className={`h-9 rounded-full font-semibold gap-2 bg-background ${activeFilterCount > 0 ? "border-primary text-primary" : ""}`}
                    onClick={() => setFilterOpen(true)}
                  >
                    <SlidersHorizontal size={16} />
                    Filter requests
                    {activeFilterCount > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full text-[10px] font-bold px-0.5 bg-primary/10 text-primary">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                  <LayoutToggle layout={layout} onChange={setLayout} className="border bg-background px-1.5" />
                </div>
              </section>

              {filtered.length === 0 ? (
                <Empty className="w-full">
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><ListFilter /></EmptyMedia>
                    <EmptyTitle>No requests match your filters</EmptyTitle>
                    <EmptyDescription>Try adjusting or resetting your filters to see results.</EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button variant="outline" className="rounded-full font-semibold" onClick={() => { setFilters(defaultFilters); setSearch(""); }}>Reset filters</Button>
                  </EmptyContent>
                </Empty>
              ) : layout === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((card) => {
                    const firstName = card.name.split(" ")[0] ?? card.name;
                    return (
                      <div key={card.id} className="p-1">
                        <IncomingRequestCard
                          {...card}
                          primaryCTA={`Help ${firstName}`}
                          onClear={() => handleClear(card.id)}
                          reminderLabel={cardReminders[card.id]}
                          onReminderSet={(label) => setCardReminders((prev) => ({ ...prev, [card.id]: label }))}
                          onReminderClear={() => setCardReminders((prev) => { const next = { ...prev }; delete next[card.id]; return next; })}
                        />
                      </div>
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
                        { key: "endDate", label: "End Date" },
                        { key: "audience", label: "Audience", className: "w-[10rem]" },
                        { key: "topic", label: "Topic" },
                      ]}
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                      actionsClassName="pr-4 w-[18rem] text-right"
                    />
                    <TableBody className="[&_tr]:bg-card">
                      {sortedFiltered.map((card) => (
                        <CategoryListRow
                          key={card.id}
                          card={card}
                          onPrimary={() => handleHelp(card)}
                          onRemind={() => handleRemind(card)}
                          onCantHelp={() => handleClear(card.id)}
                          onFlag={() => handleFlag(card)}
                          reminderLabel={cardReminders[card.id]}
                          onCancelReminder={() => {
                            setCardReminders((prev) => {
                              const next = { ...prev };
                              delete next[card.id];
                              return next;
                            });
                          }}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
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
      <SetReminderDialog
        open={remindOpen}
        onOpenChange={setRemindOpen}
        requesterName={currentCard?.name || ""}
        onConfirm={(reminderTime) => {
          if (currentCard) {
            setCardReminders((prev) => ({ ...prev, [currentCard.id]: formatReminderTime(reminderTime) }));
          }
        }}
      />
      <FilterSidebar
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={setFilters}
        appliedFilters={filters}
        defaultFilters={defaultFilters}
        audienceOptions={availableAudiences}
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
