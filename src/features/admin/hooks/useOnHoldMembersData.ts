import * as React from "react"
import type { SortingState, PaginationState } from "@tanstack/react-table"
import { fetchOnHoldMembers, DEFAULT_ON_HOLD_FILTERS, type OnHoldFilters } from "../lib/on-hold-members-api"
import { useApplicantReviewRecords } from "../lib/applicant-review-store"
import type { OnHoldApplicantRow } from "../lib/review-status-types"

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export function useOnHoldMembersData() {
  const [search, setSearch] = React.useState("")
  const [appliedFilters, setAppliedFilters] = React.useState<OnHoldFilters>(DEFAULT_ON_HOLD_FILTERS)
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "member", desc: false }])
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [data, setData] = React.useState<OnHoldApplicantRow[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const debouncedSearch = useDebounce(search, 500)
  const reviewRecords = useApplicantReviewRecords()

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
        const response = await fetchOnHoldMembers({
          page: pagination.pageIndex + 1,
          pageSize: pagination.pageSize,
          sortBy: sortState?.id,
          sortOrder: sortState ? (sortState.desc ? "desc" : "asc") : undefined,
          search: debouncedSearch || undefined,
          types: appliedFilters.types.length ? appliedFilters.types : undefined,
          dateFrom: appliedFilters.dateFrom || undefined,
          dateTo: appliedFilters.dateTo || undefined,
        })
        if (!cancelled) {
          setData(response.data)
          setTotalCount(response.totalCount)
        }
      } catch (err) {
        if (!cancelled) {
          setError("Failed to load on-hold members")
          console.error(err)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [debouncedSearch, appliedFilters.types, appliedFilters.dateFrom, appliedFilters.dateTo, sorting, pagination.pageIndex, pagination.pageSize, reviewRecords])

  return {
    search, setSearch, debouncedSearch,
    appliedFilters, setAppliedFilters,
    sorting, setSorting,
    pagination, setPagination,
    data, totalCount, isLoading, error,
  }
}
