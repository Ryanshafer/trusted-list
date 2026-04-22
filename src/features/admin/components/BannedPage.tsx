"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { MoreHorizontal, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FilterSidebar, FilterAccordionSection } from "@/components/FilterSidebar"

import { AdminPageLayout } from "./AdminShell"
import { EditMemberDialog } from "./EditMemberDialog"
import { TableSkeletonRows, SortIcon } from "./MembersColumns"
import { ApplicationTypeBadge, SubscriptionBadge } from "./shared/status-badges"
import { AdminFilterButton, AdminPagination, AdminSearchField, SortableHeaderButton } from "./shared/admin-list-controls"
import { toast } from "@/features/admin/lib/toast"
import { useBannedMembersData } from "@/features/admin/hooks/useBannedMembersData"
import { unbanPerson } from "@/features/admin/lib/review-status-actions"
import { SUBSCRIPTION_CONFIG, type EditMember } from "@/features/admin/lib/members-config"
import { DEFAULT_BANNED_FILTERS, type BannedFilters } from "@/features/admin/lib/banned-members-api"
import type { BannedRow } from "@/features/admin/lib/review-status-types"

function buildColumns(
  onAction: (action: "edit" | "unban", person: BannedRow) => void
): ColumnDef<BannedRow>[] {
  return [
    {
      id: "member",
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeaderButton
          label="Individual"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          icon={<SortIcon sorted={column.getIsSorted()} />}
        />
      ),
      cell: ({ row }) => {
        const person = row.original
        const initials = person.name.split(" ").map((part) => part[0]).join("").toUpperCase()
        return (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-8 w-8 shrink-0 rounded-full border border-border">
              <AvatarImage src={person.avatarUrl ?? ""} alt={person.name} className="object-cover" />
              <AvatarFallback className="rounded-full text-[10px] font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{person.name}</p>
              <p className="truncate text-xs text-muted-foreground max-w-[30ch]">{person.title} · {person.company}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "email",
      header: () => <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</span>,
      cell: ({ row }) => (
        <a href={`mailto:${row.original.email}`} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
          {row.original.email}
        </a>
      ),
    },
    {
      id: "type",
      accessorKey: "applicationType",
      header: () => <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Source</span>,
      cell: ({ row }) => <ApplicationTypeBadge applicationType={row.original.applicationType} />,
      enableSorting: false,
    },
    {
      accessorKey: "joinDate",
      header: ({ column }) => (
        <SortableHeaderButton
          label="Joined"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          icon={<SortIcon sorted={column.getIsSorted()} />}
        />
      ),
      cell: ({ row }) => {
        const person = row.original
        if (person.kind === "applicant" || !person.joinDate) {
          return <span className="text-sm text-muted-foreground/50">—</span>
        }

        return (
          <span className="text-xs tabular-nums text-muted-foreground">
            {new Date(person.joinDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        )
      },
    },
    {
      accessorKey: "subscriptionStatus",
      header: () => <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Plan</span>,
      cell: ({ row }) => <SubscriptionBadge status={row.original.subscriptionStatus} />,
      enableSorting: false,
    },
    {
      id: "actions",
      header: () => null,
      cell: ({ row }) => {
        const person = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full opacity-0 transition-opacity group-hover/row:opacity-100 data-[state=open]:opacity-100"
                aria-label={`Actions for ${person.name}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl">
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">{person.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onAction("edit", person)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-emerald-600 focus:text-emerald-600" onClick={() => onAction("unban", person)}>
                  {person.kind === "member" ? "Unban member" : "Return to queue"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
  ]
}

export default function BannedPage() {
  const {
    search, setSearch, debouncedSearch,
    appliedFilters, setAppliedFilters,
    sorting, setSorting,
    pagination, setPagination,
    data, totalCount, isLoading, error,
  } = useBannedMembersData()

  const [filterOpen, setFilterOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [selectedPerson, setSelectedPerson] = React.useState<EditMember | null>(null)
  const [unbanTarget, setUnbanTarget] = React.useState<BannedRow | null>(null)

  const columns = React.useMemo(
    () =>
      buildColumns((action, person) => {
        if (action === "edit") {
          const [firstName, ...lastNameParts] = person.name.split(" ")
          setSelectedPerson({
            id: person.id,
            firstName,
            lastName: lastNameParts.join(" ") || "",
            email: person.email,
            avatarUrl: person.avatarUrl,
            linkedinUrl: person.linkedInUrl || "",
            status: "banned",
            inviteQuota: person.kind === "member" ? person.inviteQuota : 0,
            hasUnlimitedInvites: person.kind === "member" ? person.hasUnlimitedInvites : false,
            subscriptionEnabled: person.kind === "member" ? person.subscriptionEnabled : false,
            subscriptionRenewalDate: person.kind === "member" ? person.subscriptionRenewalDate : new Date(),
          })
          setEditDialogOpen(true)
          return
        }

        setUnbanTarget(person)
      }),
    []
  )

  const table = useReactTable({
    data,
    columns,
    rowCount: totalCount,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualSorting: true,
    manualPagination: true,
  })

  const activeFilterCount =
    appliedFilters.types.length +
    appliedFilters.subscriptionStatuses.length +
    (appliedFilters.dateFrom ? 1 : 0) +
    (appliedFilters.dateTo ? 1 : 0)

  const isFiltered = activeFilterCount > 0
  const { pageIndex, pageSize } = pagination
  const pageStart = totalCount === 0 ? 0 : pageIndex * pageSize + 1
  const pageEnd = Math.min((pageIndex + 1) * pageSize, totalCount)

  return (
    <AdminPageLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-destructive">Banned</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isLoading
              ? "Loading…"
              : debouncedSearch || isFiltered
              ? `${totalCount} result${totalCount !== 1 ? "s" : ""}`
              : `${totalCount} banned individual${totalCount !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AdminSearchField
            value={search}
            onChange={setSearch}
            placeholder="Search by name, email, company…"
          />
          <div className="ml-auto">
            <AdminFilterButton count={activeFilterCount} onClick={() => setFilterOpen(true)} />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b border-border hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-10 bg-muted/30 px-4 first:pl-5 last:pr-5">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                  <TableRow key={row.id} className="group/row border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-3 first:pl-5 last:pr-5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-sm text-muted-foreground">
                    {debouncedSearch || isFiltered
                      ? "No banned people match your search or filters."
                      : "No banned people found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <AdminPagination
          pageIndex={pageIndex}
          pageCount={table.getPageCount()}
          pageStart={pageStart}
          pageEnd={pageEnd}
          totalCount={totalCount}
          label="record"
          canPreviousPage={table.getCanPreviousPage()}
          canNextPage={table.getCanNextPage()}
          onPreviousPage={() => table.previousPage()}
          onNextPage={() => table.nextPage()}
          onSetPage={(nextPageIndex) => table.setPageIndex(nextPageIndex)}
        />

        <FilterSidebar<BannedFilters>
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          onApply={setAppliedFilters}
          appliedFilters={appliedFilters}
          defaultFilters={DEFAULT_BANNED_FILTERS}
          audienceOptions={{ contact: false, circle: false, community: false }}
          extraSections={(pending, toggle) => (
            <>
              <FilterAccordionSection title="Type">
                <div className="flex flex-col gap-3">
                  {(["invited", "waitlist"] as const).map((type) => (
                    <div key={type} className="flex items-center gap-3">
                      <Checkbox
                        id={`filter-type-${type}`}
                        checked={pending.types.includes(type)}
                        onCheckedChange={() => toggle("types", type)}
                      />
                      <Label htmlFor={`filter-type-${type}`} className="cursor-pointer font-normal">
                        <ApplicationTypeBadge applicationType={type} />
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
                        <SubscriptionBadge status={status as keyof typeof SUBSCRIPTION_CONFIG} />
                      </Label>
                    </div>
                  ))}
                </div>
              </FilterAccordionSection>
            </>
          )}
        />
      </div>

      <EditMemberDialog member={selectedPerson} open={editDialogOpen} onOpenChange={setEditDialogOpen} />

      <AlertDialog open={unbanTarget !== null} onOpenChange={(open) => !open && setUnbanTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{unbanTarget?.kind === "member" ? "Unban member?" : "Return applicant to queue?"}</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{unbanTarget?.name}</span>{" "}
              {unbanTarget?.kind === "member"
                ? "will regain access to the platform."
                : "will be removed from banned status and sent back to the approval queue."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full font-semibold"
              onClick={() => {
                if (!unbanTarget) return
                unbanPerson(unbanTarget.id, unbanTarget.kind)
                toast.success(
                  unbanTarget.kind === "member" ? `${unbanTarget.name} unbanned` : `${unbanTarget.name} returned to queue`,
                  {
                    description: unbanTarget.kind === "member"
                      ? "The member has been reinstated."
                      : "The applicant can be reviewed again from approvals.",
                  }
                )
                setUnbanTarget(null)
              }}
            >
              {unbanTarget?.kind === "member" ? "Unban member" : "Return to queue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageLayout>
  )
}
