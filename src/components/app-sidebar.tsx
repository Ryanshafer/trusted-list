"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { ListChecks, Search, SquareTerminal, UserCheck, Users } from "lucide-react"

import { Input } from "@/components/ui/input"
import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const navLinks: {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
}[] = [
  { title: "Dashboard", url: "#", icon: SquareTerminal, isActive: true },
  { title: "People I trust", url: "#", icon: Users },
  { title: "People who trust me", url: "#", icon: UserCheck },
  { title: "Your Shortlists", url: "#", icon: ListChecks },
]

const user = {
  name: "Ryan Shafer",
  email: "ryan.shafer@gmail.com",
  avatar: "https://media.licdn.com/dms/image/v2/C4E03AQGoFA-9wu70Og/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1517731083735?e=1764806400&v=beta&t=BxRL0Gye0EILeBGBt-aZi_VNXi5BZNxK6KnxuXQGgXk",
}

const logoLight = new URL("../assets/logo-light.svg", import.meta.url).href
const logoDark = new URL("../assets/logo-dark.svg", import.meta.url).href

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="space-y-4 px-4 py-6">
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
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search the list"
            className="h-10 rounded-full border border-border bg-background pl-9 text-sm"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navLinks} />
        <NavProjects projects={[]} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
