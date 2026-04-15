import * as React from "react"
import queueRaw from "../../../../data/approval-queue.json"

// ── Type ──────────────────────────────────────────────────────────────────────

export type ApprovalQueueItem = {
  id: string
  applicant: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
    title: string
    company: string
    location: string
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
  votes: Array<{
    adminId: string
    adminName: string
    votedAt: string
    decision: "approve" | "reject"
  }>
  status: string
}

// ── Module-level store ────────────────────────────────────────────────────────
// Shared across all React trees on the same page via module scope.
// Both AdminNav (for the badge count) and ApprovalQueuePage (for the list)
// subscribe to the same state and stay in sync automatically.

let _items: ApprovalQueueItem[] = queueRaw as ApprovalQueueItem[]
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

/** Remove an item by id and notify all subscribers. */
export function removeApprovalQueueItem(id: string): void {
  _items = _items.filter((item) => item.id !== id)
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