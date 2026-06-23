import { Input } from "@/components/ui/input";
import { SUMMARY_MAX_LENGTH } from "@/features/requests/utils/help-request-dialog";

export function ShortDescriptionSection({
  value,
  onChange,
  error,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground">What would you like help with?</p>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex items-center gap-2">
        <Input
          placeholder={placeholder}
          maxLength={SUMMARY_MAX_LENGTH}
          className={`w-[60ch] max-w-full rounded-lg bg-background shadow-none ${error ? "border-destructive" : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <p className="shrink-0 text-xs text-muted-foreground">{value.length}/{SUMMARY_MAX_LENGTH}</p>
      </div>
    </div>
  );
}
