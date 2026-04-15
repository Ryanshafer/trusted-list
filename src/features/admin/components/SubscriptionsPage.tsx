"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  MoreHorizontal,
  CalendarDays,
  Ban,
  RefreshCcw,
  XCircle,
  Power,
  PowerOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "@/features/admin/lib/toast"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { AdminPageLayout } from "./AdminShell"
import subscriptionsRaw from "../../../../data/subscriptions.json"

// ── Types ─────────────────────────────────────────────────────────────────────

type Plan = "Pro" | "Trial" | "Free"
type SubStatus = "Active" | "Canceled" | "Expired"

type Subscription = {
  id: string
  memberId: string
  memberName: string
  memberTitle: string
  memberCompany: string
  email: string
  avatarUrl: string
  plan: Plan
  billingCycle: string
  amountCents: number
  startDate: string
  renewalDate: string
  status: SubStatus
}

const INITIAL_DATA = subscriptionsRaw as Subscription[]

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAmount(cents: number) {
  if (cents === 0) return "Free"
  return `$${(cents / 100).toFixed(2)}`
}

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function memberInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

// ── Badge configs ─────────────────────────────────────────────────────────────

const PLAN_CONFIG: Record<Plan, string> = {
  Pro:   "border-primary/30 bg-primary/10 text-primary",
  Trial: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-400",
  Free:  "border-border bg-muted/50 text-muted-foreground",
}

const STATUS_CONFIG: Record<SubStatus, { label: string; className: string }> = {
  Active:   { label: "Active",   className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400" },
  Canceled: { label: "Canceled", className: "border-neutral-200 bg-neutral-100 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-400" },
  Expired:  { label: "Expired",  className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400" },
}

const ALL_STATUSES: SubStatus[] = ["Active", "Canceled", "Expired"]

function PlanBadge({ plan }: { plan: Plan }) {
  return (
    <Badge variant="outline" className={`rounded-full text-[11px] font-semibold ${PLAN_CONFIG[plan]}`}>
      {plan}
    </Badge>
  )
}

function StatusBadge({ status }: { status: SubStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={`rounded-full text-[11px] font-semibold ${cfg.className}`}>
      {cfg.label}
    </Badge>
  )
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc")  return <ArrowUp className="h-3 w-3" />
  if (sorted === "desc") return <ArrowDown className="h-3 w-3" />
  return <ArrowUpDown className="h-3 w-3 opacity-40" />
}

// ── Section 1: Product Settings Card ─────────────────────────────────────────

function ProductSettingsCard() {
  const [productName, setProductName] = React.useState("Pro Membership")
  const [price, setPrice] = React.useState("29.00")
  const [duration, setDuration] = React.useState("monthly")
  const [taxEnabled, setTaxEnabled] = React.useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const durationLabel: Record<string, string> = {
      biweekly: "Bi-Weekly", monthly: "Monthly", quarterly: "Quarterly",
      biannual: "Bi-Annual", annual: "Annual",
    }
    toast.success("Product settings saved", {
      description: `${productName} · $${price} · ${durationLabel[duration] ?? duration}`,
    })
  }

  return (
    <Card className="rounded-xl border border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Subscription Product Settings</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Configure the default subscription product offered to members.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Product Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-name" className="text-xs font-medium text-muted-foreground">
                Product Name
              </Label>
              <Input
                id="product-name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Pro Membership"
                className="h-9 rounded-full text-sm"
              />
            </div>

            {/* Price */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-price" className="text-xs font-medium text-muted-foreground">
                Price (USD)
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
                  $
                </span>
                <Input
                  id="product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="h-9 rounded-full pl-6 text-sm tabular-nums"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-duration" className="text-xs font-medium text-muted-foreground">
                Duration
              </Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="product-duration" className="h-9 rounded-full text-sm">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="biannual">Bi-Annual</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tax toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Global Tax Handling</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Automatically calculate and apply tax to all subscriptions.
              </p>
            </div>
            <Switch
              id="tax-handling"
              checked={taxEnabled}
              onCheckedChange={(checked) => {
                setTaxEnabled(checked)
                toast.info(
                  checked ? "Tax handling enabled" : "Tax handling disabled",
                  { description: checked ? "Tax will be calculated at checkout." : "Tax will not be applied." }
                )
              }}
              aria-label="Toggle global tax handling"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="sm" className="rounded-full font-semibold px-5">
              Save Settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ── Column definitions ────────────────────────────────────────────────────────

type RowAction =
  | { type: "toggle-status"; sub: Subscription }
  | { type: "edit-renewal";  sub: Subscription }
  | { type: "cancel";        sub: Subscription }
  | { type: "refund";        sub: Subscription }
  | { type: "cancel-tx";     sub: Subscription }

function buildColumns(onAction: (a: RowAction) => void): ColumnDef<Subscription>[] {
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  const [data, setData] = React.useState<Subscription[]>(INITIAL_DATA)
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "renewalDate", desc: true },
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [statusFilter, setStatusFilter] = React.useState<SubStatus | "">("")

  // Dialog state
  const [pendingRenewal, setPendingRenewal] = React.useState<Subscription | null>(null)
  const [renewalDate, setRenewalDate] = React.useState<Date | undefined>(undefined)
  const [pendingCancel, setPendingCancel] = React.useState<Subscription | null>(null)
  const [pendingRefund, setPendingRefund] = React.useState<Subscription | null>(null)
  const [pendingCancelTx, setPendingCancelTx] = React.useState<Subscription | null>(null)

  // Sync status filter pill → TanStack column filter
  React.useEffect(() => {
    setColumnFilters((prev) => {
      const without = prev.filter((f) => f.id !== "status")
      if (!statusFilter) return without
      return [...without, { id: "status", value: [statusFilter] as SubStatus[] }]
    })
  }, [statusFilter])

  const handleAction = React.useCallback((action: RowAction) => {
    switch (action.type) {
      case "toggle-status": {
        const { sub } = action
        const next: SubStatus = sub.status === "Active" ? "Canceled" : "Active"
        setData((prev) => prev.map((s) => s.id === sub.id ? { ...s, status: next } : s))
        toast.success(
          next === "Active" ? "Subscription enabled" : "Subscription disabled",
          { description: `${sub.memberName}'s subscription is now ${next.toLowerCase()}.` }
        )
        break
      }
      case "edit-renewal":
        setPendingRenewal(action.sub)
        setRenewalDate(new Date(action.sub.renewalDate + "T00:00:00"))
        break
      case "cancel":
        setPendingCancel(action.sub)
        break
      case "refund":
        setPendingRefund(action.sub)
        break
      case "cancel-tx":
        setPendingCancelTx(action.sub)
        break
    }
  }, [])

  const columns = React.useMemo(() => buildColumns(handleAction), [handleAction])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _colId, filterValue: string) => {
      const q = filterValue.toLowerCase()
      const s = row.original
      return (
        s.memberName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.memberCompany.toLowerCase().includes(q)
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  const { pageIndex, pageSize } = table.getState().pagination
  const totalFiltered = table.getFilteredRowModel().rows.length
  const pageStart = pageIndex * pageSize + 1
  const pageEnd = Math.min((pageIndex + 1) * pageSize, totalFiltered)

  const activeCount  = data.filter((s) => s.status === "Active").length
  const canceledCount = data.filter((s) => s.status === "Canceled").length
  const expiredCount = data.filter((s) => s.status === "Expired").length

  return (
    <AdminPageLayout>
      <div className="flex flex-col gap-8">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Subscription Management
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {data.length} total · {activeCount} active · {canceledCount} canceled · {expiredCount} expired
          </p>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────── */}
        <Tabs defaultValue="directory" className="w-full">
          <TabsList className="rounded-xl bg-muted/30 p-1">
            <TabsTrigger value="directory" className="rounded-lg px-4 py-1.5 text-sm font-medium">
              Subscription Directory
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg px-4 py-1.5 text-sm font-medium">
              Product Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-6">
            <ProductSettingsCard />
          </TabsContent>

          <TabsContent value="directory" className="mt-6">
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">Subscription Directory</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  All member subscriptions and their current state.
                </p>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, company…"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="h-8 rounded-full border-border bg-muted/40 pl-8 text-sm placeholder:text-muted-foreground/60 focus-visible:bg-background"
              />
            </div>

            {/* Status filter pills */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStatusFilter("")}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
              >
                <Badge
                  variant="outline"
                  className={`rounded-full text-[11px] font-semibold cursor-pointer transition-all ${
                    statusFilter === ""
                      ? "border-foreground/30 bg-foreground/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-foreground/20"
                  }`}
                >
                  All
                </Badge>
              </button>
              {ALL_STATUSES.map((s) => {
                const active = statusFilter === s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(active ? "" : s)}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                  >
                    <Badge
                      variant="outline"
                      className={`rounded-full text-[11px] font-semibold cursor-pointer transition-all ${
                        active
                          ? STATUS_CONFIG[s].className
                          : "border-border bg-background text-muted-foreground hover:border-foreground/20"
                      }`}
                    >
                      {s}
                    </Badge>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id} className="border-b border-border/60 hover:bg-transparent">
                    {hg.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="h-10 bg-muted/30 px-4 first:pl-5 last:pr-5"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length > 0 ? (
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
                      No subscriptions match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs tabular-nums text-muted-foreground">
              {totalFiltered > 0
                ? `Showing ${pageStart}–${pageEnd} of ${totalFiltered}`
                : "No results"}
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
              {Array.from({ length: table.getPageCount() }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => table.setPageIndex(i)}
                  className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2.5 text-xs font-medium transition-colors ${
                    pageIndex === i
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
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
        </div>
      </TabsContent>
    </Tabs>

      {/* ── Edit Renewal Date dialog ─────────────────────────────────────────── */}
      <Dialog
        open={pendingRenewal !== null}
        onOpenChange={(open) => { if (!open) setPendingRenewal(null) }}
      >
        <DialogContent className="w-auto max-w-none gap-0 p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="px-5 pt-5 pb-0">
            <DialogTitle className="text-sm font-semibold">Edit Renewal Date</DialogTitle>
            {pendingRenewal && (
              <p className="text-xs text-muted-foreground mt-0.5">{pendingRenewal.memberName}</p>
            )}
          </DialogHeader>
          <div className="px-3 py-2">
            <Calendar
              mode="single"
              selected={renewalDate}
              onSelect={setRenewalDate}
              className="min-w-[214px] min-h-[261px]"
            />
          </div>
          <DialogFooter className="flex-row justify-end gap-2 border-t border-border px-5 py-4">
            <DialogClose asChild>
              <Button variant="outline" size="sm" className="rounded-full font-semibold">
                Cancel
              </Button>
            </DialogClose>
            <Button
              size="sm"
              className="rounded-full font-semibold"
              disabled={!renewalDate}
              onClick={() => {
                if (!pendingRenewal || !renewalDate) return
                const iso = format(renewalDate, "yyyy-MM-dd")
                setData((prev) =>
                  prev.map((s) => s.id === pendingRenewal.id ? { ...s, renewalDate: iso } : s)
                )
                toast.success("Renewal date updated", {
                  description: `${pendingRenewal.memberName} → ${format(renewalDate, "MMM d, yyyy")}`,
                })
                setPendingRenewal(null)
              }}
            >
              Save Date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cancel Subscription dialog ───────────────────────────────────────── */}
      <AlertDialog
        open={pendingCancel !== null}
        onOpenChange={(open) => { if (!open) setPendingCancel(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{pendingCancel?.memberName}</span>'s
              subscription will be canceled. Auto-renewal will stop at the end of the current billing
              period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full font-semibold">Keep Active</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full font-semibold bg-amber-600 text-white hover:bg-amber-700"
              onClick={() => {
                if (!pendingCancel) return
                setData((prev) =>
                  prev.map((s) => s.id === pendingCancel.id ? { ...s, status: "Canceled" } : s)
                )
                toast.success("Subscription canceled", {
                  description: `${pendingCancel.memberName}'s auto-renewal has been stopped.`,
                })
                setPendingCancel(null)
              }}
            >
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Process Refund dialog ────────────────────────────────────────────── */}
      <AlertDialog
        open={pendingRefund !== null}
        onOpenChange={(open) => { if (!open) setPendingRefund(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Process refund?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRefund?.amountCents === 0 ? (
                <>
                  <span className="font-medium text-foreground">{pendingRefund.memberName}</span> has no
                  charge on file — there is nothing to refund.
                </>
              ) : (
                <>
                  <span className="font-medium text-foreground">
                    {formatAmount(pendingRefund?.amountCents ?? 0)}
                  </span>{" "}
                  will be refunded to{" "}
                  <span className="font-medium text-foreground">{pendingRefund?.memberName}</span> via
                  Stripe. This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full font-semibold"
              onClick={() => {
                if (!pendingRefund) return
                if (pendingRefund.amountCents === 0) {
                  toast.info("No charge to refund", {
                    description: `${pendingRefund.memberName} is on a free plan.`,
                  })
                } else {
                  toast.success("Refund processed", {
                    description: `${formatAmount(pendingRefund.amountCents)} refunded to ${pendingRefund.memberName}.`,
                  })
                }
                setPendingRefund(null)
              }}
            >
              {pendingRefund?.amountCents === 0 ? "Understood" : "Process Refund"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Cancel Transaction dialog ────────────────────────────────────────── */}
      <AlertDialog
        open={pendingCancelTx !== null}
        onOpenChange={(open) => { if (!open) setPendingCancelTx(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void billing period?</AlertDialogTitle>
            <AlertDialogDescription>
              The current billing cycle for{" "}
              <span className="font-medium text-foreground">{pendingCancelTx?.memberName}</span> will be
              voided. No charge will be collected for this period. Access remains until the period ends.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!pendingCancelTx) return
                toast.success("Transaction voided", {
                  description: `Billing period for ${pendingCancelTx.memberName} has been canceled.`,
                })
                setPendingCancelTx(null)
              }}
            >
              Void Transaction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AdminPageLayout>
  )
}
