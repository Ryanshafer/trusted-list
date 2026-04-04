import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { BaseDialog } from "@/components/BaseDialog";
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

  React.useEffect(() => {
    if (open) return;
    setReason("spam");
    setDetails("");
  }, [open]);

  const canSubmit = details.trim().length > 0;

  const handleSubmit = () => {
    onSubmit?.({ reason, details: details.trim() });
    toast.success("Report sent", {
      description: "Thanks for helping keep the community safe.",
    });
  };

  const footerContent = (
    <>
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
        onClick={handleSubmit}
        type="button"
      >
        Submit report
      </Button>
    </>
  );

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Flag as inappropriate"
      description="Help keep The Trusted List safe. Your report is private."
      footerContent={footerContent}
    >
      <div className="flex flex-col gap-5">
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
    </BaseDialog>
  );
}
