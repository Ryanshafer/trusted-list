import * as React from "react"
import type { ApprovalQueueItem } from "@/features/admin/hooks/useApprovalQueueStore"

export type ApplicantReviewStatus = "pending" | "on-hold" | "banned"

export type ApplicantReviewRecord = {
  id: string
  applicantId: string
  status: ApplicantReviewStatus
  appliedAt: string
  applicationType: ApprovalQueueItem["applicationType"]
  requiresVote: boolean
  votes: ApprovalQueueItem["votes"]
  recommendationText: string
  applicant: ApprovalQueueItem["applicant"]
  inviter: ApprovalQueueItem["inviter"]
  holdReason?: string
}

let _records: ApplicantReviewRecord[] = []
const _listeners = new Set<() => void>()

function notify() {
  _listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  _listeners.add(listener)
  return () => _listeners.delete(listener)
}

function getSnapshot() {
  return _records
}

export function useApplicantReviewRecords(): ApplicantReviewRecord[] {
  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function getApplicantReviewRecords(): ApplicantReviewRecord[] {
  return _records
}

export function upsertApplicantReviewRecord(entry: ApprovalQueueItem, status: Exclude<ApplicantReviewStatus, "pending">, holdReason?: string): void {
  const nextRecord: ApplicantReviewRecord = {
    id: entry.id,
    applicantId: entry.applicant.id,
    status,
    appliedAt: entry.appliedAt,
    applicationType: entry.applicationType,
    requiresVote: entry.requiresVote,
    votes: entry.votes,
    recommendationText: entry.recommendationText,
    applicant: {
      ...entry.applicant,
      avatarUrl: entry.applicant.avatarUrl ?? null,
      linkedInUrl: entry.applicant.linkedInUrl ?? null,
    },
    inviter: {
      ...entry.inviter,
      avatarUrl: entry.inviter.avatarUrl ?? null,
    },
    holdReason,
  }

  _records = [..._records.filter((record) => record.id !== entry.id), nextRecord]
  notify()
}

export function removeApplicantReviewRecord(id: string): ApplicantReviewRecord | undefined {
  const existing = _records.find((record) => record.id === id)
  if (!existing) return undefined
  _records = _records.filter((record) => record.id !== id)
  notify()
  return existing
}
