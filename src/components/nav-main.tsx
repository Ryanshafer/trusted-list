"use client"

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
    isActive?: boolean
    children?: { title: string; url: string }[]
  }[]
}) {
  return (
    <SidebarGroup className="gap-4">
      <SidebarMenu className="gap-4">
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={item.isActive}
              asChild
              className="text-base font-semibold"
            >
              <a href={item.url}>
                <span>{item.title}</span>
              </a>
            </SidebarMenuButton>
            {item.children && item.children.length > 0 ? (
              <div className="ml-4 mt-2 flex flex-col gap-1 border-l border-border/60 pl-3">
                {item.children.map((child) => (
                  <a
                    key={child.title}
                    href={child.url}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {child.title}
                  </a>
                ))}
              </div>
            ) : null}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
