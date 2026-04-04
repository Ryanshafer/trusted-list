import React from "react";
import { BellPlus, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { CardData } from "@/features/dashboard/types";
import type { Reminder } from "./SetReminderDialog";
import { formatReminderTime } from "./SetReminderDialog";
import { variantToAudienceKey } from "@/features/interactions/utils/interaction-utils";
import { IncomingRequestCard } from "@/features/dashboard/components/HelpRequestCards";
import { SortableTableHeader, type ColumnDef } from "./SortableTableHeader";
import { ReminderListRow } from "./ReminderListRow";
import { FilterBar } from "./FilterBar";
import { FilterSidebar, FilterAccordionSection } from "@/components/FilterSidebar";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
} from "@/components/ui/table";
import {
  type SidebarFilters,
  type AvailableFilterOptions,
  defaultSidebarFilters,
  filterCardData,
  useSortState,
} from "@/features/interactions/utils/interaction-utils";

export const RemindersTabContent = ({
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
    </>
  );
}

