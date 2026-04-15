// ── Approval card ─────────────────────────────────────────────────────────────

import * as React from "react"
import {
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Vote,
  ShieldCheck,
  Users,
  ExternalLink,
} from "lucide-react"
import type { QueueEntry } from "./types"
import { CURRENT_ADMIN_ID, VOTE_THRESHOLD } from "./constants"
import { initials, getMemberUrl, timeAgo } from "./utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { VoteProgress } from "./VoteProgress"

export function ApprovalCard({
  entry,
  onApprove,
  onVote,
  onReject,
}: {
  entry: QueueEntry
  onApprove: (id: string) => void
  onVote: (id: string) => void
  onReject: (id: string) => void
}) {
  const [expanded, setExpanded] = React.useState(false)
  const { applicant, inviter, recommendationText, appliedAt, requiresVote, votes } = entry

  const hasVoted = votes.some((v) => v.adminId === CURRENT_ADMIN_ID)
  const approveVotes = votes.filter((v) => v.decision === "approve").length
  const readyToApprove = requiresVote && approveVotes >= VOTE_THRESHOLD - 1

  const shortText =
    recommendationText.length > 160
      ? recommendationText.slice(0, 160).trimEnd() + "…"
      : recommendationText

  return (
    <TooltipProvider delayDuration={150}>
      <Card className="rounded-xl overflow-hidden transition-shadow hover:shadow-md">
        {/* Card header */}
        <div className="flex items-start gap-4 p-5">
          <Avatar className="h-11 w-11 shrink-0 rounded-full border border-border">
            <AvatarImage src={applicant.avatarUrl ?? ""} alt={applicant.name} className="object-cover" />
            <AvatarFallback className="rounded-full text-xs font-semibold">
              {initials(applicant.name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{applicant.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {applicant.title} · {applicant.company}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* {requiresVote ? (
                  <Badge
                    variant="outline"
                    className="rounded-full border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-400 text-[11px] font-semibold gap-1"
                  >
                    <Vote className="h-3 w-3" />
                    Requires vote
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 text-[11px] font-semibold gap-1"
                  >
                    <ShieldCheck className="h-3 w-3" />
                    Direct approve
                  </Badge>
                )} */}
                <span className="text-xs tabular-nums text-muted-foreground">
                  {timeAgo(appliedAt)}
                </span>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {applicant.linkedInUrl && (
                <a
                  href={applicant.linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  LinkedIn <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <span>{applicant.location}</span>
              <span className="hidden sm:inline text-muted-foreground/60">·</span>
              <a href={`mailto:${applicant.email}`} className="hidden sm:inline hover:underline">
                {applicant.email}
              </a>
            </div>
          </div>
        </div>

        <Separator />

        {/* Inviter + recommendation */}
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Nominated by</span>
            <a
              href={getMemberUrl(inviter.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:underline"
            >
              <Avatar className="h-5 w-5 shrink-0 rounded-full border border-border">
                <AvatarImage src={inviter.avatarUrl ?? ""} alt={inviter.name} className="object-cover" />
                <AvatarFallback className="rounded-full text-[8px] font-semibold">
                  {initials(inviter.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-foreground">{inviter.name}</span>
            </a>
            <span className="text-xs text-muted-foreground">
              · {inviter.title}, {inviter.company}
            </span>
          </div>

          <blockquote className="relative pl-3 text-sm text-foreground/90 leading-relaxed">
            <span
              aria-hidden
              className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-primary/30"
            />
            {expanded ? recommendationText : shortText}
            {recommendationText.length > 160 && (
              <Button
                variant="link"
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="ml-1.5 h-auto p-0 text-xs gap-0.5"
              >
                {expanded ? (
                  <>Show less <ChevronUp className="h-3 w-3" /></>
                ) : (
                  <>Read more <ChevronDown className="h-3 w-3" /></>
                )}
              </Button>
            )}
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
              <Clock className="h-3.5 w-3.5" />
              Waitlist
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
