// ── Approval card ─────────────────────────────────────────────────────────────

import * as React from "react"
import {
  CheckCircle2,
  CircleCheck,
  PauseCircle,
  ThumbsUp,
  Vote,
  ShieldCheck,
  MoreVertical,
  Ban,
  ExternalLink,
  AlertTriangle,
} from "lucide-react"
import type { QueueEntry } from "./types"
import { CURRENT_ADMIN_ID, VOTE_THRESHOLD } from "./constants"
import { initials, getMemberUrl, timeAgo } from "./utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardFooter } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { TooltipProvider } from "@/components/ui/tooltip"
import { VoteProgress } from "./VoteProgress"
import { ApplicationTypeBadge } from "../shared/status-badges"

export function ApprovalCard({
  entry,
  onApprove,
  onCastVote,
  onRetractVote,
  onReject,
  onBan,
}: {
  entry: QueueEntry
  onApprove: (id: string) => void
  onCastVote: (id: string, decision: "approve" | "hold") => void
  onRetractVote: (id: string) => void
  onReject: (id: string) => void
  onBan: (id: string) => void
}) {
  const { applicant, inviter, recommendationText, appliedAt, requiresVote, votes, applicationType } = entry

  const myVoteRecord = votes.find((v) => v.adminId === CURRENT_ADMIN_ID)
  const hasVoted = !!myVoteRecord
  const myVote = myVoteRecord?.decision

  const approveVotes = votes.filter((v) => v.decision === "approve").length
  const holdVotes = votes.filter((v) => v.decision === "hold").length
  const isTied = approveVotes > 0 && approveVotes === holdVotes

  return (
    <TooltipProvider delayDuration={150}>
      <Card id={entry.applicant.id} className="rounded-xl overflow-hidden transition-shadow hover:shadow-md">
        {/* Card header */}
        <div className="flex items-start gap-4 p-5 relative">
          <Avatar className="h-11 w-11 shrink-0 rounded-full border border-border">
            <AvatarImage src={applicant.avatarUrl ?? ""} alt={applicant.name} className="object-cover" />
            <AvatarFallback className="rounded-full text-xs font-semibold">
              {initials(applicant.name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {applicant.linkedInUrl ? (
                <a
                  href={applicant.linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-w-0 items-center gap-1.5 rounded-sm text-foreground transition-colors hover:text-primary"
                  aria-label={`Open ${applicant.name}'s LinkedIn profile`}
                  title="Open LinkedIn profile"
                >
                  <h3 className="min-w-0 truncate text-sm font-semibold">{applicant.name}</h3>
                  <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                </a>
              ) : (
                <h3 className="text-sm font-semibold text-foreground truncate">{applicant.name}</h3>
              )}
              <div className="flex items-center gap-2 shrink-0">
                <ApplicationTypeBadge applicationType={applicationType} />
                <span className="text-xs tabular-nums text-muted-foreground">
                  {timeAgo(appliedAt)}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      className="gap-2 text-destructive focus:text-destructive"
                      onClick={() => onBan(entry.id)}
                    >
                      <Ban className="h-3.5 w-3.5" />
                      Ban Applicant
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Nominated by:{" "}
                <a
                  href={getMemberUrl(inviter.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground hover:underline"
                >
                  {inviter.name}
                </a>
                {inviter.title ? `, ${inviter.title}` : ""}
                {inviter.company ? ` · ${inviter.company}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                Known via: <span className="text-foreground/80">{applicant.company}</span>
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Recommendation */}
        <div className="px-5 py-4 space-y-3">
          <blockquote className="relative pl-3 mt-6 mb-10 text-base text-foreground/90 leading-relaxed max-w-[70ch]">
            <span
              aria-hidden
              className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-primary/30"
            />
            {recommendationText}
          </blockquote>

          {requiresVote && (
            <VoteProgress votes={votes} threshold={VOTE_THRESHOLD} />
          )}
        </div>

        <Separator />

        {/* Action bar */}
        <CardFooter className="justify-between gap-3 px-5 py-3 bg-muted/20">
          {/* Status label */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {requiresVote ? (
              isTied ? (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  <span className="font-medium text-amber-600">
                    {hasVoted ? "Tied — another vote decides" : "Tied — your vote decides"}
                  </span>
                </>
              ) : hasVoted ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  You voted to {myVote === "approve" ? "approve" : "hold"}
                </>
              ) : (approveVotes + holdVotes) === 0 ? (
                <>
                  <Vote className="h-3.5 w-3.5 text-violet-500" />
                  Cast the first vote
                </>
              ) : (
                <>
                  <Vote className="h-3.5 w-3.5 text-violet-500" />
                  {holdVotes} hold · {approveVotes} approve
                </>
              )
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                You can approve this directly
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {requiresVote ? (
              <>
                {/* Vote to hold */}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={myVote === "approve"}
                  className={`h-8 rounded-full gap-1.5 text-xs font-semibold ${
                    myVote === "hold"
                      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => myVote === "hold" ? onRetractVote(entry.id) : onCastVote(entry.id, "hold")}
                >
                  {myVote === "hold" ? <CircleCheck className="h-3.5 w-3.5" /> : <PauseCircle className="h-3.5 w-3.5" />}
                  {myVote === "hold" ? "Voted hold" : "Vote to hold"}
                </Button>

                {/* Vote to approve */}
                <Button
                  size="sm"
                  disabled={myVote === "hold"}
                  variant="outline"
                  className={`h-8 rounded-full gap-1.5 text-xs font-semibold ${
                    myVote === "approve"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => myVote === "approve" ? onRetractVote(entry.id) : onCastVote(entry.id, "approve")}
                >
                  {myVote === "approve" ? (
                    <>
                      <CircleCheck className="h-3.5 w-3.5" />
                      Voted approve
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="h-3.5 w-3.5" />
                      Vote to approve
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-full gap-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => onReject(entry.id)}
                >
                  <PauseCircle className="h-3.5 w-3.5" />
                  Place on hold
                </Button>
                <Button
                  size="sm"
                  className="h-8 rounded-full gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-600"
                  onClick={() => onApprove(entry.id)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve
                </Button>
              </>
            )}
          </div>
        </CardFooter>
      </Card>
    </TooltipProvider>
  )
}
