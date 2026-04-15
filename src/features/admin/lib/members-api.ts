import type { MemberStatus, SubscriptionStatus, TableMember } from "./members-config"

// ── Types ─────────────────────────────────────────────────────────────────────

export type ApiParams = {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  search?: string
  statuses?: string[]
  subscriptionStatuses?: string[]
  dateFrom?: string
  dateTo?: string
}

export type ApiResponse = {
  data: TableMember[]
  totalCount: number
  page: number
  pageSize: number
}

// ── Cache ─────────────────────────────────────────────────────────────────────

// Parsed and normalized once, reused on every subsequent call.
// In production replace getBaseMembers with a real fetch.
let _membersCache: TableMember[] | null = null

async function getBaseMembers(): Promise<TableMember[]> {
  if (_membersCache) return _membersCache
  const response = await import("../../../../data/members.json")
  _membersCache = response.default
    .filter((m: any) => m.status !== "Pending")
    .map((m: any) => ({
      ...m,
      subscriptionRenewalDate: new Date(m.subscriptionRenewalDate),
      status: m.status as MemberStatus,
      subscriptionStatus: m.subscriptionStatus as SubscriptionStatus,
    }))
  return _membersCache
}

// ── Column id → data key mapping ──────────────────────────────────────────────

// TanStack column ids don't always match the underlying data key.
// e.g. the "member" column sorts by "name".
const SORT_KEY_MAP: Record<string, keyof TableMember> = {
  member: "name",
}

// ── Service ───────────────────────────────────────────────────────────────────

export async function fetchMembers(params: ApiParams): Promise<ApiResponse> {
  const allMembers = await getBaseMembers()
  await new Promise((resolve) => setTimeout(resolve, 300))

  let filtered = [...allMembers]

  if (params.search) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.company.toLowerCase().includes(q)
    )
  }

  if (params.statuses?.length) {
    filtered = filtered.filter((m) => params.statuses!.includes(m.status))
  }

  if (params.subscriptionStatuses?.length) {
    filtered = filtered.filter((m) => params.subscriptionStatuses!.includes(m.subscriptionStatus))
  }

  if (params.dateFrom) {
    const from = new Date(params.dateFrom + "T00:00:00")
    filtered = filtered.filter((m) => new Date(m.joinDate + "T00:00:00") >= from)
  }

  if (params.dateTo) {
    const to = new Date(params.dateTo + "T23:59:59")
    filtered = filtered.filter((m) => new Date(m.joinDate + "T00:00:00") <= to)
  }

  if (params.sortBy) {
    const key = SORT_KEY_MAP[params.sortBy] ?? (params.sortBy as keyof TableMember)
    filtered.sort((a, b) => {
      let aVal: any = a[key]
      let bVal: any = b[key]
      if (key === "joinDate") {
        aVal = new Date(a.joinDate + "T00:00:00")
        bVal = new Date(b.joinDate + "T00:00:00")
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
    page: params.page,
    pageSize: params.pageSize,
  }
}
