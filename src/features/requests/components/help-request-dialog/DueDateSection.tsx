import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarPlus2, X } from "lucide-react";

export function DueDateSection({
  dueDate,
  dueDatePickerOpen,
  onDueDatePickerOpenChange,
  onDueDateChange,
}: {
  dueDate?: Date;
  dueDatePickerOpen: boolean;
  onDueDatePickerOpenChange: (open: boolean) => void;
  onDueDateChange: (date?: Date) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <p className="text-sm font-semibold text-foreground">When do you need this by?</p>
        <p className="text-xs font-normal text-muted-foreground">Optional</p>
      </div>
      <Popover open={dueDatePickerOpen} onOpenChange={onDueDatePickerOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={`rounded-full font-semibold leading-none transition-colors shadow-none ${
              dueDate
                ? "border-primary bg-primary-50 hover:bg-primary-25 text-foreground"
                : "border-border-75 bg-muted/20 hover:bg-muted-50 text-foreground"
            }`}
          >
            <CalendarPlus2 className="h-4 w-4" />
            {dueDate
              ? dueDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
              : "Set a deadline"}
            {dueDate && (
              <span
                role="button"
                aria-label="Clear due date"
                onClick={(e) => { e.stopPropagation(); onDueDateChange(undefined); }}
                className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dueDate}
            onSelect={(date) => {
              if (date) {
                onDueDateChange(date);
                onDueDatePickerOpenChange(false);
              }
            }}
            disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
            className="min-w-[214px] min-h-[261px]"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
