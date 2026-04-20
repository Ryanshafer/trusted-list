import * as React from "react"
import membersRaw from "../../../../data/members.json"
import type { MemberStatus, SubscriptionStatus, TableMember } from "./members-config"

type MemberRecord = TableMember

let _members: MemberRecord[] = (membersRaw as Array<Record<string, unknown>>).map((member) => ({
  ...member,
  subscriptionRenewalDate: new Date(String(member.subscriptionRenewalDate)),
  status: member.status as MemberStatus,
  subscriptionStatus: member.subscriptionStatus as SubscriptionStatus,
  avatarUrl: (member.avatarUrl as string | null | undefined) ?? null,
  linkedInUrl: (member.linkedInUrl as string | null | undefined) ?? null,
  stripe_customer_id: (member.stripe_customer_id as string | null | undefined) ?? null,
  joinDate: (member.joinDate as string | null | undefined) ?? null,
  applicationType: ((member.applicationType as "waitlist" | "invited" | undefined) ?? "invited"),
}))

const _listeners = new Set<() => void>()

function notify() {
  _listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  _listeners.add(listener)
  return () => _listeners.delete(listener)
}

function getSnapshot() {
  return _members
}

export function useMembersStore(): MemberRecord[] {
  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function getMembersSnapshot(): MemberRecord[] {
  return _members
}

export function updateMemberStatus(id: string, status: MemberStatus): void {
  _members = _members.map((member) => (member.id === id ? { ...member, status } : member))
  notify()
}
