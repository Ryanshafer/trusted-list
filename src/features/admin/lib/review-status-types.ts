import type { SubscriptionStatus, TableMember } from "./members-config"
import type { ApplicantReviewRecord } from "./applicant-review-store"

export type OnHoldApplicantRow = {
  kind: "applicant"
  id: ApplicantReviewRecord["id"]
  applicantId: ApplicantReviewRecord["applicantId"]
  name: string
  email: string
  avatarUrl: string | null
  title: string
  company: string
  linkedInUrl: string | null
  applicationType: ApplicantReviewRecord["applicationType"]
  appliedAt: string
  inviterName: string
  recommendationText: string
}

export type BannedApplicantRow = {
  kind: "applicant"
  id: ApplicantReviewRecord["id"]
  applicantId: ApplicantReviewRecord["applicantId"]
  name: string
  email: string
  avatarUrl: string | null
  title: string
  company: string
  linkedInUrl: string | null
  applicationType: ApplicantReviewRecord["applicationType"]
  appliedAt: string
  joinDate: null
  subscriptionStatus: null
  inviteQuota: number | null
  hasUnlimitedInvites: boolean | null
  subscriptionEnabled: boolean | null
  subscriptionRenewalDate: null
}

export type BannedMemberRow = {
  kind: "member"
  id: TableMember["id"]
  name: string
  email: string
  avatarUrl: string | null
  title: string
  company: string
  linkedInUrl: string | null
  applicationType: TableMember["applicationType"]
  joinDate: string | null
  subscriptionStatus: SubscriptionStatus
  inviteQuota: number
  hasUnlimitedInvites: boolean
  subscriptionEnabled: boolean
  subscriptionRenewalDate: Date
}

export type BannedRow = BannedApplicantRow | BannedMemberRow
