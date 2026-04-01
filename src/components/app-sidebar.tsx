"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { BadgeHelp, CircleUser, MessagesSquare, PanelLeft, Search, ShieldQuestion } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { SearchCommandPalette } from "@/features/search/SearchCommandPalette"
import currentUserData from "../../data/current-user.json"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"

const navLinks: { title: string; url: string; icon: LucideIcon }[] = [
  { title: "My Help Opportunities", url: "/trusted-list/", icon: BadgeHelp },
  { title: "Browse Help Requests", url: "/trusted-list/requests", icon: ShieldQuestion },
  { title: "Profile", url: "/trusted-list/profile", icon: CircleUser },
  { title: "Help Activity", url: "/trusted-list/interactions", icon: MessagesSquare }
]

const user = {
  firstName: currentUserData.firstName,
  lastName: currentUserData.lastName,
  email: currentUserData.email,
  avatar: currentUserData.avatarUrl,
}

const base = import.meta.env.BASE_URL ?? "/"
const logoLight = `${base}logo-light.svg`
const logoDark = `${base}logo-dark.svg`

function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  const { state } = useSidebar()
  const [isMac, setIsMac] = React.useState(true)

  React.useEffect(() => {
    setIsMac(navigator.userAgent.includes("Mac"))
  }, [])

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpen()
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [onOpen])

  if (state === "collapsed") {
    return (
      <button
        type="button"
        onClick={onOpen}
        title="Search"
        className="flex h-8 w-8 items-center justify-center rounded-full text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <Search className="h-4 w-4" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-2 rounded-full border border-border bg-card px-3 py-[7.5px] text-sm text-muted-foreground transition-colors hover:bg-card/80"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left">Search</span>
      <span className="flex items-center gap-1">
        <kbd className="inline-flex items-center justify-center rounded border border-border bg-background px-1 py-0.5 text-xs leading-4">
          {isMac ? "⌘" : "Ctrl"}
        </kbd>
        <kbd className="inline-flex w-5 items-center justify-center rounded border border-border bg-background px-1 py-0.5 text-xs leading-4">
          K
        </kbd>
      </span>
    </button>
  )
}

function AppSidebarHeader({ onSearchOpen }: { onSearchOpen: () => void }) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <SidebarHeader className={isCollapsed ? "items-center py-6 gap-4" : "space-y-4 px-4 py-6"}>
      {!isCollapsed && (
        <div className="flex items-center gap-3">
          <img
            src={logoLight}
            height={34}
            width={34}
            alt="The Trusted List"
            className="h-[34px] w-auto dark:hidden"
          />
          <img
            src={logoDark}
            height={34}
            width={34}
            alt="The Trusted List"
            className="hidden h-[34px] w-auto dark:block"
          />
        </div>
      )}
      <SearchTrigger onOpen={onSearchOpen} />
    </SidebarHeader>
  )
}

function CollapseButton() {
  const { toggleSidebar, state } = useSidebar()
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      title={state === "collapsed" ? "Expand sidebar" : "Collapse sidebar"}
      className="absolute bottom-20 right-0 z-20 flex h-8 w-8 translate-x-1/2 items-center justify-center rounded-full border border-border bg-background text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <PanelLeft className={`h-4 w-4 transition-transform ${state === "collapsed" ? "rotate-180" : ""}`} />
    </button>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [searchOpen, setSearchOpen] = React.useState(false)
  const handleSearchOpen = React.useCallback(() => setSearchOpen(true), [])

  return (
    <Sidebar collapsible="icon" {...props}>
      <AppSidebarHeader onSearchOpen={handleSearchOpen} />
      <SidebarContent>
        <NavMain items={navLinks} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <CollapseButton />
      <SearchCommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </Sidebar>
  )
}
