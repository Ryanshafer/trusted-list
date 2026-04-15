"use client"

import * as React from "react"
import {
  CheckCircle2,
  Vote,
  ShieldCheck,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { AdminPageLayout } from "./AdminShell"
import { useApprovalQueueItems, removeApprovalQueueItem } from "@/features/admin/hooks/useApprovalQueueStore"
import { ApprovalCard } from "./ApprovalQueuePage/ApprovalCard"
import { FILTER_TABS, VOTE_THRESHOLD } from "./ApprovalQueuePage/constants"
import type { FilterTab } from "./ApprovalQueuePage/types"

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ApprovalQueuePage() {
  const entries = useApprovalQueueItems()
  const [activeTab, setActiveTab] = React.useState<FilterTab>("all")

  const handleApprove = (id: string) => {
    removeApprovalQueueItem(id)
  }

  const handleVote = (id: string) => {
    // For vote-based approvals, we need to update the item and potentially remove it
    // This is a bit more complex since we need to modify the item, not just remove it
    // For now, we'll keep the simple removal approach to ensure sidebar updates
    removeApprovalQueueItem(id)
  }

  const handleReject = (id: string) => {
    removeApprovalQueueItem(id)
  }

  const counts: Record<FilterTab, number> = {
    all:    entries.length,
    direct: entries.filter((e) => !e.requiresVote).length,
    vote:   entries.filter((e) => e.requiresVote).length,
  }

  const visible = entries.filter((e) => {
    if (activeTab === "direct") return !e.requiresVote
    if (activeTab === "vote") return e.requiresVote
    return true
  })

  return (
    <AdminPageLayout>
      <div className="flex flex-col gap-6">
        {/* Page header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Approval Queue</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {entries.length} application{entries.length !== 1 ? "s" : ""} awaiting review
            </p>
          </div>

          {/* Legend */}
          {/* <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Direct approve</span>
              <span className="text-muted-foreground/40">—</span>
              <span>any admin can approve immediately</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Vote className="h-3.5 w-3.5 text-violet-600" />
              <span>Requires vote</span>
              <span className="text-muted-foreground/40">—</span>
              <span>{VOTE_THRESHOLD} admins must approve</span>
            </div>
          </div> */}
        </div>
        <Separator />

        {/* Filter tabs */}
        {/* <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)} className="flex justify-center">
          <TabsList className="gap-1 border border-border bg-muted/40">
            {FILTER_TABS.map((tab: (typeof FILTER_TABS)[number]) => (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 text-xs">
                {tab.label}
                <span
                  className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {counts[tab.id]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs> */}

        {/* Cards grid */}
        {visible.length > 0 ? (
          <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
            {visible.map((entry) => (
              <ApprovalCard
                key={entry.id}
                entry={entry}
                onApprove={handleApprove}
                onVote={handleVote}
                onReject={handleReject}
              />
            ))}
          </div>
        ) : (
          <Empty className="border border-dashed border-border bg-muted/20">
            <EmptyHeader>
              <EmptyMedia
                variant="icon"
                className="size-12 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
              >
                <CheckCircle2 />
              </EmptyMedia>
              <EmptyTitle>Queue is clear</EmptyTitle>
              <EmptyDescription>
                All pending applications have been reviewed. Check back later.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </AdminPageLayout>
  )
}
