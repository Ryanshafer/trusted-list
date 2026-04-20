// ── Approval card ─────────────────────────────────────────────────────────────

import * as React from "react"
import {
  CheckCircle2,
  PauseCircle,
  Vote,
  ShieldCheck,
  MoreVertical,
  Ban,
  ExternalLink,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { VoteProgress } from "./VoteProgress"
import { ApplicationTypeBadge } from "../shared/status-badges"

export function ApprovalCard({
  entry,
  onApprove,
  onVote,
  onReject,
  onBan,
}: {
  entry: QueueEntry
  onApprove: (id: string) => void
  onVote: (id: string) => void
  onReject: (id: string) => void
  onBan: (id: string) => void
}) {
  const { applicant, inviter, recommendationText, appliedAt, requiresVote, votes, applicationType } = entry

  const hasVoted = votes.some((v) => v.adminId === CURRENT_ADMIN_ID)
  const approveVotes = votes.filter((v) => v.decision === "approve").length
  const readyToApprove = requiresVote && approveVotes >= VOTE_THRESHOLD - 1

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
          {requiresVote ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Vote className="h-3.5 w-3.5 text-violet-500" />
              {hasVoted
                ? "You've voted to approve"
                : readyToApprove
                ? "Your vote is needed to decide"
                : `${VOTE_THRESHOLD - approveVotes} vote${VOTE_THRESHOLD - approveVotes !== 1 ? "s" : ""} needed`}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              You can approve this directly
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-full gap-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => onReject(entry.id)}
            >
              <PauseCircle className="h-3.5 w-3.5" />
              On Hold
            </Button>

            {requiresVote ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={hasVoted ? "outline" : "default"}
                    disabled={hasVoted}
                    className={`h-8 rounded-full gap-1.5 text-xs font-semibold ${
                      hasVoted
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : ""
                    }`}
                    onClick={() => !hasVoted && onVote(entry.id)}
                  >
                    {hasVoted ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Voted
                      </>
                    ) : (
                      <>
                        <Vote className="h-3.5 w-3.5" />
                        Vote to approve
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                {hasVoted && (
                  <TooltipContent side="top" className="text-xs">
                    You've cast your vote
                  </TooltipContent>
                )}
              </Tooltip>
            ) : (
              <Button
                size="sm"
                className="h-8 rounded-full gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-600"
                onClick={() => onApprove(entry.id)}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approve
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </TooltipProvider>
  )
}
