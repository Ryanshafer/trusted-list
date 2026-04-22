"use client"

import * as React from "react"
import { CheckCircle2, SearchX } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { AdminPageLayout } from "./AdminShell"
import {
  banApplicantFromQueue,
  castVoteOnQueueItem,
  retractVoteOnQueueItem,
  restoreApprovalQueueItem,
  placeApplicantOnHold,
  removeApprovalQueueItem,
  returnApplicantToQueue,
  useApprovalQueueItems,
} from "@/features/admin/hooks/useApprovalQueueStore"
import { ApprovalCard } from "./ApprovalQueuePage/ApprovalCard"
import { CURRENT_ADMIN_ID, CURRENT_ADMIN_NAME, VOTE_THRESHOLD } from "./ApprovalQueuePage/constants"
import { toast } from "@/features/admin/lib/toast"
import { AnimatedRemoval } from "./shared/AnimatedRemoval"
import { AdminSearchField } from "./shared/admin-list-controls"

type SortOption = "newest" | "oldest" | "member-first" | "self-first"

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ApprovalQueuePage() {
  const entries = useApprovalQueueItems()
  const [sortBy, setSortBy] = React.useState<SortOption>("oldest")
  const [query, setQuery] = React.useState("")

  const [exitingIds, setExitingIds] = React.useState<Set<string>>(new Set())

  const scrollToCard = (applicantId: string) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById(applicantId)
        if (!el) return
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        el.classList.add("ring-2", "ring-primary", "ring-offset-2")
        setTimeout(() => el.classList.remove("ring-2", "ring-primary", "ring-offset-2"), 3000)
      })
    })
  }

  const handleApprove = (id: string) => {
    removeApprovalQueueItem(id)
    toast.success("Application approved.")
  }
  const handleCastVote = (id: string, decision: "approve" | "hold") => {
    const preVoteEntry = entries.find((e) => e.id === id)
    if (!preVoteEntry) return

    const { approveVotes, holdVotes } = castVoteOnQueueItem(
      id,
      decision,
      CURRENT_ADMIN_ID,
      CURRENT_ADMIN_NAME,
    )

    if (approveVotes >= VOTE_THRESHOLD) {
      removeApprovalQueueItem(id)
      toast.success("Application approved.", {
        duration: 8000,
        action: {
          label: "Undo",
          onClick: () => {
            restoreApprovalQueueItem(preVoteEntry)
            scrollToCard(preVoteEntry.applicant.id)
          },
        },
      })
    } else if (holdVotes >= VOTE_THRESHOLD) {
      setExitingIds((prev) => new Set(prev).add(id))
      setTimeout(() => {
        placeApplicantOnHold(id)
        setExitingIds((prev) => { const next = new Set(prev); next.delete(id); return next })
        toast.success("Applicant placed on hold.", {
          duration: 8000,
          action: {
            label: "Undo",
            onClick: () => {
              returnApplicantToQueue(id)
              retractVoteOnQueueItem(id, CURRENT_ADMIN_ID)
              scrollToCard(preVoteEntry.applicant.id)
            },
          },
        })
      }, 300)
    }
  }
  const handleRetractVote = (id: string) => {
    retractVoteOnQueueItem(id, CURRENT_ADMIN_ID)
  }
  const handleReject = (id: string) => {
    setExitingIds((prev) => new Set(prev).add(id))
    setTimeout(() => {
      placeApplicantOnHold(id)
      setExitingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      toast.success("Applicant moved to on hold.")
    }, 300)
  }
  const handleBan = (id: string) => {
    setExitingIds((prev) => new Set(prev).add(id))
    setTimeout(() => {
      banApplicantFromQueue(id)
      setExitingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      toast.success("Applicant banned.")
    }, 300)
  }

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter(
      (e) =>
        e.applicant.name.toLowerCase().includes(q) ||
        e.inviter.name.toLowerCase().includes(q)
    )
  }, [entries, query])

  const sorted = React.useMemo(() => {
    const entries = filtered
    const copy = [...entries]
    const byDate = (a: typeof copy[0], b: typeof copy[0]) =>
      new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime()
    if (sortBy === "newest") return copy.sort((a, b) => -byDate(a, b))
    if (sortBy === "oldest") return copy.sort(byDate)
    if (sortBy === "member-first") {
      return copy.sort((a, b) =>
        a.applicationType !== b.applicationType ? (a.applicationType === "waitlist" ? 1 : -1) : byDate(a, b)
      )
    }
    // self-first
    return copy.sort((a, b) =>
      a.applicationType !== b.applicationType ? (a.applicationType === "waitlist" ? -1 : 1) : byDate(a, b)
    )
  }, [filtered, sortBy])

  // Handle URL hash navigation to scroll to specific user
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.substring(1)
      if (hash) {
        const element = document.getElementById(hash)
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" })
          element.classList.add("ring-2", "ring-primary", "ring-offset-2")
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-primary", "ring-offset-2")
          }, 3000)
        }
      }
    }
  }, [entries])

  return (
    <AdminPageLayout>
      <div className="flex flex-col gap-6">
        {/* Page header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Approval Queue</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {entries.length} application{entries.length !== 1 ? "s" : ""} awaiting review
            </p>
          </div>

          <div className="flex items-center gap-2">
            <AdminSearchField value={query} onChange={setQuery} placeholder="Search applicants…" className="w-52 min-w-0 flex-none" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="h-8 w-52 rounded-full text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="oldest" className="text-xs">Oldest First</SelectItem>
                <SelectItem value="newest" className="text-xs">Newest First</SelectItem>
                <SelectItem value="member-first" className="text-xs">Invited First</SelectItem>
                <SelectItem value="self-first" className="text-xs">Waitlist First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Separator />

        {/* Cards grid */}
        {sorted.length > 0 ? (
          <div className="flex flex-col gap-8 max-w-3xl mx-auto w-full">
            {sorted.map((entry) => (
              <AnimatedRemoval key={entry.id} isExiting={exitingIds.has(entry.id)}>
                <ApprovalCard
                  entry={entry}
                  onApprove={handleApprove}
                  onCastVote={handleCastVote}
                  onRetractVote={handleRetractVote}
                  onReject={handleReject}
                  onBan={handleBan}
                />
              </AnimatedRemoval>
            ))}
          </div>
        ) : query.trim() ? (
          <Empty className="border border-dashed border-border bg-muted/20">
            <EmptyHeader>
              <EmptyMedia
                variant="icon"
                className="size-12 rounded-full bg-muted text-muted-foreground"
              >
                <SearchX />
              </EmptyMedia>
              <EmptyTitle>No results</EmptyTitle>
              <EmptyDescription>
                No applicants match "{query.trim()}". Try a different name.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
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
