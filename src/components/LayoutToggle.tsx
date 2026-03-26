import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutToggleProps {
  layout: "grid" | "list";
  onChange: (layout: "grid" | "list") => void;
  className?: string;
}

export function LayoutToggle({ layout, onChange, className }: LayoutToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={layout}
      onValueChange={(v) => { if (v) onChange(v as "grid" | "list"); }}
      className={cn("rounded-full bg-muted-50 px-2 py-1.5 gap-2", className)}
    >
      <ToggleGroupItem
        value="grid"
        aria-label="Grid view"
        className="h-9 w-9 rounded-full data-[state=on]:bg-secondary data-[state=on]:hover:bg-secondary"
      >
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="list"
        aria-label="List view"
        className="h-9 w-9 rounded-full data-[state=on]:bg-secondary data-[state=on]:hover:bg-secondary"
      >
        <List className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
