"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetTitle, SheetClose } from "@/components/ui/sheet"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { X, ChevronUp, Calendar, Globe, Users, User } from "lucide-react"

export type BaseFilters = {
  dateFrom: string
  dateTo: string
  audiences: string[]
}

export type AudienceOptions = {
  contact: boolean
  circle: boolean
  community: boolean
}

const parseDate = (s: string) => s ? new Date(s + "T00:00:00") : undefined
const formatDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
const serializeDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

const toggleArrayItem = <T extends string>(arr: T[], item: T): T[] =>
  arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]

export function FilterAccordionSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Collapsible defaultOpen className="group/collapsible">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-4 bg-popover text-sm font-medium text-foreground">
        {title}
        <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=closed]/collapsible:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-6 pb-6 pt-3 flex flex-col gap-3 bg-popover">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

type FilterSidebarProps<T extends BaseFilters> = {
  open: boolean
  onClose: () => void
  onApply: (filters: T) => void
  appliedFilters: T
  defaultFilters: T
  audienceOptions: AudienceOptions
  extraSections?: (pending: T, toggle: (field: string, value: string) => void) => React.ReactNode
}

export function FilterSidebar<T extends BaseFilters>({
  open,
  onClose,
  onApply,
  appliedFilters,
  defaultFilters,
  audienceOptions,
  extraSections,
}: FilterSidebarProps<T>) {
  const [pending, setPending] = React.useState<T>(appliedFilters)
  const [dateFromOpen, setDateFromOpen] = React.useState(false)
  const [dateToOpen, setDateToOpen] = React.useState(false)

  const closeDatePickers = () => { setDateFromOpen(false); setDateToOpen(false) }

  React.useEffect(() => { if (!open) closeDatePickers() }, [open])

  React.useEffect(() => {
    if (open) setPending(appliedFilters)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (field: string, value: string) => {
    setPending((prev) => ({
      ...prev,
      [field]: toggleArrayItem(prev[field as keyof T] as string[], value),
    }))
  }

  const hasAnyAudience = audienceOptions.contact || audienceOptions.circle || audienceOptions.community

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="right" className="p-0 w-[380px] sm:max-w-[380px] flex flex-col [&>button:first-child]:hidden">
        <div className="flex items-center justify-between px-5 py-4 shrink-0">
          <SheetTitle className="text-2xl font-bold text-foreground">Filter by</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </SheetClose>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <div className="border border-border rounded-2xl divide-y divide-border">

            <div>
              <div className="flex w-full items-center justify-between px-4 py-4 text-sm font-medium text-foreground">
                End Date
              </div>
              <div className="px-6 pb-6 pt-3 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-medium">From</Label>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg border bg-popover px-3 h-9 text-sm text-left w-full hover:bg-accent transition-colors"
                    onClick={() => { setDateFromOpen((v) => !v); setDateToOpen(false) }}
                  >
                    <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className={pending.dateFrom ? "text-foreground" : "text-muted-foreground"}>
                      {pending.dateFrom ? formatDate(parseDate(pending.dateFrom)!) : "Pick a date"}
                    </span>
                    {pending.dateFrom && (
                      <X
                        className="h-3 w-3 ml-auto text-muted-foreground hover:text-foreground"
                        onClick={(e) => { e.stopPropagation(); setPending((p) => ({ ...p, dateFrom: "" })); setDateFromOpen(false) }}
                      />
                    )}
                  </button>
                  {dateFromOpen && (
                    <CalendarPicker
                      mode="single"
                      captionLayout="dropdown"
                      selected={parseDate(pending.dateFrom)}
                      onSelect={(d) => { if (d) { setPending((p) => ({ ...p, dateFrom: serializeDate(d) })); setDateFromOpen(false) } }}
                      className="rounded-lg border"
                    />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-medium">To</Label>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg border bg-popover px-3 h-9 text-sm text-left w-full hover:bg-accent transition-colors"
                    onClick={() => { setDateToOpen((v) => !v); setDateFromOpen(false) }}
                  >
                    <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className={pending.dateTo ? "text-foreground" : "text-muted-foreground"}>
                      {pending.dateTo ? formatDate(parseDate(pending.dateTo)!) : "Pick a date"}
                    </span>
                    {pending.dateTo && (
                      <X
                        className="h-3 w-3 ml-auto text-muted-foreground hover:text-foreground"
                        onClick={(e) => { e.stopPropagation(); setPending((p) => ({ ...p, dateTo: "" })); setDateToOpen(false) }}
                      />
                    )}
                  </button>
                  {dateToOpen && (
                    <CalendarPicker
                      mode="single"
                      captionLayout="dropdown"
                      selected={parseDate(pending.dateTo)}
                      onSelect={(d) => { if (d) { setPending((p) => ({ ...p, dateTo: serializeDate(d) })); setDateToOpen(false) } }}
                      className="rounded-lg border"
                    />
                  )}
                </div>
              </div>
            </div>

            {hasAnyAudience && (
              <FilterAccordionSection title="Audience">
                {audienceOptions.community && (
                  <div className="flex items-center gap-3">
                    <Checkbox id="filter-audience-community" checked={pending.audiences.includes("community")} onCheckedChange={() => toggle("audiences", "community")} />
                    <Label htmlFor="filter-audience-community" className="cursor-pointer font-normal">
                      <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-100 gap-1 font-semibold text-blue-800 leading-4">
                        <Globe className="h-3 w-3" />Community
                      </Badge>
                    </Label>
                  </div>
                )}
                {audienceOptions.circle && (
                  <div className="flex items-center gap-3">
                    <Checkbox id="filter-audience-circle" checked={pending.audiences.includes("circle")} onCheckedChange={() => toggle("audiences", "circle")} />
                    <Label htmlFor="filter-audience-circle" className="cursor-pointer font-normal">
                      <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-100 gap-1 font-semibold text-blue-800 leading-4">
                        <Users className="h-3 w-3" />My Circle
                      </Badge>
                    </Label>
                  </div>
                )}
                {audienceOptions.contact && (
                  <div className="flex items-center gap-3">
                    <Checkbox id="filter-audience-contact" checked={pending.audiences.includes("contact")} onCheckedChange={() => toggle("audiences", "contact")} />
                    <Label htmlFor="filter-audience-contact" className="cursor-pointer font-normal">
                      <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-100 gap-1 font-semibold text-blue-800 leading-4">
                        <User className="h-3 w-3" />My Contact
                      </Badge>
                    </Label>
                  </div>
                )}
              </FilterAccordionSection>
            )}

            {extraSections?.(pending, toggle)}

          </div>
        </div>

        <div className="flex items-center justify-between border-t px-5 py-4 shrink-0">
          <Button
            variant="ghost"
            className="rounded-full font-semibold gap-2 text-muted-foreground"
            onClick={() => setPending(defaultFilters)}
            type="button"
          >
            Reset
          </Button>
          <Button
            className="rounded-full font-semibold"
            onClick={() => { onApply(pending); onClose() }}
            type="button"
          >
            Apply filter
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
