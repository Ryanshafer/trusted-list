// ── Types ─────────────────────────────────────────────────────────────────────

export type AdminVote = {
  adminId: string
  adminName: string
  votedAt: string
  decision: "approve" | "reject"
}

export type QueueEntry = {
  id: string
  applicant: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
    title: string
    company: string
    location: string
    linkedInUrl: string | null
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
  votes: AdminVote[]
  status: string
}

export type FilterTab = "all" | "direct" | "vote"
