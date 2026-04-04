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

type ReportReason =
  | "spam"
  | "harassment"
  | "hate"
  | "sexual"
  | "violence"
  | "misinformation"
  | "illegal"
  | "impersonation"
  | "other";

export type UserReportPayload = {
  reason: ReportReason;
  details: string;
};

export function UserReportDialog({
  open,
  onOpenChange,
  userName,
  userAvatarUrl,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName?: string | null;
  userAvatarUrl?: string | null;
  onSubmit?: (payload: UserReportPayload) => void;
}) {
  const [reason, setReason] = React.useState<ReportReason>("spam");
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
      title="Report user"
      description="Help keep The Trusted List safe. Your report is private."
      footerContent={footerContent}
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-border bg-muted-25 p-4">
          <div className="space-y-2">
            {userName ? (
              <UserIdentityLink
                name={userName}
                avatarUrl={userAvatarUrl}
                avatarSize="lg"
                showTrustedFor={false}
              />
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="report-reason">Reason</Label>
          <Select value={reason} onValueChange={(value) => setReason(value as ReportReason)}>
            <SelectTrigger id="report-reason" className="h-10">
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
              <SelectItem value="impersonation">Impersonation</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="report-details">What's wrong with this user?</Label>
          <Textarea
            id="report-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Share any context that helps us review this report…"
            rows={3}
            className="resize-none"
          />
        </div>
      </div>
    </BaseDialog>
  );
}
