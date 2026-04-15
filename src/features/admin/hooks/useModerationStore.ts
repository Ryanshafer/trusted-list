import * as React from "react"
import moderationItemsRaw from "../../../../data/moderation-items.json"

// ── Type ──────────────────────────────────────────────────────────────────────

export type ModerationReporter = {
  name: string
  email: string
  avatarUrl: string | null
}

export type ModerationItem = {
  id: string
  requestId: string
  reason: string
  complaintText: string
  reportedAt: string
  reporter: ModerationReporter
}

// ── Module-level store ────────────────────────────────────────────────────────
// Shared across all React trees on the same page via module scope.
// Both AdminNav (for the badge count) and ModerationQueuePage (for the list)
// subscribe to the same state and stay in sync automatically.

let _items: ModerationItem[] = moderationItemsRaw as ModerationItem[]
const _listeners = new Set<() => void>()

function _notify() {
  _listeners.forEach((l) => l())
}

const _subscribe = (cb: () => void): (() => void) => {
  _listeners.add(cb)
  return () => _listeners.delete(cb)
}

const _getSnapshot = (): ModerationItem[] => _items

// ── Public API ────────────────────────────────────────────────────────────────

/** Remove an item by id and notify all subscribers. */
export function removeModerationItem(id: string): void {
  _items = _items.filter((item) => item.id !== id)
  _notify()
}

/** Subscribe to the moderation item list. Re-renders on every change. */
export function useModerationItems(): ModerationItem[] {
  return React.useSyncExternalStore(_subscribe, _getSnapshot, _getSnapshot)
}

/** Subscribe to the count only. Same re-render cost but communicates intent. */
export function useModerationCount(): number {
  const items = useModerationItems()
  return React.useMemo(() => items.length, [items])
}
