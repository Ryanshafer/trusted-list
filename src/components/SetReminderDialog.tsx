import React from "react";
import { format } from "date-fns";
import { X, CalendarIcon } from "lucide-react";
import { Button } from "./ui/button";
import { BaseDialog } from "./BaseDialog";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

export type Reminder = {
  id: string;
  cardId: string;
  requestSummary: string;
  requesterName: string;
  requesterAvatarUrl?: string;
  reminderTime: string;
};

const TIME_OPTIONS = [
  { value: "07:00", label: "7:00 AM" },
  { value: "08:00", label: "8:00 AM" },
  { value: "09:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "13:00", label: "1:00 PM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "15:00", label: "3:00 PM" },
  { value: "16:00", label: "4:00 PM" },
  { value: "17:00", label: "5:00 PM" },
  { value: "18:00", label: "6:00 PM" },
  { value: "19:00", label: "7:00 PM" },
  { value: "20:00", label: "8:00 PM" },
  { value: "21:00", label: "9:00 PM" },
];

export const REMINDER_PRESETS = [
  { key: "tomorrow", label: "Tomorrow morning" },
  { key: "3days", label: "In 3 days" },
  { key: "nextweek", label: "Next week" },
  { key: "custom", label: "Pick a date…" },
] as const;

export const getPresetDate = (key: string): Date => {
  const d = new Date();
  if (key === "tomorrow") {
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
  } else if (key === "3days") {
    d.setDate(d.getDate() + 3);
    d.setHours(9, 0, 0, 0);
  } else if (key === "nextweek") {
    d.setDate(d.getDate() + 7);
    d.setHours(9, 0, 0, 0);
  }
  return d;
};

export const formatReminderTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  if (diffDays <= 0) return `Today at ${timeStr}`;
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  return `${weekday} at ${timeStr}`;
};

export const SetReminderDialog = ({
  open,
  onOpenChange,
  requesterName,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requesterName: string;
  onConfirm: (reminderTime: string) => void;
}) => {
  const [selectedPreset, setSelectedPreset] = React.useState<string>("tomorrow");
  const [customDate, setCustomDate] = React.useState<Date | undefined>(undefined);
  const [customTime, setCustomTime] = React.useState("09:00");

  React.useEffect(() => {
    if (open) {
      setSelectedPreset("tomorrow");
      setCustomDate(undefined);
      setCustomTime("09:00");
    }
  }, [open]);

  const handleConfirm = () => {
    let reminderTime: string;
    if (selectedPreset === "custom") {
      if (!customDate) return;
      const [hours, minutes] = (customTime || "09:00").split(":").map(Number);
      const d = new Date(customDate);
      d.setHours(hours, minutes, 0, 0);
      reminderTime = d.toISOString();
    } else {
      reminderTime = getPresetDate(selectedPreset).toISOString();
    }
    onConfirm(reminderTime);
  };

  const footerContent = (
    <>
      <Button
        variant="ghost"
        className="rounded-full font-semibold"
        onClick={() => onOpenChange(false)}
      >
        Cancel
      </Button>
      <Button
        className="rounded-full font-semibold"
        onClick={handleConfirm}
        disabled={selectedPreset === "custom" && !customDate}
      >
        Set Reminder
      </Button>
    </>
  );

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Set a reminder"
      description={`Follow up on ${requesterName}'s request.`}
      size="sm"
      footerContent={footerContent}
    >
      <div className="flex flex-col gap-4">
        <ToggleGroup
          type="single"
          value={selectedPreset}
          onValueChange={(v) => { if (v) setSelectedPreset(v); }}
          className="grid grid-cols-2 gap-2"
        >
          {REMINDER_PRESETS.map((preset) => (
            <ToggleGroupItem
              key={preset.key}
              value={preset.key}
              variant="outline"
              className="h-auto justify-start rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted-50 hover:text-foreground data-[state=on]:border-primary data-[state=on]:bg-primary-10 data-[state=on]:text-primary"
            >
              {preset.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {selectedPreset === "custom" && (
          <div className="flex gap-2 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1 justify-between rounded-full font-semibold"
                >
                  {customDate ? format(customDate, "MMM d, yyyy") : "Pick a date…"}
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customDate}
                  onSelect={setCustomDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="min-w-[214px] min-h-[261px]"
                />
              </PopoverContent>
            </Popover>
            <Select value={customTime} onValueChange={setCustomTime}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </BaseDialog>
  );
};
