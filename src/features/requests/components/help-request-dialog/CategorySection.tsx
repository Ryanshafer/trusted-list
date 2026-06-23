import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, Tag, X } from "lucide-react";
import type { DialogErrors } from "@/features/requests/utils/help-request-dialog";
import type { HelpCategory } from "@/features/requests/components/HelpRequestDialog";

export function CategorySection({
  errors,
  categoryOpen,
  requestCategories,
  visibleCategories,
  categoryTriggerRef,
  onCategoryOpenChange,
  onCategoryChange,
}: {
  errors: DialogErrors;
  categoryOpen: boolean;
  requestCategories: string[];
  visibleCategories: HelpCategory[];
  categoryTriggerRef: React.RefObject<HTMLButtonElement | null>;
  onCategoryOpenChange: (open: boolean) => void;
  onCategoryChange: (value: string[]) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-base font-semibold text-foreground">What kind of help is this?</p>
      {errors.requestCategories && (
        <p className="mb-1 text-xs text-destructive">{errors.requestCategories}</p>
      )}
      <Popover open={categoryOpen} onOpenChange={onCategoryOpenChange}>
        <PopoverTrigger asChild>
          <button
            ref={categoryTriggerRef}
            type="button"
            className={`flex h-9 w-full items-center gap-2 rounded-lg border bg-background px-3 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${errors.requestCategories ? "border-destructive" : "border-border"}`}
          >
            <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className={`flex-1 text-sm ${requestCategories.length > 0 ? "text-foreground" : "text-muted-foreground"}`}>
              {requestCategories.length > 0
                ? visibleCategories.find((c) => c.value === requestCategories[0])?.label ?? requestCategories[0]
                : "Select a category…"}
            </span>
            {requestCategories.length > 0 && (
              <span
                role="button"
                aria-label="Clear category"
                onClick={(e) => { e.stopPropagation(); onCategoryChange([]); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" side="top">
          <Command>
            <CommandInput placeholder="Search categories…" />
            <CommandList>
              <CommandEmpty>No categories found.</CommandEmpty>
              <CommandGroup>
                {visibleCategories.map((category) => {
                  const selected = requestCategories[0] === category.value;
                  return (
                    <CommandItem
                      key={category.value}
                      value={category.value}
                      onSelect={() => onCategoryChange([category.value])}
                    >
                      <Check className={`mr-2 h-4 w-4 ${selected ? "opacity-100" : "opacity-0"}`} />
                      {category.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
