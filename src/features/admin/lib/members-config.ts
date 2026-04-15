import type { BaseFilters } from "@/components/FilterSidebar"

// ── Types ─────────────────────────────────────────────────────────────────────

export type MemberStatus = "Active" | "Banned" | "Waitlisted"
export type SubscriptionStatus = "Pro" | "Free" | "Trial" | "Cancelled" | "None"

export type TableMember = {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  title: string
  company: string
  location: string
  linkedInUrl: string | null
  status: MemberStatus
  joinDate: string
  subscriptionStatus: SubscriptionStatus
  inviteQuota: number
  hasUnlimitedInvites: boolean
  subscriptionEnabled: boolean
  subscriptionRenewalDate: Date
  stripe_customer_id: string | null
}

export type EditMember = {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
  linkedinUrl: string
  status: "active" | "banned" | "waitlisted"
  inviteQuota: number
  hasUnlimitedInvites: boolean
  subscriptionEnabled: boolean
  subscriptionRenewalDate: Date
}

export type MemberFilters = BaseFilters & {
  statuses: string[]
  subscriptionStatuses: string[]
}

// ── Badge config ──────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<MemberStatus, { label: string; className: string }> = {
  Active:     { label: "Active",     className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400" },
  Banned:     { label: "Banned",     className: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400" },
  Waitlisted: { label: "Waitlisted", className: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-400" },
}

export const SUBSCRIPTION_CONFIG: Record<SubscriptionStatus, { label: string; className: string }> = {
  Pro:       { label: "Pro",       className: "border-primary/30 bg-primary/10 text-primary" },
  Free:      { label: "Free",      className: "border-border bg-muted/50 text-muted-foreground" },
  Trial:     { label: "Trial",     className: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-400" },
  Cancelled: { label: "Cancelled", className: "border-neutral-200 bg-neutral-100 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-400 line-through" },
  None:      { label: "—",         className: "border-transparent bg-transparent text-muted-foreground/50" },
}

export const ALL_STATUSES: MemberStatus[] = ["Active", "Waitlisted", "Banned"]

export const DEFAULT_FILTERS: MemberFilters = {
  dateFrom: "",
  dateTo: "",
  audiences: [],
  statuses: [],
  subscriptionStatuses: [],
}
