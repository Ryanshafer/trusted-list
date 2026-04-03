import * as React from "react";
import { toast } from "sonner";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserIdentityLink } from "@/components/UserIdentityLink";

type FlagReason =
  | "spam"
  | "harassment"
  | "hate"
  | "sexual"
  | "violence"
  | "misinformation"
  | "illegal"
  | "other";

export type FlagRequestPayload = {
  reason: FlagReason;
  details: string;
};

export function FlagRequestDialog({
  open,
  onOpenChange,
  requestSummary,
  requestText,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestSummary?: string | null;
  requestText: string;
  requestorName?: string | null;
  requestorAvatarUrl?: string | null;
  onSubmit?: (payload: FlagRequestPayload) => void;
}) {
  const [reason, setReason] = React.useState<FlagReason>("spam");
  const [details, setDetails] = React.useState("");
  React.useEffect(() => {
    if (open) return;
    setReason("spam");
    setDetails("");
  }, [open]);

  const canSubmit = details.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden rounded-2xl [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-2xl font-normal leading-8">Flag as inappropriate</h2>
            <p className="text-sm text-muted-foreground">Help keep The Trusted List safe. Your report is private.</p>
          </div>
          <DialogClose asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-border bg-muted font-semibold"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[calc(100vh-220px)] px-6 pt-4 pb-6 flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-muted-25 p-4">
            <div className="space-y-2">
              {requestSummary ? (
                <div className="font-serif text-2xl leading-7 text-card-foreground">
                  {requestSummary}
                </div>
              ) : null}
              <div className="line-clamp-5 text-sm leading-relaxed text-card-foreground">
                {requestText}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="flag-reason">Reason</Label>
            <Select value={reason} onValueChange={(value) => setReason(value as FlagReason)}>
              <SelectTrigger id="flag-reason" className="h-10">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spam">Spam or scam</SelectItem>
                <SelectItem value="harassment">Harassment or bullying</SelectItem>
                <SelectItem value="hate">Hate or hateful conduct</SelectItem>
                <SelectItem value="sexual">Sexual content</SelectItem>
                <SelectItem value="violence">Violence or threats</SelectItem>
                <SelectItem value="misinformation">Misinformation</SelectItem>
                <SelectItem value="illegal">Illegal activity</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="flag-details">What’s wrong with this request?</Label>
            <Textarea
              id="flag-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Share any context that helps us review this quickly…"
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 px-6 py-4 bg-card border-t border-border">
          <Button
            variant="ghost"
            className="rounded-full font-semibold"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            Cancel
          </Button>
          <Button
            className="rounded-full font-semibold"
            disabled={!canSubmit}
            onClick={() => {
              onSubmit?.({ reason, details: details.trim() });
              toast.success("Report sent", {
                description: "Thanks for helping keep the community safe.",
              });
              onOpenChange(false);
            }}
            type="button"
          >
            Submit report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
