"use client"

import * as React from "react"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Moon,
  Settings,
  Sparkles,
  Sun,
  UserRound,
  Shield,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { NotificationPanel, type Notification } from "@/features/notifications/components/NotificationPanel"
import type { NotificationActor, NotificationType } from "@/features/notifications/utils/notification-utils"
import { AccountSettingsDialog } from "@/features/account"
import type { AccountSettingsDialogProps } from "@/features/account/components/AccountSettingsDialog"
import notificationsRaw from "../../data/notifications.json"
import currentUser from "../../data/current-user.json"

type CurrentUserSettings = Pick<
  typeof currentUser,
  "notificationSettings" | "blockedUsers"
>

type RawNotification = (typeof notificationsRaw)[number]
type NotificationPayload = Notification["payload"]

function isNotificationType(value: string): value is NotificationType {
  return [
    "circle_join_request",
    "direct_help_request",
    "skill_validated",
    "volunteer_offer",
    "circle_new_request",
    "new_message",
    "feedback_received",
    "recommendation_outcome",
    "content_flagged",
    "moderation_decision",
  ].includes(value)
}

function normalizeNotificationPayload(payload: RawNotification["payload"]): NotificationPayload {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, value ?? undefined])
  )
}

function normalizeNotificationActor(actor: RawNotification["actor"]): NotificationActor | null {
  if (!actor) {
    return null
  }

  return {
    id: actor.id,
    name: actor.name,
    avatarUrl: actor.avatarUrl,
    trustedFor: actor.trustedFor,
  }
}

function normalizeNotifications(rawNotifications: RawNotification[]): Notification[] {
  return rawNotifications.flatMap((notification) => {
    if (!isNotificationType(notification.type)) {
      return []
    }

    return [{
      id: notification.id,
      type: notification.type,
      read: notification.read,
      relativeTime: notification.relativeTime,
      actor: normalizeNotificationActor(notification.actor),
      payload: normalizeNotificationPayload(notification.payload),
    }]
  })
}

const currentUserSettings = currentUser as CurrentUserSettings
const initialNotifications = normalizeNotifications(notificationsRaw)

export function NavUser({
  user,
  isAdmin = false,
}: {
  user: {
    firstName: string
    lastName: string
    email: string
    avatar: string
  }
  isAdmin?: boolean
}) {
  const { isMobile } = useSidebar()
  const fullName = `${user.firstName} ${user.lastName}`
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()

  const [theme, setTheme] = React.useState<"light" | "dark">("light")
  const [notifOpen, setNotifOpen] = React.useState(false)
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState<Notification[]>(initialNotifications)

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkRead = React.useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const handleMarkAllRead = React.useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

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
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    window.localStorage.setItem("trusted-list-theme", theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"))
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                {/* Avatar — unread dot on the badge is purely visual */}
                <div className="relative shrink-0">
                  <Avatar className="h-8 w-8 rounded-full border-2 border-background shadow-md">
                    <AvatarImage src={user.avatar} alt={fullName} className="object-cover" />
                    <AvatarFallback className="rounded-full">{initials}</AvatarFallback>
                  </Avatar>
                  {unreadCount > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive ring-1 ring-sidebar"
                    />
                  )}
                </div>

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{fullName}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              {/* Identity header */}
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-full border-2 border-background shadow-md">
                    <AvatarImage src={user.avatar} alt={fullName} className="object-cover" />
                    <AvatarFallback className="rounded-full">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{fullName}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <a href="/trusted-list/profile">
                    <UserRound />
                    My Profile
                  </a>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <a href="/trusted-list/admin">
                      <Shield />
                      Admin
                    </a>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                {/* Notifications — opens the Sheet panel */}
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault()
                    setNotifOpen(true)
                  }}
                >
                  <Bell />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-bold tabular-nums text-primary-foreground">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem onClick={toggleTheme}>
                  {theme === "dark" ? <Sun /> : <Moon />}
                  {theme === "dark" ? "Set theme to light" : "Set theme to dark"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault()
                    setSettingsOpen(true)
                  }}
                >
                  <Settings />
                  Account Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem>
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <NotificationPanel
        open={notifOpen}
        onOpenChange={setNotifOpen}
        notifications={notifications}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
      />

      <AccountSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        user={user}
        initialNotif={currentUserSettings.notificationSettings}
        initialBlockedUsers={currentUserSettings.blockedUsers}
      />
    </>
  )
}
