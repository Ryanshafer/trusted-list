// ── Constants ─────────────────────────────────────────────────────────────────

export const VOTE_THRESHOLD = 2

// Voting threshold: how many admins must vote to approve

export const CURRENT_ADMIN_ID = "user-ryan-shafer"
export const CURRENT_ADMIN_NAME = "Ryan Shafer"

// ── Filter tabs ────────────────────────────────────────────────────────────────

export const FILTER_TABS = [
  { id: "all" as const, label: "All" },
  { id: "direct" as const, label: "Direct approve" },
  { id: "vote" as const, label: "Requires vote" },
] as const

export type FilterTab = (typeof FILTER_TABS)[number]["id"]
