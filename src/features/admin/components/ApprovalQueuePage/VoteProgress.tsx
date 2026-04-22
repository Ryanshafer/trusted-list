// ── Vote progress ──────────────────────────────────────────────────────────────
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

function VoteSlot({ vote, color }: { vote: AdminVote; color: "emerald" | "amber" }) {
  const bg = color === "emerald" ? "bg-emerald-500" : "bg-amber-500"
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <Avatar className="h-5 w-5 ring-1 ring-background cursor-default">
          <AvatarFallback className={`rounded-full text-[8px] font-bold ${bg} text-white`}>
            {vote.adminName[0]}
          </AvatarFallback>
        </Avatar>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {vote.adminName} — {color === "emerald" ? "approve" : "hold"}
      </TooltipContent>
    </Tooltip>
  )
}

function EmptySlot() {
  return (
    <div className="h-5 w-5 rounded-full ring-1 ring-background bg-muted border border-border flex items-center justify-center">
      <CircleDashed className="h-2.5 w-2.5 text-muted-foreground/40" />
    </div>
  )
}

export function VoteProgress({
  votes,
  threshold,
}: {
  votes: AdminVote[]
  threshold: number
}) {
  const approveVotes = votes.filter((v) => v.decision === "approve")
  const holdVotes = votes.filter((v) => v.decision === "hold")
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-6">
        {/* Hold group */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[11px] font-semibold text-amber-600">Hold</span>
          <div className="flex -space-x-1.5">
            {holdVotes.map((v) => (
              <VoteSlot key={v.adminId} vote={v} color="amber" />
            ))}
            {Array.from({ length: Math.max(0, threshold - holdVotes.length) }).map((_, i) => (
              <EmptySlot key={i} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-border" />

        {/* Approve group */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[11px] font-semibold text-emerald-600">Approve</span>
          <div className="flex -space-x-1.5">
            {approveVotes.map((v) => (
              <VoteSlot key={v.adminId} vote={v} color="emerald" />
            ))}
            {Array.from({ length: Math.max(0, threshold - approveVotes.length) }).map((_, i) => (
              <EmptySlot key={i} />
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
