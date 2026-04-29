// ── Types ─────────────────────────────────────────────────────────────────────

export type AdminVote = {
  adminId: string
  adminName: string
  votedAt: string
  decision: "approve" | "hold"
}

export type QueueEntry = {
  id: string
  applicant: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
    company: string
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
  applicationType: "waitlist" | "invited"
  votes: AdminVote[]
  status: string
}
