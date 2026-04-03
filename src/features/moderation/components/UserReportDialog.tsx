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

  const userInitials = React.useMemo(() => {
    if (!userName) return "";
    return userName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [userName]);

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
          <DialogTitle>Report user</DialogTitle>
          <DialogDescription>
            Help keep The Trusted List safe. Your report is private.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-muted-25 p-4">
            <div className="space-y-2">
              {userName ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={userAvatarUrl ?? undefined} alt={userName} />
                    <AvatarFallback className="text-xs font-semibold text-foreground-75">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-xs font-semibold tracking-wide text-muted-foreground">
                    {userName}
                  </div>
                </div>
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

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" className="rounded-full font-semibold leading-none" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="rounded-full font-semibold leading-none"
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
