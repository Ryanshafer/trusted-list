import { Textarea } from "@/components/ui/textarea";
import { Maximize2, Minimize2 } from "lucide-react";

export function RequestDetailsSection({
  value,
  onChange,
  error,
  placeholder,
  detailsExpanded,
  onToggleExpand,
  showLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder: string;
  detailsExpanded: boolean;
  onToggleExpand: () => void;
  showLabel: boolean;
}) {
  return (
    <div className="space-y-2">
      {showLabel && <p className="text-sm font-semibold text-foreground">Add some context to get better advice</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="relative" style={{ height: detailsExpanded ? "calc(60dvh)" : "7.5rem" }}>
        <Textarea
          placeholder={placeholder}
          className={`h-full resize-none rounded-lg bg-background placeholder:text-muted-foreground shadow-none focus-visible:ring-1 focus-visible:ring-offset-0 ${error ? "border-destructive" : "border-border"}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={onToggleExpand}
          aria-label={detailsExpanded ? "Collapse text area" : "Expand text area"}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {detailsExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
