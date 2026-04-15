"use client"

import * as React from "react"
import { CheckCircle2, Trash2, ExternalLink } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { AdminPageLayout } from "./AdminShell"
import {
  useModerationItems,
  removeModerationItem,
  type ModerationItem,
} from "@/features/admin/hooks/useModerationStore"
import { toast } from "@/features/admin/lib/toast"
import requestsData from "../../../../data/requests.json"
import membersData from "../../../../data/members.json"

// ── Constants ─────────────────────────────────────────────────────────────────

const base = import.meta.env.BASE_URL ?? "/"

// ── Severity tiers ────────────────────────────────────────────────────────────

export type SeverityTier = "all" | "critical" | "warning" | "minor"

const SEVERITY_TIERS: Record<string, SeverityTier> = {
  // Tier 1: CRITICAL (Red)
  "Violence or threats": "critical",
  "Illegal activity": "critical",
  "Sexual content": "critical",
  "Extreme Hate Speech": "critical",
  
  // Tier 2: WARNING (Orange/Yellow)
  "Harassment or bullying": "warning",
  "Hate or hateful conduct": "warning",
  "Misinformation": "warning",
  "Spam or scam": "warning",
  
  // Tier 3: MINOR (Blue/Gray)
  "Off-topic Content": "minor",
  "Low-quality/Spammy posts": "minor",
  "Other": "minor",
}

// ── Reason → badge color ──────────────────────────────────────────────────────

const REASON_BADGE_STYLES: Record<string, string> = {
  "Spam or scam":
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400",
  "Harassment or bullying":
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-400",
  "Hate or hateful conduct":
    "border-red-200 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400",
  "Sexual content":
    "border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-800 dark:bg-pink-950/50 dark:text-pink-400",
  "Violence or threats":
    "border-red-300 bg-red-100 text-red-800 dark:border-red-700 dark:bg-red-900/50 dark:text-red-300",
  "Misinformation":
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400",
  "Illegal activity":
    "border-red-300 bg-red-100 text-red-800 dark:border-red-700 dark:bg-red-900/50 dark:text-red-300",
  "Other":
    "border-border bg-muted/50 text-muted-foreground",
}

// Colored left-border accent — provides instant severity triage at a glance.
// Clips cleanly inside overflow-hidden rounded-xl on the Card.
const REASON_ACCENT: Record<string, string> = {
  "Violence or threats":    "border-l-red-500",
  "Illegal activity":       "border-l-red-500",
  "Hate or hateful conduct":"border-l-rose-400",
  "Harassment or bullying": "border-l-orange-400",
  "Sexual content":         "border-l-pink-400",
  "Misinformation":         "border-l-amber-400",
  "Spam or scam":           "border-l-amber-300",
  "Other":                  "border-l-border",
}

function reasonBadgeStyles(reason: string): string {
  return REASON_BADGE_STYLES[reason] ?? REASON_BADGE_STYLES["Other"]
}

function reasonAccent(reason: string): string {
  return REASON_ACCENT[reason] ?? REASON_ACCENT["Other"]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getRequestDetails(requestId: string) {
  return requestsData.find((req) => req.id === requestId)
}

function findMemberByName(name: string) {
  return membersData.find((member) => member.name.toLowerCase() === name.toLowerCase())
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso))
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
}

// ── Moderation card ───────────────────────────────────────────────────────────

function navigateToMember(name: string) {
  const member = findMemberByName(name)
  if (member) {
    localStorage.setItem("adminEditMemberId", member.id)
    localStorage.setItem("adminEditMemberName", member.name)
    window.location.href = `${base}admin/members`
  } else {
    toast.warning(`"${name}" is not a member`, {
      description: "This person doesn't have a member profile in the system.",
    })
  }
}

function ModerationCard({ item }: { item: ModerationItem }) {
  const handleDismiss = () => {
    removeModerationItem(item.id)
    toast.success("Complaint dismissed.")
  }

  const handleDelete = () => {
    removeModerationItem(item.id)
    toast.success("Content removed from platform.")
  }

  const requestDetails = getRequestDetails(item.requestId)

  return (
    <Card
      className={`overflow-hidden rounded-xl border-l-4 transition-shadow hover:shadow-md ${reasonAccent(item.reason)}`}
    >
      {/* Metadata strip — tinted background separates context from content
          without a hard separator line */}
      <div className="flex items-center gap-3 bg-muted/30 px-5 py-3">
        <Badge
          variant="outline"
          className={`shrink-0 rounded-full text-xs font-semibold ${reasonBadgeStyles(item.reason)}`}
        >
          {item.reason}
        </Badge>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-xs text-muted-foreground">Reported by</span>
          <Avatar className="h-5 w-5 shrink-0 rounded-full border border-border">
            <AvatarImage
              src={item.reporter.avatarUrl ?? ""}
              alt={item.reporter.name}
              className="object-cover"
            />
            <AvatarFallback className="rounded-full text-[8px] font-semibold">
              {initials(item.reporter.name)}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => navigateToMember(item.reporter.name)}
            className="text-xs font-medium text-foreground hover:text-primary hover:underline"
          >
            {item.reporter.name}
          </button>
          <span className="text-xs text-muted-foreground/60">·</span>
          <a
            href={`mailto:${item.reporter.email}`}
            className="truncate text-xs text-primary hover:underline"
          >
            {item.reporter.email}
          </a>

        </div>

        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {timeAgo(item.reportedAt)}
          </span>
          <span className="text-xs tabular-nums text-muted-foreground/60">
            {formatDate(item.reportedAt)}
          </span>
        </div>
      </div>

      {/* Request context — shows which request is being reported */}
      {requestDetails && (
        <div className="px-5 py-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 shrink-0 rounded-full border border-border">
              <AvatarImage
                src={requestDetails.avatarUrl ?? ""}
                alt={requestDetails.name}
                className="object-cover"
              />
              <AvatarFallback className="rounded-full text-xs font-semibold">
                {initials(requestDetails.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <a
                href={`/trusted-list/requests/${item.requestId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                {requestDetails.requestSummary || requestDetails.subtitle || "Untitled request"}
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
              <p className="text-xs text-muted-foreground mt-0.5">
                Request by 
                <button
                  onClick={() => navigateToMember(requestDetails.name)}
                  className="text-primary hover:underline font-medium"
                >
                  {requestDetails.name}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      <Separator />

      {/* Complaint body */}
      <div className="px-5 py-5">
        <h3 className="text-sm font-medium text-foreground mb-2">Complaint Details</h3>
        <p className="text-sm leading-relaxed text-foreground/90">
          {item.complaintText}
        </p>
      </div>

      <Separator />

      {/* Decision actions */}
      <CardFooter className="justify-end gap-2 px-5 py-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-full gap-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={handleDismiss}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Dismiss
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-full gap-1.5 text-xs font-semibold border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Content
        </Button>
      </CardFooter>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ModerationQueuePage() {
  const items = useModerationItems()
  const [activeTab, setActiveTab] = React.useState<SeverityTier>("all")

  // Filter items by severity tier
  const filteredItems = React.useMemo(() => {
    if (activeTab === "all") return items
    return items.filter((item) => SEVERITY_TIERS[item.reason] === activeTab)
  }, [items, activeTab])

  return (
    <AdminPageLayout>
      <div className="flex flex-col gap-6">
        {/* Page header */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Moderation Queue
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {filteredItems.length} pending review{filteredItems.length !== 1 ? "s" : ""}
          </p>
        </div>
        
        {/* Severity filter tabs */}
        <div className="flex justify-center">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SeverityTier)}>
            <TabsList className="rounded-full bg-muted/30">
            <TabsTrigger
              value="all"
              className="rounded-full px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="critical"
              className="rounded-full px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm text-destructive data-[state=active]:text-destructive"
            >
              Critical
            </TabsTrigger>
            <TabsTrigger
              value="warning"
              className="rounded-full px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm text-orange-500 data-[state=active]:text-orange-500"
            >
              Warning
            </TabsTrigger>
            <TabsTrigger
              value="minor"
              className="rounded-full px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm text-muted-foreground data-[state=active]:text-foreground"
            >
              Minor
            </TabsTrigger>
          </TabsList>
        </Tabs>
        </div>
        
        <Separator />
        {/* Queue list or empty state */}
        {filteredItems.length > 0 ? (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
            {filteredItems.map((item) => (
              <ModerationCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <Empty className="border border-dashed border-border bg-muted/20">
            <EmptyHeader>
              <EmptyMedia
                variant="icon"
                className="size-12 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
              >
                <CheckCircle2 />
              </EmptyMedia>
              <EmptyTitle>All clear!</EmptyTitle>
              <EmptyDescription>
                No pending moderation reviews.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </AdminPageLayout>
  )
}
