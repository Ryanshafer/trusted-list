import * as React from "react"
import queueRaw from "../../../../data/approval-queue.json"
import { removeApplicantReviewRecord, upsertApplicantReviewRecord } from "@/features/admin/lib/applicant-review-store"

// ── Type ──────────────────────────────────────────────────────────────────────

export type ApprovalQueueItem = {
  id: string
  applicant: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
    company: string
    linkedInUrl: string
  }
  inviter: {
    id: string
    name: string
    avatarUrl: string | null
    title: string
    company: string
  }
  recommendationText: string
  appliedAt: string
  requiresVote: boolean
  applicationType: "waitlist" | "invited"
  votes: Array<{
    adminId: string
    adminName: string
    votedAt: string
    decision: "approve" | "hold"
  }>
  status: string
}

// ── Module-level store ────────────────────────────────────────────────────────
// Shared across all React trees on the same page via module scope.
// Both AdminNav (for the badge count) and ApprovalQueuePage (for the list)
// subscribe to the same state and stay in sync automatically.

let _items: ApprovalQueueItem[] = queueRaw as ApprovalQueueItem[]

const DEMO_ON_HOLD: Record<string, string> = {
  "aq-002": "Applicant profile lacks sufficient seniority for the current cohort.",
  "aq-004": "Needs more demonstrated leadership experience before approval.",
}

// Initialize some applicants with on-hold status for demo purposes
function initializeDemoOnHoldApplicants() {
  Object.keys(DEMO_ON_HOLD).forEach(id => {
    const entry = _items.find(item => item.id === id)
    if (entry) {
      upsertApplicantReviewRecord(entry, "on-hold", DEMO_ON_HOLD[id])
      _items = _items.filter(item => item.id !== id)
    }
  })
}

// Initialize demo data
initializeDemoOnHoldApplicants()
const _listeners = new Set<() => void>()

function _notify() {
  _listeners.forEach((l) => l())
}

const _subscribe = (cb: () => void): (() => void) => {
  _listeners.add(cb)
  return () => _listeners.delete(cb)
}

const _getSnapshot = (): ApprovalQueueItem[] => _items

// ── Public API ────────────────────────────────────────────────────────────────

/** Add an item back to the queue (e.g. after an undo). */
export function restoreApprovalQueueItem(entry: ApprovalQueueItem): void {
  _items = [..._items, entry]
  _notify()
}

/** Remove an item by id and notify all subscribers. */
export function removeApprovalQueueItem(id: string): void {
  _items = _items.filter((item) => item.id !== id)
  _notify()
}

function takeApprovalQueueItem(id: string): ApprovalQueueItem | undefined {
  const existing = _items.find((item) => item.id === id)
  if (!existing) return undefined
  _items = _items.filter((item) => item.id !== id)
  _notify()
  return existing
}

export function placeApplicantOnHold(id: string): ApprovalQueueItem | undefined {
  const entry = takeApprovalQueueItem(id)
  if (!entry) return undefined
  upsertApplicantReviewRecord(entry, "on-hold")
  return entry
}

export function banApplicantFromQueue(id: string): ApprovalQueueItem | undefined {
  const entry = takeApprovalQueueItem(id)
  if (!entry) return undefined
  upsertApplicantReviewRecord(entry, "banned")
  return entry
}

export function returnApplicantToQueue(id: string): ApprovalQueueItem | undefined {
  const record = removeApplicantReviewRecord(id)
  if (!record) return undefined

  const entry: ApprovalQueueItem = {
    id: record.id,
    applicant: {
      ...record.applicant,
      linkedInUrl: record.applicant.linkedInUrl ?? "",
    },
    inviter: record.inviter,
    recommendationText: record.recommendationText,
    appliedAt: record.appliedAt,
    requiresVote: record.requiresVote,
    applicationType: record.applicationType,
    votes: record.votes,
    status: "Pending",
  }

  _items = [..._items, entry]
  _notify()
  return entry
}

/**
 * Add the current admin's vote to an entry. Returns vote totals so the caller
 * can decide whether to resolve (approve/hold) the application.
 */
export function castVoteOnQueueItem(
  id: string,
  decision: "approve" | "hold",
  adminId: string,
  adminName: string,
): { approveVotes: number; holdVotes: number } {
  const entry = _items.find((item) => item.id === id)
  if (!entry) return { approveVotes: 0, holdVotes: 0 }

  const newVote = { adminId, adminName, votedAt: new Date().toISOString(), decision }
  const updatedVotes = [
    ...entry.votes.filter((v) => v.adminId !== adminId),
    newVote,
  ]

  _items = _items.map((item) =>
    item.id === id ? { ...item, votes: updatedVotes } : item
  )

  _notify()

  const approveVotes = updatedVotes.filter((v) => v.decision === "approve").length
  const holdVotes = updatedVotes.filter((v) => v.decision === "hold").length
  return { approveVotes, holdVotes }
}

export function retractVoteOnQueueItem(
  id: string,
  adminId: string,
): void {
  const entry = _items.find((item) => item.id === id)
  if (!entry) return

  _items = _items.map((item) =>
    item.id === id
      ? { ...item, votes: item.votes.filter((v) => v.adminId !== adminId) }
      : item
  )

  _notify()
}

/** Subscribe to the approval queue item list. Re-renders on every change. */
export function useApprovalQueueItems(): ApprovalQueueItem[] {
  return React.useSyncExternalStore(_subscribe, _getSnapshot, _getSnapshot)
}

/** Subscribe to the count only. Same re-render cost but communicates intent. */
export function useApprovalQueueCount(): number {
  const items = useApprovalQueueItems()
  return React.useMemo(() => items.length, [items])
}
