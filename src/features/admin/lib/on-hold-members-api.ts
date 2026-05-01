import type { BaseFilters } from "@/components/FilterSidebar"
import { getApplicantReviewRecords } from "./applicant-review-store"
import type { OnHoldApplicantRow } from "./review-status-types"

export type OnHoldFilters = BaseFilters & {
  types: string[]
}

export const DEFAULT_ON_HOLD_FILTERS: OnHoldFilters = {
  dateFrom: "",
  dateTo: "",
  audiences: [],
  types: [],
}

function getOnHoldApplicants(): OnHoldApplicantRow[] {
  return getApplicantReviewRecords()
    .filter((record) => record.status === "on-hold")
    .map((record) => ({
      kind: "applicant",
      id: record.id,
      applicantId: record.applicantId,
      name: record.applicant.name,
      email: record.applicant.email,
      avatarUrl: record.applicant.avatarUrl ?? null,
      title: "Applicant",
      company: record.applicant.company,
      linkedInUrl: record.applicant.linkedInUrl ?? null,
      applicationType: record.applicationType,
      appliedAt: record.appliedAt,
      inviterName: record.inviter.name,
      recommendationText: record.recommendationText,
      holdReason: record.holdReason,
    }))
}

const SORT_KEY_MAP: Record<string, keyof OnHoldApplicantRow> = {
  member: "name",
  appliedAt: "appliedAt",
}

export async function fetchOnHoldMembers(params: {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  search?: string
  types?: string[]
  dateFrom?: string
  dateTo?: string
}): Promise<{ data: OnHoldApplicantRow[]; totalCount: number }> {
  const all = getOnHoldApplicants()
  await new Promise((resolve) => setTimeout(resolve, 250))

  let filtered = [...all]

  if (params.search) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter(
      (applicant) =>
        applicant.name.toLowerCase().includes(q) ||
        applicant.email.toLowerCase().includes(q) ||
        applicant.company.toLowerCase().includes(q)
    )
  }

  if (params.types?.length) {
    filtered = filtered.filter((applicant) => params.types!.includes(applicant.applicationType))
  }

  if (params.dateFrom) {
    const from = new Date(params.dateFrom + "T00:00:00")
    filtered = filtered.filter((applicant) => new Date(applicant.appliedAt) >= from)
  }

  if (params.dateTo) {
    const to = new Date(params.dateTo + "T23:59:59")
    filtered = filtered.filter((applicant) => new Date(applicant.appliedAt) <= to)
  }

  if (params.sortBy) {
    const key = SORT_KEY_MAP[params.sortBy] ?? (params.sortBy as keyof OnHoldApplicantRow)
    filtered.sort((a, b) => {
      const aVal = key === "appliedAt" ? new Date(a.appliedAt).getTime() : String(a[key] ?? "")
      const bVal = key === "appliedAt" ? new Date(b.appliedAt).getTime() : String(b[key] ?? "")
      return params.sortOrder === "asc"
        ? aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        : aVal > bVal ? -1 : aVal < bVal ? 1 : 0
    })
  }

  const start = (params.page - 1) * params.pageSize
  return {
    data: filtered.slice(start, start + params.pageSize),
    totalCount: filtered.length,
  }
}
