import * as React from "react"
import type { SortingState, VisibilityState, PaginationState } from "@tanstack/react-table"
import { fetchMembers } from "../lib/members-api"
import { DEFAULT_FILTERS, type MemberFilters, type TableMember } from "../lib/members-config"
import { useMembersStore } from "../lib/members-store"

// ── Debounce ──────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export type MembersDataState = {
  // Search
  search: string
  setSearch: (v: string) => void
  debouncedSearch: string
  // Filters
  appliedFilters: MemberFilters
  setAppliedFilters: (f: MemberFilters) => void
  // Table state (passed through to useReactTable)
  sorting: SortingState
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>
  columnVisibility: VisibilityState
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>
  pagination: PaginationState
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>
  // Server state
  data: TableMember[]
  totalCount: number
  isLoading: boolean
  error: string | null
}

export function useMembersData(initialSearch = ""): MembersDataState {
  const [search, setSearch] = React.useState(initialSearch)
  const [appliedFilters, setAppliedFilters] = React.useState<MemberFilters>(DEFAULT_FILTERS)
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "joinDate", desc: true }])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [data, setData] = React.useState<TableMember[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const debouncedSearch = useDebounce(search, 500)
  const members = useMembersStore()

  // Reset to page 0 when search or filters change.
  // Guard against already being on page 0 to avoid a spurious re-render.
  React.useEffect(() => {
    setPagination((p) => (p.pageIndex === 0 ? p : { ...p, pageIndex: 0 }))
  }, [debouncedSearch, appliedFilters])

  // Fetch — fires when there is an active search query or any filters applied
  React.useEffect(() => {
    const hasActiveFilters =
      appliedFilters.types.length > 0 ||
      appliedFilters.statuses.length > 0 ||
      appliedFilters.subscriptionStatuses.length > 0 ||
      !!appliedFilters.dateFrom ||
      !!appliedFilters.dateTo

    if (!debouncedSearch && !hasActiveFilters) {
      setData([])
      setTotalCount(0)
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const sortState = sorting[0]
        const response = await fetchMembers({
          page: pagination.pageIndex + 1,
          pageSize: pagination.pageSize,
          sortBy: sortState?.id,
          sortOrder: sortState ? (sortState.desc ? "desc" : "asc") : undefined,
          search: debouncedSearch,
          types: appliedFilters.types.length ? appliedFilters.types : undefined,
          statuses: appliedFilters.statuses.length ? appliedFilters.statuses : undefined,
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
          setError("Failed to load members")
          console.error(err)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [
    members,
    debouncedSearch,
    appliedFilters.types,
    appliedFilters.statuses,
    appliedFilters.subscriptionStatuses,
    appliedFilters.dateFrom,
    appliedFilters.dateTo,
    sorting,
    pagination.pageIndex,
    pagination.pageSize,
  ])

  return {
    search, setSearch, debouncedSearch,
    appliedFilters, setAppliedFilters,
    sorting, setSorting,
    columnVisibility, setColumnVisibility,
    pagination, setPagination,
    data, totalCount, isLoading, error,
  }
}
