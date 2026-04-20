import * as React from "react"
import type { SortingState, PaginationState } from "@tanstack/react-table"
import { fetchBannedMembers, DEFAULT_BANNED_FILTERS, type BannedFilters } from "../lib/banned-members-api"
import { useApplicantReviewRecords } from "../lib/applicant-review-store"
import { useMembersStore } from "../lib/members-store"
import type { BannedRow } from "../lib/review-status-types"

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export function useBannedMembersData() {
  const [search, setSearch] = React.useState("")
  const [appliedFilters, setAppliedFilters] = React.useState<BannedFilters>(DEFAULT_BANNED_FILTERS)
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "joinDate", desc: true }])
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [data, setData] = React.useState<BannedRow[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const debouncedSearch = useDebounce(search, 500)
  const reviewRecords = useApplicantReviewRecords()
  const members = useMembersStore()

  React.useEffect(() => {
    setPagination((p) => (p.pageIndex === 0 ? p : { ...p, pageIndex: 0 }))
  }, [debouncedSearch, appliedFilters])

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const sortState = sorting[0]
        const response = await fetchBannedMembers({
          page: pagination.pageIndex + 1,
          pageSize: pagination.pageSize,
          sortBy: sortState?.id,
          sortOrder: sortState ? (sortState.desc ? "desc" : "asc") : undefined,
          search: debouncedSearch || undefined,
          types: appliedFilters.types.length ? appliedFilters.types : undefined,
          subscriptionStatuses: appliedFilters.subscriptionStatuses.length ? appliedFilters.subscriptionStatuses : undefined,
          dateFrom: appliedFilters.dateFrom || undefined,
          dateTo: appliedFilters.dateTo || undefined,
        })
        if (!cancelled) {
          setData(response.data)
          setTotalCount(response.totalCount)
        }
      } catch (err) {
        if (!cancelled) {
          setError("Failed to load banned members")
          console.error(err)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [debouncedSearch, appliedFilters.types, appliedFilters.subscriptionStatuses, appliedFilters.dateFrom, appliedFilters.dateTo, sorting, pagination.pageIndex, pagination.pageSize, reviewRecords, members])

  return {
    search, setSearch, debouncedSearch,
    appliedFilters, setAppliedFilters,
    sorting, setSorting,
    pagination, setPagination,
    data, totalCount, isLoading, error,
  }
}
