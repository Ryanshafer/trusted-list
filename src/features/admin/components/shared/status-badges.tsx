import { Badge } from "@/components/ui/badge"
import { STATUS_CONFIG, SUBSCRIPTION_CONFIG, type MemberStatus, type SubscriptionStatus } from "@/features/admin/lib/members-config"

const APPLICATION_TYPE_CONFIG = {
  invited: {
    label: "Invited",
    className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400",
  },
  waitlist: {
    label: "Waitlist",
    className: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-400",
  },
} as const

export function ApplicationTypeBadge({ applicationType }: { applicationType: "waitlist" | "invited" }) {
  const cfg = APPLICATION_TYPE_CONFIG[applicationType]
  return (
    <Badge variant="outline" className={`rounded-full text-[11px] font-semibold ${cfg.className}`}>
      {cfg.label}
    </Badge>
  )
}

export function StatusBadge({ status }: { status: MemberStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={`rounded-full text-[11px] font-semibold ${cfg.className}`}>
      {cfg.label}
    </Badge>
  )
}

export function SubscriptionBadge({ status }: { status: SubscriptionStatus | null }) {
  const cfg = status ? SUBSCRIPTION_CONFIG[status] : SUBSCRIPTION_CONFIG.None
  return (
    <Badge variant="outline" className={`rounded-full text-[11px] font-semibold ${cfg.className}`}>
      {cfg.label}
    </Badge>
  )
}
