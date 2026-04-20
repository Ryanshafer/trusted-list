import type { BaseFilters } from "@/components/FilterSidebar"
import { getApplicantReviewRecords } from "./applicant-review-store"
import { getMembersSnapshot } from "./members-store"
import type { BannedApplicantRow, BannedMemberRow, BannedRow } from "./review-status-types"

export type BannedFilters = BaseFilters & {
  types: string[]
  subscriptionStatuses: string[]
}

export const DEFAULT_BANNED_FILTERS: BannedFilters = {
  dateFrom: "",
  dateTo: "",
  audiences: [],
  types: [],
  subscriptionStatuses: [],
}

function getBannedApplicants(): BannedApplicantRow[] {
  return getApplicantReviewRecords()
    .filter((record) => record.status === "banned")
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
      joinDate: null,
      subscriptionStatus: null,
      inviteQuota: null,
      hasUnlimitedInvites: null,
      subscriptionEnabled: null,
      subscriptionRenewalDate: null,
    }))
}

function getBannedMembers(): BannedMemberRow[] {
  return getMembersSnapshot()
    .filter((member) => member.status === "Banned")
    .map((member) => ({
      kind: "member",
      id: member.id,
      name: member.name,
      email: member.email,
      avatarUrl: member.avatarUrl,
      title: member.title,
      company: member.company,
      linkedInUrl: member.linkedInUrl,
      applicationType: member.applicationType,
      joinDate: member.joinDate,
      subscriptionStatus: member.subscriptionStatus,
      inviteQuota: member.inviteQuota,
      hasUnlimitedInvites: member.hasUnlimitedInvites,
      subscriptionEnabled: member.subscriptionEnabled,
      subscriptionRenewalDate: member.subscriptionRenewalDate,
    }))
}

const SORT_KEY_MAP: Record<string, keyof BannedRow> = {
  member: "name",
}

export async function fetchBannedMembers(params: {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  search?: string
  types?: string[]
  subscriptionStatuses?: string[]
  dateFrom?: string
  dateTo?: string
}): Promise<{ data: BannedRow[]; totalCount: number }> {
  const all = [...getBannedMembers(), ...getBannedApplicants()]
  await new Promise((resolve) => setTimeout(resolve, 250))

  let filtered = [...all]

  if (params.search) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter(
      (person) =>
        person.name.toLowerCase().includes(q) ||
        person.email.toLowerCase().includes(q) ||
        person.company.toLowerCase().includes(q)
    )
  }

  if (params.types?.length) {
    filtered = filtered.filter((person) => params.types!.includes(person.applicationType))
  }

  if (params.subscriptionStatuses?.length) {
    filtered = filtered.filter(
      (person) => person.subscriptionStatus !== null && params.subscriptionStatuses!.includes(person.subscriptionStatus)
    )
  }

  if (params.dateFrom) {
    const from = new Date(params.dateFrom + "T00:00:00")
    filtered = filtered.filter((person) => {
      const date = person.kind === "member" ? person.joinDate : person.appliedAt
      return date ? new Date(date + (person.kind === "member" ? "T00:00:00" : "")) >= from : false
    })
  }

  if (params.dateTo) {
    const to = new Date(params.dateTo + "T23:59:59")
    filtered = filtered.filter((person) => {
      const date = person.kind === "member" ? person.joinDate : person.appliedAt
      return date ? new Date(date + (person.kind === "member" ? "T00:00:00" : "")) <= to : false
    })
  }

  if (params.sortBy) {
    const key = SORT_KEY_MAP[params.sortBy] ?? (params.sortBy as keyof BannedRow)
    filtered.sort((a, b) => {
      let aVal: number | string = ""
      let bVal: number | string = ""
      if (key === "joinDate") {
        aVal = a.kind === "member" && a.joinDate ? new Date(a.joinDate + "T00:00:00").getTime() : new Date((a as BannedApplicantRow).appliedAt).getTime()
        bVal = b.kind === "member" && b.joinDate ? new Date(b.joinDate + "T00:00:00").getTime() : new Date((b as BannedApplicantRow).appliedAt).getTime()
      } else {
        aVal = String(a[key] ?? "")
        bVal = String(b[key] ?? "")
      }
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
