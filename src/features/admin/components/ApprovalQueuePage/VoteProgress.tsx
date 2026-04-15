// ── Vote progress bar ─────────────────────────────────────────────────────────
// TooltipProvider is supplied by the parent ApprovalCard

import * as React from "react"
import { CircleDashed } from "lucide-react"
import type { AdminVote } from "./types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function VoteProgress({
  votes,
  threshold,
}: {
  votes: AdminVote[]
  threshold: number
}) {
  const approveCount = votes.filter((v) => v.decision === "approve").length
  const pct = Math.min((approveCount / threshold) * 100, 100)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {approveCount} of {threshold} admin votes
        </span>
        <div className="flex -space-x-1.5">
          {votes.map((v) => (
            <Tooltip key={v.adminId} delayDuration={150}>
              <TooltipTrigger asChild>
                <Avatar className="h-5 w-5 ring-1 ring-background">
                  <AvatarFallback className="rounded-full text-[8px] font-bold bg-emerald-500 text-white">
                    {v.adminName[0]}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {v.adminName} voted {v.decision}
              </TooltipContent>
            </Tooltip>
          ))}
          {Array.from({ length: threshold - votes.length }).map((_, i) => (
            <div
              key={i}
              className="h-5 w-5 rounded-full ring-1 ring-background bg-muted border border-border flex items-center justify-center"
            >
              <CircleDashed className="h-2.5 w-2.5 text-muted-foreground/40" />
            </div>
          ))}
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
