import { updateMemberStatus } from "./members-store"
import { returnApplicantToQueue } from "@/features/admin/hooks/useApprovalQueueStore"

export function releaseApplicantHold(id: string) {
  return returnApplicantToQueue(id)
}

export function unbanPerson(id: string, kind: "member" | "applicant") {
  if (kind === "member") {
    updateMemberStatus(id, "Active")
    return { kind, id }
  }

  return returnApplicantToQueue(id)
}
