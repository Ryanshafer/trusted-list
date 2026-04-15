import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Pencil, Columns3 } from "lucide-react"
import { useReactTable } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TableCell, TableRow } from "@/components/ui/table"
import { ExternalLink } from "lucide-react"

import { STATUS_CONFIG, SUBSCRIPTION_CONFIG, type MemberStatus, type SubscriptionStatus, type TableMember } from "../lib/members-config"

// ── Small helpers ─────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: MemberStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={`rounded-full text-[11px] font-semibold ${cfg.className}`}>
      {cfg.label}
    </Badge>
  )
}

export function SubscriptionBadge({ status }: { status: SubscriptionStatus }) {
  const cfg = SUBSCRIPTION_CONFIG[status]
  return (
    <Badge variant="outline" className={`rounded-full text-[11px] font-semibold ${cfg.className}`}>
      {cfg.label}
    </Badge>
  )
}

export function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (!sorted) return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-muted-foreground/60" />
  return sorted === "asc"
    ? <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-foreground" />
    : <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-foreground" />
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────

export function TableSkeletonRows({ count = 5, colCount }: { count?: number; colCount: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableRow key={i} className="border-b border-border/60 last:border-0">
          {Array.from({ length: colCount }).map((_, j) => (
            <TableCell key={j} className="px-4 py-3 first:pl-5 last:pr-5">
              {j === 0 ? (
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ) : (
                <Skeleton className="h-3.5 w-24" />
              )}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

// ── Column visibility toggle ──────────────────────────────────────────────────

const COLUMN_LABELS: Record<string, string> = {
  member: "Member",
  email: "Email",
  status: "Status",
  joinDate: "Joined",
  subscriptionStatus: "Plan",
  stripeId: "Stripe ID",
}

export function ColumnVisibilityToggle({
  table,
}: {
  table: ReturnType<typeof useReactTable<TableMember>>
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 rounded-full gap-2 font-semibold text-xs">
          <Columns3 className="h-3.5 w-3.5" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-xl">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter((col) => col.getCanHide())
          .map((col) => (
            <DropdownMenuCheckboxItem
              key={col.id}
              className="capitalize text-sm"
              checked={col.getIsVisible()}
              onCheckedChange={(val) => col.toggleVisibility(!!val)}
            >
              {COLUMN_LABELS[col.id] ?? col.id}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── Column definitions ────────────────────────────────────────────────────────

export function buildColumns(
  onAction: (action: "edit" | "ban" | "remove", member: TableMember) => void
): ColumnDef<TableMember>[] {
  return [
    {
      id: "member",
      accessorKey: "name",
      header: ({ column }) => (
        <button
          className="flex items-center text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Member
          <SortIcon sorted={column.getIsSorted()} />
        </button>
      ),
      cell: ({ row }) => {
        const m = row.original
        const initials = m.name.split(" ").map((p) => p[0]).join("").toUpperCase()
        return (
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-8 w-8 shrink-0 rounded-full border border-border">
              <AvatarImage src={m.avatarUrl ?? ""} alt={m.name} className="object-cover" />
              <AvatarFallback className="rounded-full text-[10px] font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
              <p className="truncate text-xs text-muted-foreground">{m.title} · {m.company}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "email",
      header: () => (
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</span>
      ),
      cell: ({ row }) => (
        <a
          href={`mailto:${row.original.email}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {row.original.email}
        </a>
      ),
    },
    {
      accessorKey: "status",
      header: () => (
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</span>
      ),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "joinDate",
      header: ({ column }) => (
        <button
          className="flex items-center text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Joined
          <SortIcon sorted={column.getIsSorted()} />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {new Date(row.original.joinDate + "T00:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      accessorKey: "subscriptionStatus",
      header: () => (
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Plan</span>
      ),
      cell: ({ row }) => <SubscriptionBadge status={row.original.subscriptionStatus} />,
      enableSorting: false,
    },
    {
      id: "stripeId",
      accessorKey: "stripe_customer_id",
      header: () => (
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Stripe ID</span>
      ),
      cell: ({ row }) => {
        const stripeId = row.original.stripe_customer_id
        if (!stripeId) {
          return <span className="text-sm text-muted-foreground/50">—</span>
        }
        return (
          <a
            href={`https://stripe.com/?id=${stripeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {stripeId}
            <ExternalLink className="h-3 w-3" />
          </a>
        )
      },
      enableSorting: false,
    },
    {
      id: "actions",
      header: () => null,
      cell: ({ row }) => {
        const m = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full opacity-0 group-hover/row:opacity-100 data-[state=open]:opacity-100 transition-opacity"
                aria-label={`Actions for ${m.name}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl">
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                {m.name}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onAction("edit", m)}>
                  <Pencil className="h-4 w-4" />
                  Edit
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
