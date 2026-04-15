// ── Helpers ───────────────────────────────────────────────────────────────────

const base = import.meta.env.BASE_URL ?? "/"

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
}

export function getMemberUrl(name: string): string {
  return `${base}members/${name.toLowerCase().replace(/\s+/g, "-")}`
}
