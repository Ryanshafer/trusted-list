import { Badge } from "@/components/ui/badge"
import type { Plan, SubStatus } from "./types"

export const PLAN_CONFIG: Record<Plan, string> = {
  Pro:   "border-primary/30 bg-primary/10 text-primary",
  Trial: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-400",
  Free:  "border-border bg-muted/50 text-muted-foreground",
}

export const STATUS_CONFIG: Record<SubStatus, { label: string; className: string }> = {
  Active:   { label: "Active",   className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400" },
  Canceled: { label: "Canceled", className: "border-neutral-200 bg-neutral-100 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-400" },
  Expired:  { label: "Expired",  className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400" },
}

export const ALL_STATUSES: SubStatus[] = ["Active", "Canceled", "Expired"]

export function PlanBadge({ plan }: { plan: Plan }) {
  return (
    <Badge variant="outline" className={`rounded-full text-[11px] font-semibold ${PLAN_CONFIG[plan]}`}>
      {plan}
    </Badge>
  )
}

export function StatusBadge({ status }: { status: SubStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={`rounded-full text-[11px] font-semibold ${cfg.className}`}>
      {cfg.label}
    </Badge>
  )
}
