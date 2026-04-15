"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FilterSidebar, FilterAccordionSection } from "@/components/FilterSidebar"
import { AdminPageLayout } from "./AdminShell"
import { EditMemberDialog } from "./EditMemberDialog"
import { InviteDialog } from "@/features/invites/components/InviteDialog"
import { toast } from "@/features/admin/lib/toast"
import { useMembersData } from "@/features/admin/hooks/useMembersData"
import { buildColumns, TableSkeletonRows, ColumnVisibilityToggle } from "./MembersColumns"
import {
  STATUS_CONFIG,
  SUBSCRIPTION_CONFIG,
  ALL_STATUSES,
  DEFAULT_FILTERS,
  type TableMember,
  type EditMember,
  type MemberFilters,
} from "@/features/admin/lib/members-config"

// Reads the pre-navigation member name from localStorage so useMembersData can
// initialize with an active search, which causes the API layer to actually fetch.
function getInitialMemberSearch(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("adminEditMemberName") ?? ""
}

export default function MembersPage() {
  // Lazy useState so this runs once and is stable across re-renders.
  const [initialSearch] = React.useState(getInitialMemberSearch)

  const {
    search, setSearch, debouncedSearch,
    appliedFilters, setAppliedFilters,
    sorting, setSorting,
    columnVisibility, setColumnVisibility,
    pagination, setPagination,
    data, totalCount, isLoading, error,
  } = useMembersData(initialSearch)

  // UI-only state (not data concerns)
  const [filterOpen, setFilterOpen] = React.useState(false)
  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [pendingAction, setPendingAction] = React.useState<{
    type: "ban" | "remove"
    member: TableMember
  } | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [selectedMember, setSelectedMember] = React.useState<EditMember | null>(null)
  const hasProcessedNavigation = React.useRef(false)

  // Open the EditMemberDialog when arriving via the moderation queue link.
  // We pre-populated the search with the member's name (via initialSearch / useMembersData),
  // so once the fetch completes `data` will contain the target member.
  React.useEffect(() => {
    // Skip if already handled, still loading, or data not yet populated by the search.
    if (hasProcessedNavigation.current || isLoading || data.length === 0) return

    const editMemberId = localStorage.getItem("adminEditMemberId")
    if (!editMemberId) return

    // Mark as processed before any async state updates to prevent double-runs.
    hasProcessedNavigation.current = true
    localStorage.removeItem("adminEditMemberId")
    localStorage.removeItem("adminEditMemberName")

    const memberToEdit = data.find((member) => member.id === editMemberId)
    if (memberToEdit) {
      const [firstName, ...lastNameParts] = memberToEdit.name.split(" ")
      setSelectedMember({
        id: memberToEdit.id,
        firstName,
        lastName: lastNameParts.join(" ") || "",
        email: memberToEdit.email,
        avatarUrl: memberToEdit.avatarUrl,
        linkedinUrl: memberToEdit.linkedInUrl || "",
        status: memberToEdit.status.toLowerCase() as EditMember["status"],
        inviteQuota: memberToEdit.inviteQuota,
        hasUnlimitedInvites: memberToEdit.hasUnlimitedInvites,
        subscriptionEnabled: memberToEdit.subscriptionEnabled,
        subscriptionRenewalDate: memberToEdit.subscriptionRenewalDate,
      })
      setEditDialogOpen(true)
    }
  }, [data, isLoading])

  const columns = React.useMemo(
    () =>
      buildColumns((action, member) => {
        if (action === "ban" || action === "remove") {
          setPendingAction({ type: action, member })
        } else if (action === "edit") {
          const [firstName, ...lastNameParts] = member.name.split(" ")
          setSelectedMember({
            id: member.id,
            firstName,
            lastName: lastNameParts.join(" ") || "",
            email: member.email,
            avatarUrl: member.avatarUrl,
            linkedinUrl: member.linkedInUrl || "",
            status: member.status.toLowerCase() as EditMember["status"],
            inviteQuota: member.inviteQuota,
            hasUnlimitedInvites: member.hasUnlimitedInvites,
            subscriptionEnabled: member.subscriptionEnabled,
            subscriptionRenewalDate: member.subscriptionRenewalDate,
          })
          setEditDialogOpen(true)
        }
      }),
    []
  )

  const table = useReactTable({
    data,
    columns,
    rowCount: totalCount,
    state: { sorting, columnVisibility, pagination },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
  })

  const activeFilterCount =
    appliedFilters.statuses.length +
    appliedFilters.subscriptionStatuses.length +
    (appliedFilters.dateFrom ? 1 : 0) +
    (appliedFilters.dateTo ? 1 : 0)

  const isFiltered = activeFilterCount > 0
  const { pageIndex, pageSize } = pagination
  const pageStart = totalCount === 0 ? 0 : pageIndex * pageSize + 1
  const pageEnd = Math.min((pageIndex + 1) * pageSize, totalCount)
  const hasResults = (debouncedSearch || isFiltered) && totalCount > 0

  return (
    <AdminPageLayout>
      <div className="flex flex-col gap-6">
        {/* Page header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Members</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isLoading
                ? "Searching…"
                : debouncedSearch || isFiltered
                ? `${totalCount} result${totalCount !== 1 ? "s" : ""}`
                : "Search or filter to find members"}
            </p>
          </div>
          <Button className="rounded-full font-semibold" size="sm" onClick={() => setInviteOpen(true)}>
            Invite member
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, company…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 rounded-full border-border bg-muted/40 pl-8 pr-8 text-sm placeholder:text-muted-foreground/60 focus-visible:bg-background"
            />
            {search && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              className={`h-8 rounded-full gap-2 font-semibold text-xs${activeFilterCount > 0 ? " border-primary text-primary" : ""}`}
              onClick={() => setFilterOpen(true)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/10 px-1 text-[10px] font-bold text-primary">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <ColumnVisibilityToggle table={table} />
          </div>
        </div>

        {/* Error state */}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="border-b border-border hover:bg-transparent">
                  {hg.headers.map((header) => (
                    <TableHead key={header.id} className="h-10 bg-muted/30 px-4 first:pl-5 last:pr-5">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeletonRows count={pageSize} colCount={columns.length} />
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="group/row border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-3 first:pl-5 last:pr-5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-sm text-muted-foreground"
                  >
                    {!debouncedSearch && !isFiltered
                      ? "Search by name, email, or company or apply a filter to find members."
                      : "No members match your search or filters."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination — only shown when there are results */}
        {hasResults && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs tabular-nums text-muted-foreground">
              Showing {pageStart}–{pageEnd} of {totalCount} member{totalCount !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: table.getPageCount() }, (_, i) => (
                  <Button
                    key={i}
                    variant={pageIndex === i ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8 rounded-full text-xs font-medium"
                    onClick={() => table.setPageIndex(i)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Filter sidebar */}
        <FilterSidebar<MemberFilters>
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          onApply={setAppliedFilters}
          appliedFilters={appliedFilters}
          defaultFilters={DEFAULT_FILTERS}
          audienceOptions={{ contact: false, circle: false, community: false }}
          extraSections={(pending, toggle) => (
            <>
              <FilterAccordionSection title="Member Status">
                <div className="flex flex-col gap-3">
                  {ALL_STATUSES.map((s) => (
                    <div key={s} className="flex items-center gap-3">
                      <Checkbox
                        id={`filter-status-${s}`}
                        checked={pending.statuses.includes(s)}
                        onCheckedChange={() => toggle("statuses", s)}
                      />
                      <Label htmlFor={`filter-status-${s}`} className="cursor-pointer font-normal">
                        <Badge
                          variant="outline"
                          className={`rounded-full text-[11px] font-semibold ${STATUS_CONFIG[s].className}`}
                        >
                          {s}
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </div>
              </FilterAccordionSection>
              <FilterAccordionSection title="Subscription Plan">
                <div className="flex flex-col gap-3">
                  {Object.entries(SUBSCRIPTION_CONFIG).map(([status, config]) => (
                    <div key={status} className="flex items-center gap-3">
                      <Checkbox
                        id={`filter-subscription-${status}`}
                        checked={pending.subscriptionStatuses.includes(status)}
                        onCheckedChange={() => toggle("subscriptionStatuses", status)}
                      />
                      <Label htmlFor={`filter-subscription-${status}`} className="cursor-pointer font-normal">
                        <Badge
                          variant="outline"
                          className={`rounded-full text-[11px] font-semibold ${config.className}`}
                        >
                          {config.label}
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </div>
              </FilterAccordionSection>
            </>
          )}
        />
      </div>

      {/* Invite Dialog */}
      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        title="Create a member for The Trusted List"
        description="Fill out the required fields to create a new member."
        submitLabel="Create"
      />

      {/* Edit Member Dialog */}
      <EditMemberDialog
        member={selectedMember}
        open={editDialogOpen}
        onOpenChange={(open) => { if (!open) setEditDialogOpen(false) }}
      />

      {/* Destructive action confirmation */}
      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => { if (!open) setPendingAction(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === "ban"
                ? pendingAction.member.status === "Banned" ? "Unban member?" : "Ban member?"
                : "Remove member?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === "ban"
                ? pendingAction.member.status === "Banned"
                  ? <><span className="font-medium text-foreground">{pendingAction.member.name}</span> will be reinstated and regain access to the platform.</>
                  : <><span className="font-medium text-foreground">{pendingAction.member.name}</span> will lose access to the platform immediately. You can reverse this at any time.</>
                : <><span className="font-medium text-foreground">{pendingAction?.member.name}</span> will be permanently removed. Their profile, connections, and data will be deleted. This action cannot be undone.</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={`rounded-full font-semibold ${
                pendingAction?.type === "remove"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-amber-600 text-white hover:bg-amber-700"
              }`}
              onClick={() => {
                if (!pendingAction) return
                const { type, member } = pendingAction
                if (type === "ban") {
                  const isBanned = member.status === "Banned"
                  toast.success(isBanned ? `${member.name} unbanned` : `${member.name} banned`, {
                    description: isBanned ? "Member has been reinstated." : "Member has lost platform access.",
                  })
                } else {
                  toast.success(`${member.name} removed`, {
                    description: "Member and their data have been permanently deleted.",
                  })
                }
                setPendingAction(null)
              }}
            >
              {pendingAction?.type === "ban"
                ? pendingAction.member.status === "Banned" ? "Unban member" : "Ban member"
                : "Remove member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageLayout>
  )
}
