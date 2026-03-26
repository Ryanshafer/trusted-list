"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
  }[]
}) {
  const [currentPath, setCurrentPath] = React.useState("")

  React.useEffect(() => {
    setCurrentPath(window.location.pathname)
  }, [])

  const isActiveLink = (url: string) => {
    const normalize = (p: string) => p.replace(/\/$/, "")
    return normalize(currentPath) === normalize(url)
  }

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={isActiveLink(item.url)}
              asChild
              className="h-8 text-base font-normal data-[active=true]:font-semibold"
            >
              <a href={item.url}>
                {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                <span>{item.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
