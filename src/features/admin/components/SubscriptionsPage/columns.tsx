import * as React from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, CalendarDays, Ban, RefreshCcw, XCircle, Power, PowerOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type { Subscription, RowAction, SubStatus } from "./types"
import { formatAmount, formatDate, memberInitials } from "./helpers"
import { PlanBadge, StatusBadge } from "./badges"

export function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc")  return <ArrowUp className="h-3 w-3" />
  if (sorted === "desc") return <ArrowDown className="h-3 w-3" />
  return <ArrowUpDown className="h-3 w-3 opacity-40" />
}

export function buildColumns(onAction: (a: RowAction) => void): ColumnDef<Subscription>[] {
  return [
    {
      id: "member",
      accessorKey: "memberName",
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Member <SortIcon sorted={column.getIsSorted()} />
        </button>
      ),
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className="flex items-center gap-3 min-w-[180px]">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={s.avatarUrl} alt={s.memberName} />
              <AvatarFallback className="text-xs font-semibold">
                {memberInitials(s.memberName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium text-foreground">{s.memberName}</span>
              <span className="text-xs text-muted-foreground">
                {s.memberTitle} · {s.memberCompany}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "plan",
      header: () => (
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Plan</span>
      ),
      cell: ({ row }) => <PlanBadge plan={row.original.plan} />,
      enableSorting: false,
    },
    {
      accessorKey: "status",
      header: () => (
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</span>
      ),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      filterFn: (row, _colId, filterValue: SubStatus[]) => {
        if (!filterValue || filterValue.length === 0) return true
        return filterValue.includes(row.original.status)
      },
      enableSorting: false,
    },
    {
      accessorKey: "renewalDate",
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Renewal Date <SortIcon sorted={column.getIsSorted()} />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatDate(row.original.renewalDate)}
        </span>
      ),
      sortingFn: "datetime",
    },
    {
      accessorKey: "amountCents",
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount <SortIcon sorted={column.getIsSorted()} />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatAmount(row.original.amountCents)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => null,
      cell: ({ row }) => {
        const s = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full opacity-0 group-hover/row:opacity-100 data-[state=open]:opacity-100 transition-opacity"
                aria-label={`Actions for ${s.memberName}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl">
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                {s.memberName}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onAction({ type: "toggle-status", sub: s })}>
                  {s.status === "Active"
                    ? <><PowerOff className="h-4 w-4" /> Disable Subscription</>
                    : <><Power className="h-4 w-4" /> Enable Subscription</>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction({ type: "edit-renewal", sub: s })}>
                  <CalendarDays className="h-4 w-4" />
                  Edit Renewal Date
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => onAction({ type: "cancel", sub: s })}
                  className="text-amber-600 focus:text-amber-600 dark:text-amber-400"
                >
                  <Ban className="h-4 w-4" />
                  Cancel Subscription
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction({ type: "refund", sub: s })}>
                  <RefreshCcw className="h-4 w-4" />
                  Process Refund
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onAction({ type: "cancel-tx", sub: s })} 
                  className="text-destructive focus:text-destructive"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel Transaction
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
