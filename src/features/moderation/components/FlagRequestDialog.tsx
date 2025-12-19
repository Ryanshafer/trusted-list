import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  requestorName,
  requestorAvatarUrl,
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
  const requestorInitials = React.useMemo(() => {
    if (!requestorName) return "";
    return requestorName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [requestorName]);

  React.useEffect(() => {
    if (open) return;
    setReason("spam");
    setDetails("");
  }, [open]);

  const canSubmit = details.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Flag as inappropriate</DialogTitle>
          <DialogDescription>
            Help keep The Trusted List safe. Your report is private.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="space-y-2">
              {requestorName ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={requestorAvatarUrl ?? undefined} alt={requestorName} />
                    <AvatarFallback className="text-xs font-semibold text-foreground/80">
                      {requestorInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-xs font-semibold tracking-wide text-muted-foreground">
                    {requestorName}
                  </div>
                </div>
              ) : null}
              {requestSummary ? (
                <div className="text-sm font-semibold leading-snug text-foreground">
                  {requestSummary}
                </div>
              ) : null}
              <div className="text-sm leading-relaxed text-muted-foreground">
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

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() => {
              onSubmit?.({ reason, details: details.trim() });
              toast.success("Report sent", {
                description: "Thanks for helping keep the community safe.",
              });
              onOpenChange(false);
            }}
          >
            Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
