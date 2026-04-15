import { format } from "date-fns"

export function formatAmount(cents: number) {
  if (cents === 0) return "Free"
  return `$${(cents / 100).toFixed(2)}`
}

export function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function memberInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}
