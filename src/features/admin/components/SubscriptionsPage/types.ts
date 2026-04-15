export type Plan = "Pro" | "Trial" | "Free"
export type SubStatus = "Active" | "Canceled" | "Expired"

export type Subscription = {
  id: string
  memberId: string
  memberName: string
  memberTitle: string
  memberCompany: string
  email: string
  avatarUrl: string
  plan: Plan
  billingCycle: string
  amountCents: number
  startDate: string
  renewalDate: string
  status: SubStatus
}

export type RowAction =
  | { type: "toggle-status"; sub: Subscription }
  | { type: "edit-renewal";  sub: Subscription }
  | { type: "cancel";        sub: Subscription }
  | { type: "refund";        sub: Subscription }
  | { type: "cancel-tx";     sub: Subscription }
