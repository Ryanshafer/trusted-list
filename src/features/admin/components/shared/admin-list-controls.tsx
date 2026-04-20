import type * as React from "react"
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function AdminSearchField({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
}) {
  return (
    <div className={cn("relative flex-1 min-w-[200px] max-w-sm", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 rounded-full border-border bg-muted/40 pl-8 pr-8 text-sm placeholder:text-muted-foreground/60 focus-visible:bg-background"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full text-muted-foreground hover:text-foreground"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}

export function AdminFilterButton({
  count,
  onClick,
}: {
  count: number
  onClick: () => void
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("h-8 rounded-full gap-2 font-semibold text-xs", count > 0 && "border-primary text-primary")}
      onClick={onClick}
    >
      <SlidersHorizontal className="h-3.5 w-3.5" />
      Filters
      {count > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/10 px-1 text-[10px] font-bold text-primary">
          {count}
        </span>
      )}
    </Button>
  )
}

export function SortableHeaderButton({
  label,
  onClick,
  icon,
}: {
  label: string
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:bg-transparent hover:text-foreground"
      onClick={onClick}
    >
      {label}
      {icon}
    </Button>
  )
}

export function AdminPagination({
  pageIndex,
  pageCount,
  pageStart,
  pageEnd,
  totalCount,
  label = "member",
  canPreviousPage,
  canNextPage,
  onPreviousPage,
  onNextPage,
  onSetPage,
}: {
  pageIndex: number
  pageCount: number
  pageStart: number
  pageEnd: number
  totalCount: number
  label?: string
  canPreviousPage: boolean
  canNextPage: boolean
  onPreviousPage: () => void
  onNextPage: () => void
  onSetPage: (pageIndex: number) => void
}) {
  if (totalCount === 0 || pageCount <= 1) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs tabular-nums text-muted-foreground">
        Showing {pageStart}-{pageEnd} of {totalCount} {label}{totalCount !== 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={onPreviousPage}
          disabled={!canPreviousPage}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: pageCount }, (_, index) => (
            <Button
              key={index}
              variant={pageIndex === index ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-full text-xs font-medium"
              onClick={() => onSetPage(index)}
            >
              {index + 1}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={onNextPage}
          disabled={!canNextPage}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
