import React from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hand, ListFilter } from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Table, TableBody } from "@/components/ui/table";
import {
  FilterSidebar,
  FilterAccordionSection,
} from "@/components/FilterSidebar";
import {
  AskForHelpDialog,
  type AskContact,
} from "@/features/dashboard/components/AppShell";
import {
  interactions,
  myHelpRequests,
  type MyHelpRequest,
} from "@/features/interactions/utils/data";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import askContent from "../../../../data/dashboard-content.json";
import { SortableTableHeader } from "./SortableTableHeader";
import { OutgoingRequestCard } from "./OutgoingRequestCard";
import { HelpingCard } from "./HelpingCard";
import { RemindersTabContent } from "./RemindersTabContent";
import { FilterBar } from "./FilterBar";
import { type Reminder } from "./SetReminderDialog";
import {
  type SidebarFilters,
  type AvailableFilterOptions,
  defaultSidebarFilters,
  countActiveFilters,
  filterCardData,
  computeCardFilterOptions,
  useSortState,
  type HelpingCardSortKey,
  sortHelpingCards,
} from "@/features/interactions/utils/interaction-utils";

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
