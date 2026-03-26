"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { BadgeHelp, ChevronRight, Search, Tag } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import allRequests from "../../../data/requests.json"

type PersonResult = {
  type: "person"
  name: string
  avatarUrl: string | null
  trustedFor: string | null
  slug: string
}

type RequestResult = {
  type: "request"
  id: string
  summary: string
}

type CategoryResult = {
  type: "category"
  name: string
  slug: string
}

type SearchResult = PersonResult | RequestResult | CategoryResult

function nameSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-")
}

function useSearchResults(query: string): SearchResult[] {
  return React.useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const results: SearchResult[] = []

    const personSeen = new Set<string>()
    for (const r of allRequests) {
      if (personSeen.size >= 3) break
      if (personSeen.has(r.name)) continue
      if (r.name.toLowerCase().includes(q) || r.trustedFor?.toLowerCase().includes(q)) {
        personSeen.add(r.name)
        results.push({
          type: "person",
          name: r.name,
          avatarUrl: r.avatarUrl ?? null,
          trustedFor: r.trustedFor ?? null,
          slug: nameSlug(r.name),
        })
      }
    }

    const catSeen = new Set<string>()
    for (const r of allRequests) {
      if (catSeen.size >= 3) break
      if (!catSeen.has(r.category) && r.category.toLowerCase().includes(q)) {
        catSeen.add(r.category)
        results.push({ type: "category", name: r.category, slug: r.category.toLowerCase() })
      }
    }

    let reqCount = 0
    for (const r of allRequests) {
      if (reqCount >= 3) break
      if (r.requestSummary?.toLowerCase().includes(q) || r.request.toLowerCase().includes(q)) {
        reqCount++
        results.push({
          type: "request",
          id: r.id,
          summary: r.requestSummary ?? r.request.slice(0, 80),
        })
      }
    }

    return results
  }, [query])
}

interface SearchCommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchCommandPalette({ open, onOpenChange }: SearchCommandPaletteProps) {
  const [query, setQuery] = React.useState("")

  React.useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  const results = useSearchResults(query)
  const hasResults = results.length > 0

  function navigate(url: string) {
    onOpenChange(false)
    window.location.href = url
  }

  const personResults = results.filter((r): r is PersonResult => r.type === "person")
  const requestResults = results.filter((r): r is RequestResult => r.type === "request")
  const categoryResults = results.filter((r): r is CategoryResult => r.type === "category")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden rounded-xl p-0 shadow-md [&>button]:hidden">
        <Command shouldFilter={false} className="rounded-xl">
          <div
            className={cn(
              "flex items-center gap-3 px-6 py-6",
              hasResults && "border-b border-border pb-4"
            )}
          >
            <div className="flex flex-1 items-center gap-3 rounded-lg bg-background px-3 py-[9.5px]">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <CommandPrimitive.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search members, requests, and topics"
                className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
            <kbd className="inline-flex items-center rounded-md border border-border px-1.5 py-1 text-xs text-muted-foreground">
              esc
            </kbd>
          </div>

          {query && (
            <CommandList className="max-h-[400px] py-6">
              <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
                No results found.
              </CommandEmpty>

              {personResults.length > 0 && (
                <CommandGroup>
                  {personResults.map((r) => {
                    const initials = r.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                    return (
                      <CommandItem
                        key={`person-${r.slug}`}
                        value={`person-${r.slug}`}
                        onSelect={() => navigate(`/trusted-list/members/${r.slug}`)}
                        className="group px-6 py-0 data-[selected=true]:!bg-transparent"
                      >
                        <div className="flex flex-1 min-h-14 items-center justify-between rounded-lg p-2 hover:bg-card group-data-[selected=true]:bg-card">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-10 w-10 shrink-0 rounded-full border-2 border-background shadow-md">
                              <AvatarImage
                                src={r.avatarUrl ?? undefined}
                                alt={r.name}
                                className="object-cover"
                              />
                              <AvatarFallback className="rounded-full">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-base font-semibold text-popover-foreground leading-6">
                                {r.name}
                              </span>
                              {r.trustedFor && (
                                <span className="text-xs text-muted-foreground leading-4">
                                  Trusted for {r.trustedFor}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}

              {requestResults.length > 0 && (
                <CommandGroup>
                  {requestResults.map((r) => (
                    <CommandItem
                      key={`request-${r.id}`}
                      value={`request-${r.id}`}
                      onSelect={() => navigate(`/trusted-list/requests/view/${r.id}`)}
                      className="group px-6 py-0 data-[selected=true]:!bg-transparent"
                    >
                      <div className="flex flex-1 min-h-14 items-center justify-between rounded-lg p-2 hover:bg-card group-data-[selected=true]:bg-card">
                        <div className="flex items-center gap-2">
                          <BadgeHelp className="h-6 w-6 shrink-0 text-muted-foreground" />
                          <span className="text-base font-semibold text-popover-foreground leading-6">
                            {r.summary}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {categoryResults.length > 0 && (
                <CommandGroup>
                  {categoryResults.map((r) => (
                    <CommandItem
                      key={`category-${r.slug}`}
                      value={`category-${r.slug}`}
                      onSelect={() => navigate(`/trusted-list/requests/${r.slug}`)}
                      className="group px-6 py-0 data-[selected=true]:!bg-transparent"
                    >
                      <div className="flex flex-1 min-h-14 items-center justify-between rounded-lg p-2 hover:bg-card group-data-[selected=true]:bg-card">
                        <div className="flex items-center gap-2">
                          <Tag className="h-6 w-6 shrink-0 text-muted-foreground" />
                          <span className="text-base font-semibold text-popover-foreground leading-6">
                            {r.name}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          )}
        </Command>
      </DialogContent>
    </Dialog>
  )
}
