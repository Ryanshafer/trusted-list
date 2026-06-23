import {
  BicepsFlexed, Briefcase, GraduationCap, HelpCircle,
  MessageSquare, Tag, UserPlus,
} from "lucide-react";
import type { DialogErrors } from "@/features/requests/utils/help-request-dialog";
import type { HelpCategory } from "@/features/requests/components/HelpRequestDialog";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  feedback: MessageSquare,
  "help-advice": HelpCircle,
  introduction: UserPlus,
  mentorship: GraduationCap,
  opportunity: Briefcase,
  endorse: BicepsFlexed,
};

export function CategoryGrid({
  visibleCategories,
  requestCategories,
  onCategoryChange,
  errors,
}: {
  visibleCategories: HelpCategory[];
  requestCategories: string[];
  onCategoryChange: (value: string[]) => void;
  errors: DialogErrors;
}) {
  return (
    <div className="space-y-3">
      {errors.requestCategories && (
        <p className="text-xs text-destructive">{errors.requestCategories}</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {visibleCategories.map((category) => {
          const selected = requestCategories[0] === category.value;
          const Icon = CATEGORY_ICONS[category.value] ?? Tag;
          return (
            <button
              key={category.value}
              type="button"
              onClick={() => onCategoryChange([category.value])}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors ${
                selected
                  ? "border-primary bg-primary-25"
                  : "border-border-75 bg-muted/20 hover:bg-muted-50"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`}
              />
              <span className={`text-sm font-semibold ${selected ? "text-accent-foreground" : "text-foreground"}`}>
                {category.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
