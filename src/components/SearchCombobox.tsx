"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ComboboxItem = { value: string; label: string };

type SearchComboboxProps = {
  /** Async search function — receives query string, returns matching items */
  searchFn: (query: string) => Promise<ComboboxItem[]>;
  /** Label shown in the trigger when a value is selected */
  selectedLabel?: string | null;
  /** Value of the current selection (used for checkmark display in single-select mode) */
  selectedValue?: string;
  /** Called when a result or custom "Other" value is confirmed */
  onSelect: (item: ComboboxItem) => void;
  placeholder?: string;
  /** Keep the popover open after selection — set true for multi-select */
  keepOpenOnSelect?: boolean;
  /** Which side the dropdown opens toward. Defaults to "bottom". */
  side?: "top" | "bottom" | "left" | "right";
  "aria-invalid"?: boolean;
  className?: string;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function SearchCombobox({
  searchFn,
  selectedLabel,
  selectedValue,
  onSelect,
  placeholder = "Search…",
  keepOpenOnSelect = false,
  side = "bottom",
  "aria-invalid": ariaInvalid,
  className,
}: SearchComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<ComboboxItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [otherMode, setOtherMode] = React.useState(false);
  const [otherText, setOtherText] = React.useState("");

  // Reset internal state when popover closes
  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setLoading(false);
      setOtherMode(false);
      setOtherText("");
    }
  }, [open]);

  // Debounced search
  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const r = await searchFn(q);
      setResults(r);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchFn]);

  const showIdle = query.trim().length < 2;
  const showLoading = !showIdle && loading;
  const showEmpty = !showIdle && !loading && results.length === 0;

  const handleSelect = (item: ComboboxItem) => {
    onSelect(item);
    setQuery("");
    setResults([]);
    if (!keepOpenOnSelect) setOpen(false);
  };

  const handleOtherConfirm = () => {
    const text = otherText.trim();
    if (!text) return;
    onSelect({ value: "__other__", label: text });
    setOtherText("");
    setOtherMode(false);
    if (!keepOpenOnSelect) setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          type="button"
          aria-expanded={open}
          aria-invalid={ariaInvalid}
          className={cn(
            "w-full justify-between font-normal bg-background hover:bg-background rounded-md h-9 px-3",
            ariaInvalid
              ? "border-destructive focus-visible:ring-destructive"
              : "border-input",
            className,
          )}
        >
          <span
            className={
              selectedLabel ? "text-foreground" : "text-muted-foreground"
            }
          >
            {selectedLabel ?? placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[280px] p-0" align="start" side={side}>
        <Command shouldFilter={false}>
          {otherMode ? (
            <div className="p-3 flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                Enter a custom value
              </p>
              <Input
                autoFocus
                placeholder="Type and press Enter…"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleOtherConfirm();
                  }
                  if (e.key === "Escape") setOtherMode(false);
                }}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setOtherMode(false)}
                  className="h-7 rounded-full text-xs font-semibold"
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  type="button"
                  onClick={handleOtherConfirm}
                  disabled={!otherText.trim()}
                  className="h-7 rounded-full text-xs font-semibold"
                >
                  Add
                </Button>
              </div>
            </div>
          ) : (
            <>
              <CommandInput
                placeholder="Type to search…"
                value={query}
                onValueChange={setQuery}
              />
              <CommandList className="max-h-[220px] overflow-y-auto">
                {showIdle && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Type at least 2 characters
                  </p>
                )}
                {showLoading && (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {showEmpty && (
                  <CommandEmpty>No results found.</CommandEmpty>
                )}
                {!showIdle && !showLoading && results.length > 0 && (
                  <CommandGroup>
                    {results.map((item) => (
                      <CommandItem
                        key={item.value}
                        value={item.value}
                        onSelect={() => handleSelect(item)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !keepOpenOnSelect && selectedValue === item.value
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {item.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
              <CommandSeparator />
              <div className="p-1">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => setOtherMode(true)}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      !keepOpenOnSelect && selectedValue === "__other__"
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  Other
                </button>
              </div>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
