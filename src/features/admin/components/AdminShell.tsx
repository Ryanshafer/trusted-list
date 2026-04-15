"use client"

import * as React from "react"
import {
  Users,
  ClipboardList,
  CheckSquare,
  CreditCard,
  Settings,
  Bell,
  Search,
  PanelLeft,
  ChevronsUpDown,
  LogOut,
  UserRound,
  Moon,
  Sun,
  ChevronRight,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Clock,
  LayoutDashboard,
  Lightbulb,
  ShieldAlert,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import currentUserData from "../../../../data/current-user.json"
import adminNotificationsRaw from "../../../../data/admin-notifications.json"
import approvalQueueData from "../../../../data/approval-queue.json"
import { useModerationCount } from "@/features/admin/hooks/useModerationStore"
import { useApprovalQueueCount } from "@/features/admin/hooks/useApprovalQueueStore"
import { NotificationPanel, type Notification } from "@/features/notifications/components/NotificationPanel"

// ── Constants ─────────────────────────────────────────────────────────────────

const base = import.meta.env.BASE_URL ?? "/"

const NAV_ITEMS = [
  { title: "Dashboard",      url: `${base}admin`,               icon: LayoutDashboard, badge: null as number | null, destructiveBadge: false },
  { title: "Members",        url: `${base}admin/members`,       icon: Users,         badge: null as number | null, destructiveBadge: false },
  { title: "Approval Queue", url: `${base}admin/approvals`,     icon: ClipboardList, badge: null as number | null, destructiveBadge: false },
  { title: "Moderation",     url: `${base}admin/moderation`,    icon: ShieldAlert,   badge: null as number | null, destructiveBadge: true  },
  // { title: "Tasks",          url: `${base}admin/tasks`,         icon: CheckSquare,   badge: 7    as number | null, destructiveBadge: false },
  // { title: "Subscriptions",  url: `${base}admin/subscriptions`, icon: CreditCard,    badge: null as number | null, destructiveBadge: false },
  { title: "Skills",         url: `${base}admin/skills`,        icon: Lightbulb,     badge: null as number | null, destructiveBadge: false },
  { title: "Settings",       url: `${base}admin/settings`,      icon: Settings,      badge: null as number | null, destructiveBadge: false },
]

// ── Sidebar: brand header ─────────────────────────────────────────────────────

function AdminSidebarHeader() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <SidebarHeader className={isCollapsed ? "items-center px-0 py-5" : "px-4 py-5"}>
      <a
        href={`${base}admin`}
        className={`flex flex-col items-center gap-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring ${isCollapsed ? "justify-center" : ""}`}
      >
        <div className="flex items-center gap-2.5">
          <img
            src={`${base}logo-light.svg`}
            height={28}
            width={28}
            alt="The Trusted List"
            className="h-7 w-auto shrink-0 dark:hidden"
          />
          <img
            src={`${base}logo-dark.svg`}
            height={28}
            width={28}
            alt="The Trusted List"
            className="hidden h-7 w-auto shrink-0 dark:block"
          />
        </div>
        {!isCollapsed && (
          <span className="text-[10px] font-medium tracking-widest text-sidebar-foreground/40 uppercase">
            Admin
          </span>
        )}
      </a>
    </SidebarHeader>
  )
}

// ── Sidebar: nav ──────────────────────────────────────────────────────────────

function AdminNav() {
  const [currentPath, setCurrentPath] = React.useState("")
  const moderationCount = useModerationCount()
  const approvalQueueCount = useApprovalQueueCount()

  React.useEffect(() => {
    setCurrentPath(window.location.pathname)
  }, [])

  const isActive = (url: string) =>
    currentPath.replace(/\/$/, "") === url.replace(/\/$/, "")

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[11px] font-medium tracking-wider uppercase text-sidebar-foreground/40">
        Navigation
      </SidebarGroupLabel>
      <SidebarMenu>
        {NAV_ITEMS.map((item) => {
          const badge = item.title === "Approval Queue"
            ? (approvalQueueCount > 0 ? approvalQueueCount : null)
            : item.destructiveBadge
              ? (moderationCount > 0 ? moderationCount : null)
              : item.badge

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={isActive(item.url)}
                asChild
                className="h-9 text-[13.5px] font-normal data-[active=true]:font-semibold"
              >
                <a href={item.url}>
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
              {badge !== null && (
                <SidebarMenuBadge>
                  {item.destructiveBadge ? (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-semibold tabular-nums text-destructive-foreground">
                      {badge}
                    </span>
                  ) : (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[11px] font-semibold tabular-nums text-muted-foreground">
                      {badge}
                    </span>
                  )}
                </SidebarMenuBadge>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

// ── Sidebar: collapse toggle ──────────────────────────────────────────────────

function CollapseButton() {
  const { toggleSidebar, state } = useSidebar()
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      title={state === "collapsed" ? "Expand sidebar" : "Collapse sidebar"}
      className="absolute bottom-20 right-0 z-20 flex h-7 w-7 translate-x-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <PanelLeft
        className={`h-3.5 w-3.5 transition-transform ${state === "collapsed" ? "rotate-180" : ""}`}
      />
    </button>
  )
}

// ── Sidebar: back link ────────────────────────────────────────────────────────

function AdminSidebarFooter() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  return (
    <SidebarFooter className="pb-4">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Back to app"
            asChild
            className="text-[13px] text-muted-foreground hover:text-foreground"
          >
            <a href={`${base}`}>
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Back to app</span>}
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}

// ── Admin sidebar (composed) ──────────────────────────────────────────────────

function AdminSidebar() {
  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar px-2">
      <AdminSidebarHeader />
      <SidebarContent>
        <AdminNav />
      </SidebarContent>
      <AdminSidebarFooter />
      <CollapseButton />
    </Sidebar>
  )
}

// ── Topbar ────────────────────────────────────────────────────────────────────

function AdminTopbar() {
  const user = {
    firstName: currentUserData.firstName,
    lastName: currentUserData.lastName,
    email: currentUserData.email,
    avatar: currentUserData.avatarUrl ?? "",
  }
  const fullName = `${user.firstName} ${user.lastName}`
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()

  const [notifications, setNotifications] = React.useState<Notification[]>(
    adminNotificationsRaw as Notification[]
  )
  const [panelOpen, setPanelOpen] = React.useState(false)
  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkRead = React.useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const handleMarkAllRead = React.useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const [theme, setTheme] = React.useState<"light" | "dark">("light")

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem("trusted-list-theme") as "light" | "dark" | null
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    const root = document.documentElement
    const initial = stored ?? (root.classList.contains("dark") ? "dark" : prefersDark)
    setTheme(initial)
  }, [])

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const root = document.documentElement
    root.classList.toggle("dark", theme === "dark")
    window.localStorage.setItem("trusted-list-theme", theme)
  }, [theme])

  return (
    <>
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      {/* Mobile sidebar trigger */}
      <SidebarTrigger className="shrink-0 lg:hidden" />

      {/* Divider (mobile only) */}
      <div className="h-5 w-px bg-border lg:hidden" aria-hidden />

      {/* Search */}
      <div className="relative w-full max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search members, tasks…"
          className="h-8 rounded-full border-border bg-muted/40 pl-8 text-sm placeholder:text-muted-foreground/60 focus-visible:bg-background"
        />
      </div>

      {/* Right cluster */}
      <div className="ml-auto flex items-center gap-1">
        {/* Notification bell */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 rounded-full"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
                onClick={() => setPanelOpen(true)}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span
                    aria-hidden
                    className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold tabular-nums text-destructive-foreground ring-1 ring-background"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Notifications</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* User profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-8 items-center gap-2 rounded-full px-1.5 pr-2.5 hover:bg-muted/60"
            >
              <Avatar className="h-6 w-6 rounded-full border border-border">
                <AvatarImage src={user.avatar} alt={fullName} className="object-cover" />
                <AvatarFallback className="rounded-full text-[10px] font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:block">{user.firstName}</span>
              <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 rounded-xl" sideOffset={8}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2.5 px-2 py-2">
                <Avatar className="h-8 w-8 rounded-full border border-border">
                  <AvatarImage src={user.avatar} alt={fullName} className="object-cover" />
                  <AvatarFallback className="rounded-full text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold">{fullName}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <a href="/trusted-list/profile">
                  <UserRound className="h-4 w-4" />
                  My Profile
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>

    <NotificationPanel
      open={panelOpen}
      onOpenChange={setPanelOpen}
      notifications={notifications}
      onMarkRead={handleMarkRead}
      onMarkAllRead={handleMarkAllRead}
    />
    </>
  )
}

// ── Dashboard: stat card ──────────────────────────────────────────────────────

type Trend = "up" | "down" | "neutral"

function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon: Icon,
  trend,
}: {
  label: string
  value: string
  change: string
  changeLabel: string
  icon: React.ElementType
  trend: Trend
}) {
  const trendColor =
    trend === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : trend === "down"
      ? "text-destructive"
      : "text-muted-foreground"

  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs">
        <span className={`font-medium ${trendColor}`}>{change}</span>{" "}
        <span className="text-muted-foreground">{changeLabel}</span>
      </p>
    </div>
  )
}

// ── Dashboard: queue row ──────────────────────────────────────────────────────

function QueueRow({
  name,
  email,
  type,
  time,
}: {
  name: string
  email: string
  type: string
  time: string
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()

  return (
    <div className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40">
      <Avatar className="h-7 w-7 shrink-0 rounded-full border border-border">
        <AvatarFallback className="rounded-full text-[10px] font-semibold">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
      <Badge
        variant="outline"
        className="hidden shrink-0 rounded-full text-[11px] font-medium sm:flex"
      >
        {type}
      </Badge>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{time}</span>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  )
}

// ── Dashboard: main content ───────────────────────────────────────────────────

function DashboardContent() {
  const approvalQueueCount = useApprovalQueueCount()
  const stats = [
    {
      label: "Total Members",
      value: "2,847",
      change: "+12%",
      changeLabel: "from last month",
      icon: Users,
      trend: "up" as Trend,
    },
    {
      label: "Pending Approvals",
      value: approvalQueueCount.toString(),
      change: "+3",
      changeLabel: "since yesterday",
      icon: ClipboardList,
      trend: "down" as Trend,
    },
    {
      label: "Active Tasks",
      value: "138",
      change: "−7%",
      changeLabel: "from last week",
      icon: CheckSquare,
      trend: "neutral" as Trend,
    },
    {
      label: "Active Subscriptions",
      value: "1,204",
      change: "+5%",
      changeLabel: "from last month",
      icon: CreditCard,
      trend: "up" as Trend,
    },
  ]

  // Transform approval queue data to match QueueRow format
  const queueRows = approvalQueueData.map((item) => {
    const appliedDate = new Date(item.appliedAt)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - appliedDate.getTime()) / (1000 * 60))

    let timeAgo
    if (diffMinutes < 60) {
      timeAgo = `${diffMinutes}m ago`
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60)
      timeAgo = `${hours}h ago`
    } else {
      const days = Math.floor(diffMinutes / 1440)
      timeAgo = `${days}d ago`
    }

    return {
      name: item.applicant.name,
      email: item.applicant.email,
      type: "New Member", // All items in approval queue are new members
      time: timeAgo
    }
  }).slice(0, 5) // Show only first 5 items

  const activity = [
    {
      icon: UserCheck,
      label: "18 new members approved",
      time: "Today, 9:41 AM",
      colorClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    },
    {
      icon: AlertCircle,
      label: "3 flagged profiles need review",
      time: "Today, 8:15 AM",
      colorClass: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    },
    {
      icon: TrendingUp,
      label: "Membership hit monthly record",
      time: "Yesterday, 6:00 PM",
      colorClass: "bg-primary/10 text-primary",
    },
    {
      icon: Clock,
      label: "Scheduled maintenance at midnight",
      time: "Yesterday, 3:30 PM",
      colorClass: "bg-muted/60 text-muted-foreground",
    },
    {
      icon: CreditCard,
      label: "12 subscriptions renewed",
      time: "Yesterday, 2:00 PM",
      colorClass: "bg-primary/10 text-primary",
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Welcome back. Here's what's happening today.
          </p>
        </div>
        <Button className="rounded-full font-semibold" size="sm">
          Export report
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Two-column panel row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Approval queue */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Approval Queue</h2>
              <p className="text-xs text-muted-foreground">{approvalQueueCount} items waiting for review</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded-full px-3 text-xs font-semibold"
              asChild
            >
              <a href={`${base}admin/approvals`}>
                View all <ChevronRight className="h-3 w-3" />
              </a>
            </Button>
          </div>
          <div className="px-2 py-2">
            {queueRows.map((row) => (
              <QueueRow key={row.email} {...row} />
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3.5">
            <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
            <p className="text-xs text-muted-foreground">System events in the last 24h</p>
          </div>
          <div className="px-2 py-2">
            {activity.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40"
              >
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${item.colorClass}`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-foreground">{item.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── AdminPageLayout — shared layout shell (export for page-level components) ──

export function AdminPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/20">
        <AdminSidebar />
        <SidebarInset className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden bg-background">
          <AdminTopbar />
          <div className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
            <div className="mx-auto w-full max-w-6xl">
              {children}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

// ── AdminShell (dashboard page, default export) ───────────────────────────────

export default function AdminShell() {
  return (
    <AdminPageLayout>
      <DashboardContent />
    </AdminPageLayout>
  )
}
