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
import { ApplicationTypeBadge } from "./shared/status-badges"
import { AdminFilterButton, AdminPagination, AdminSearchField, SortableHeaderButton } from "./shared/admin-list-controls"
import { toast } from "@/features/admin/lib/toast"
import { useOnHoldMembersData } from "@/features/admin/hooks/useOnHoldMembersData"
import { releaseApplicantHold } from "@/features/admin/lib/review-status-actions"
import { DEFAULT_ON_HOLD_FILTERS, type OnHoldFilters } from "@/features/admin/lib/on-hold-members-api"
import type { EditMember } from "@/features/admin/lib/members-config"
import type { OnHoldApplicantRow } from "@/features/admin/lib/review-status-types"

function HoldReasonCell({ reason }: { reason?: string }) {
  const [expanded, setExpanded] = React.useState(false)
  if (!reason) return <span className="text-sm italic text-muted-foreground opacity-50">No reason provided</span>
  return (
    <div className="max-w-[36ch]">
      <span className="text-sm text-muted-foreground">
        {expanded ? reason : reason.length > 60 ? `${reason.slice(0, 60)}…` : reason}
      </span>
      {reason.length > 60 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="ml-1 text-xs font-medium text-foreground underline-offset-2 hover:underline"
        >
          {expanded ? "less" : "more"}
        </button>
      )}
    </div>
  )
}

function buildColumns(
  onAction: (action: "edit" | "release", applicant: OnHoldApplicantRow) => void
): ColumnDef<OnHoldApplicantRow>[] {
  return [
    {
      id: "member",
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeaderButton
          label="Candidate"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          icon={<SortIcon sorted={column.getIsSorted()} />}
        />
      ),
      cell: ({ row }) => {
        const applicant = row.original
        const initials = applicant.name.split(" ").map((part) => part[0]).join("").toUpperCase()
        return (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-8 w-8 shrink-0 rounded-full border border-border">
              <AvatarImage src={applicant.avatarUrl ?? ""} alt={applicant.name} className="object-cover" />
              <AvatarFallback className="rounded-full text-[10px] font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{applicant.name}</p>
              <p className="truncate text-xs text-muted-foreground max-w-[30ch]">{applicant.title} · {applicant.company}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "email",
      header: () => <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</span>,
      cell: ({ row }) => (
        <a href={`mailto:${row.original.email}`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
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
      id: "holdReason",
      accessorKey: "holdReason",
      header: () => <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</span>,
      cell: ({ row }) => <HoldReasonCell reason={row.original.holdReason} />,
      enableSorting: false,
    },
    {
      accessorKey: "appliedAt",
      header: ({ column }) => (
        <SortableHeaderButton
          label="Applied"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          icon={<SortIcon sorted={column.getIsSorted()} />}
        />
      ),
      cell: ({ row }) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {new Date(row.original.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => null,
      cell: ({ row }) => {
        const applicant = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full opacity-0 transition-opacity group-hover/row:opacity-100 data-[state=open]:opacity-100"
                aria-label={`Actions for ${applicant.name}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl">
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">{applicant.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onAction("edit", applicant)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-emerald-600 focus:text-emerald-600" onClick={() => onAction("release", applicant)}>
                  Return to queue
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

export default function OnHoldPage() {
  const {
    search, setSearch, debouncedSearch,
    appliedFilters, setAppliedFilters,
    sorting, setSorting,
    pagination, setPagination,
    data, totalCount, isLoading, error,
  } = useOnHoldMembersData()

  const [filterOpen, setFilterOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [selectedApplicant, setSelectedApplicant] = React.useState<EditMember | null>(null)
  const [releaseTarget, setReleaseTarget] = React.useState<OnHoldApplicantRow | null>(null)

  const columns = React.useMemo(
    () =>
      buildColumns((action, applicant) => {
        if (action === "edit") {
          const [firstName, ...lastNameParts] = applicant.name.split(" ")
          setSelectedApplicant({
            id: applicant.applicantId,
            firstName,
            lastName: lastNameParts.join(" ") || "",
            email: applicant.email,
            avatarUrl: applicant.avatarUrl,
            linkedinUrl: applicant.linkedInUrl || "",
            status: "on-hold",
            inviteQuota: 0,
            hasUnlimitedInvites: false,
            subscriptionEnabled: false,
            subscriptionRenewalDate: new Date(applicant.appliedAt),
          })
          setEditDialogOpen(true)
          return
        }

        setReleaseTarget(applicant)
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

  const activeFilterCount = appliedFilters.types.length + (appliedFilters.dateFrom ? 1 : 0) + (appliedFilters.dateTo ? 1 : 0)
  const isFiltered = activeFilterCount > 0
  const { pageIndex, pageSize } = pagination
  const pageStart = totalCount === 0 ? 0 : pageIndex * pageSize + 1
  const pageEnd = Math.min((pageIndex + 1) * pageSize, totalCount)

  return (
    <AdminPageLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">On Hold</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isLoading
              ? "Loading…"
              : debouncedSearch || isFiltered
              ? `${totalCount} result${totalCount !== 1 ? "s" : ""}`
              : `${totalCount} candidate${totalCount !== 1 ? "s" : ""} on hold`}
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
                      ? "No on-hold applicants match your search or filters."
                      : "No applicants are currently on hold."}
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
          label="applicant"
          canPreviousPage={table.getCanPreviousPage()}
          canNextPage={table.getCanNextPage()}
          onPreviousPage={() => table.previousPage()}
          onNextPage={() => table.nextPage()}
          onSetPage={(nextPageIndex) => table.setPageIndex(nextPageIndex)}
        />

        <FilterSidebar<OnHoldFilters>
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          onApply={setAppliedFilters}
          appliedFilters={appliedFilters}
          defaultFilters={DEFAULT_ON_HOLD_FILTERS}
          audienceOptions={{ contact: false, circle: false, community: false }}
          extraSections={(pending, toggle) => (
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
          )}
        />
      </div>

      <EditMemberDialog member={selectedApplicant} open={editDialogOpen} onOpenChange={setEditDialogOpen} />

      <AlertDialog open={releaseTarget !== null} onOpenChange={(open) => !open && setReleaseTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Return applicant to queue?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{releaseTarget?.name}</span> will be removed from on hold and sent back to the approval queue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full font-semibold"
              onClick={() => {
                if (!releaseTarget) return
                releaseApplicantHold(releaseTarget.id)
                toast.success(`${releaseTarget.name} returned to queue`, {
                  description: "The applicant can be reviewed again from approvals.",
                })
                setReleaseTarget(null)
              }}
            >
              Return to queue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageLayout>
  )
}
