import React from "react";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  SlidersHorizontal,
  Search,
  X,
} from "lucide-react";
import { LayoutToggle } from "@/components/LayoutToggle";

export const FilterBar = ({
  layout,
  onLayoutChange,
  showFilter = true,
  onOpenFilterSidebar,
  isFiltered = false,
  activeFilterCount = 0,
  projection,
  primaryAction,
  searchValue,
  onSearchChange,
}: {
  layout: "grid" | "list";
  onLayoutChange: (layout: "grid" | "list") => void;
  showFilter?: boolean;
  onOpenFilterSidebar?: () => void;
  isFiltered?: boolean;
  activeFilterCount?: number;
  projection?: {
    label: string;
    value: string;
    sublabel?: string;
    tone?: "success" | "info";
  };
  primaryAction?: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}) => {
  return (
    <section className="mb-6 flex items-center justify-between rounded-2xl border bg-card px-4 py-3 shadow-sm">
      {/* Left: projection + primary action + search */}
      <div className="flex items-center gap-4">
        {projection && (
          <div
            className={`flex items-center gap-3 rounded-lg border px-3 py-2 shadow-sm $
              ${
              projection.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-primary-25 bg-primary-10 text-primary"
            }`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/75">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-xs font-semibold uppercase tracking-wide">
                {projection.label}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold leading-tight">
                  {projection.value}
                </span>
                {projection.sublabel && (
                  <span className="text-[11px] text-muted-foreground leading-tight">
                    {projection.sublabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        {primaryAction}
        {onSearchChange !== undefined && (
          <div className="flex items-center gap-2 h-9 w-80 px-3 rounded-full border bg-background">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search requests"
              value={searchValue ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground outline-none"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right: filter + layout toggle */}
      <div className="flex items-center gap-4">
        {showFilter && onOpenFilterSidebar && (
          <Button
            variant="outline"
            className={`h-9 rounded-full font-semibold gap-2 bg-background $
              ${
              isFiltered ? "border-primary text-primary" : ""
            }`}
            onClick={onOpenFilterSidebar}
          >
            <SlidersHorizontal size={16} />
            Filter requests
            {activeFilterCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full text-[10px] font-bold px-0.5 bg-primary/10 text-primary">
                {activeFilterCount}
              </span>
            )}
          </Button>
        )}

        {/* Layout toggle pill */}
        <LayoutToggle
          layout={layout}
          onChange={onLayoutChange}
          className="border bg-background px-1.5"
        />
      </div>
    </section>
  );
};