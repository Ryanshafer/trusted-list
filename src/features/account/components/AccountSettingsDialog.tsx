"use client"

import * as React from "react"
import {
  AlertTriangle,
  Ban,
  Bell,
  CreditCard,
  Mail,
  Shield,
  Smartphone,
  Sparkles,
  Upload,
  UserRound,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifChannels = { inApp: boolean; email: boolean }

type NotifKey =
  | "volunteerHelp"
  | "directRequest"
  | "newMessage"
  | "feedbackLeft"
  | "reminderFires"
  | "circlePosted"
  | "circleJoinRequest"
  | "skillValidated"
  | "recommendationOutcome"
  | "weeklyDigest"

type NotifSettings = Record<NotifKey, NotifChannels>

interface BlockedUser {
  id: string
  name: string
  avatar: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_NOTIF: NotifSettings = {
  volunteerHelp:          { inApp: true,  email: true  },
  directRequest:          { inApp: true,  email: true  },
  newMessage:             { inApp: true,  email: false },
  feedbackLeft:           { inApp: true,  email: true  },
  reminderFires:          { inApp: true,  email: false },
  circlePosted:           { inApp: true,  email: false },
  circleJoinRequest:      { inApp: true,  email: true  },
  skillValidated:         { inApp: true,  email: false },
  recommendationOutcome:  { inApp: true,  email: true  },
  weeklyDigest:           { inApp: false, email: true  },
}

const NOTIF_GROUPS: {
  label: string
  rows: { key: NotifKey; label: string; sub?: string; noInApp?: boolean }[]
}[] = [
  {
    label: "My Requests",
    rows: [
      { key: "volunteerHelp", label: "Someone volunteers to help" },
    ],
  },
  {
    label: "Helping Others",
    rows: [
      { key: "directRequest", label: "Direct help request sent to me" },
      { key: "newMessage",    label: "New message in an active chat" },
      { key: "feedbackLeft",  label: "Feedback left on a completed interaction" },
      { key: "reminderFires", label: "A snoozed reminder fires" },
    ],
  },
  {
    label: "My Circle",
    rows: [
      { key: "circlePosted",          label: "Circle member posts a new request" },
      { key: "circleJoinRequest",     label: "Someone requests to join my circle" },
      { key: "skillValidated",        label: "One of my skills is validated" },
      { key: "recommendationOutcome", label: "My recommendation is decided" },
    ],
  },
  {
    label: "Digest & Defaults",
    rows: [
      {
        key: "weeklyDigest",
        label: "Weekly activity digest",
        sub: "A weekly summary of network activity, reminders, and outstanding actions.",
        noInApp: true,
      },
    ],
  },
]

// Derive Section type from the nav items — single source of truth
const NAV_ITEMS = [
  { id: "profile",       label: "Profile",       Icon: UserRound     },
  { id: "notifications", label: "Notifications", Icon: Bell          },
  { id: "blocked",       label: "Blocked Users", Icon: Ban           },
  { id: "security",      label: "Security",      Icon: Shield        },
  { id: "subscription",  label: "Subscription",  Icon: CreditCard    },
  { id: "account",       label: "Account",       Icon: AlertTriangle },
] as const

type Section = typeof NAV_ITEMS[number]["id"]

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AccountSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: { firstName: string; lastName: string; email: string; avatar: string }
  initialSection?: Section
  initialNotif?: NotifSettings
  initialBlockedUsers?: BlockedUser[]
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AccountSettingsDialog({
  open,
  onOpenChange,
  user,
  initialSection = "profile",
  initialNotif = DEFAULT_NOTIF,
  initialBlockedUsers = [],
}: AccountSettingsDialogProps) {
  const [notif, setNotif] = React.useState<NotifSettings>(initialNotif)
  const [blockedUsers, setBlockedUsers] = React.useState<BlockedUser[]>(initialBlockedUsers)
  const [firstName, setFirstName] = React.useState(user.firstName)
  const [lastName, setLastName] = React.useState(user.lastName)
  const [email, setEmail] = React.useState(user.email)
  const [currentPw, setCurrentPw] = React.useState("")
  const [newPw, setNewPw] = React.useState("")
  const [confirmPw, setConfirmPw] = React.useState("")

  function toggleNotif(key: NotifKey, channel: "inApp" | "email") {
    setNotif((prev) => ({
      ...prev,
      [key]: { ...prev[key], [channel]: !prev[key][channel] },
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[860px] h-[600px] p-0 gap-0 overflow-hidden flex flex-col [&>button]:z-20 [&>button]:bg-card [&>button]:border [&>button]:border-border [&>button]:rounded-full [&>button]:h-9 [&>button]:w-9 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:opacity-100 [&>button]:hover:opacity-80 [&>button]:hover:bg-accent [&>button]:right-4 [&>button]:top-4">
        <DialogTitle className="sr-only">Account Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Manage your profile, notifications, security, and account preferences.
        </DialogDescription>

        {/*
          Tabs with vertical orientation handles ARIA (role="tablist/tab/tabpanel")
          and keyboard navigation (↑↓ arrows) without manual state.
          Dialog unmounts content on close, so defaultValue resets naturally on reopen.
        */}
        <Tabs
          defaultValue={initialSection}
          orientation="vertical"
          className="flex flex-1 min-h-0"
        >
          {/* ── Left nav ── */}
          <div className="w-52 shrink-0 flex flex-col py-5 px-2 border-r border-border bg-muted/30">
            <p className="text-sm font-semibold text-muted-foreground px-3 pb-2 mb-3 select-none border-b border-border/60">
              Settings
            </p>
            <TabsList className="flex flex-col h-auto gap-0.5 bg-transparent p-0 justify-start items-stretch">
              {NAV_ITEMS.map(({ id, label, Icon }) => (
                <TabsTrigger
                  key={id}
                  value={id}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors justify-start",
                    "font-normal text-muted-foreground hover:bg-background/50 hover:text-foreground",
                    "data-[state=active]:border data-[state=active]:border-border/60",
                    "data-[state=active]:bg-background data-[state=active]:font-medium",
                    "data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ── Right content ── */}
          <div className="flex-1 overflow-y-auto">
            <TabsContent value="profile" className="mt-0 h-full">
              <ProfileSection
                firstName={firstName}
                lastName={lastName}
                email={email}
                avatar={user.avatar}
                onFirstNameChange={setFirstName}
                onLastNameChange={setLastName}
                onEmailChange={setEmail}
              />
            </TabsContent>

            <TabsContent value="notifications" className="mt-0 h-full">
              <NotificationsSection notif={notif} onToggle={toggleNotif} />
            </TabsContent>

            <TabsContent value="blocked" className="mt-0 h-full">
              <BlockedSection
                users={blockedUsers}
                onUnblock={(id) =>
                  setBlockedUsers((prev) => prev.filter((u) => u.id !== id))
                }
              />
            </TabsContent>

            <TabsContent value="security" className="mt-0 h-full">
              <SecuritySection
                currentPw={currentPw}
                newPw={newPw}
                confirmPw={confirmPw}
                onCurrentChange={setCurrentPw}
                onNewChange={setNewPw}
                onConfirmChange={setConfirmPw}
              />
            </TabsContent>

            <TabsContent value="subscription" className="mt-0 h-full">
              <SubscriptionSection />
            </TabsContent>

            <TabsContent value="account" className="mt-0 h-full">
              <AccountSection />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// ─── Section: Profile ─────────────────────────────────────────────────────────

function ProfileSection({
  firstName,
  lastName,
  email,
  avatar,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
}: {
  firstName: string
  lastName: string
  email: string
  avatar: string
  onFirstNameChange: (v: string) => void
  onLastNameChange: (v: string) => void
  onEmailChange: (v: string) => void
}) {
  const initials = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase()

  return (
    <div className="p-8 flex flex-col gap-7">
      <SectionHeader
        title="Profile"
        description="Update your name, email address, and profile photo."
      />

      <div className="flex items-center gap-5">
        <Avatar className="h-16 w-16 shrink-0 border-[3px] border-primary-foreground shadow-md">
          <AvatarImage src={avatar} alt={`${firstName} ${lastName}`} className="object-cover" />
          <AvatarFallback className="text-base font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full font-semibold gap-2 self-start"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload photo
          </Button>
          <p className="text-xs text-muted-foreground">JPG or PNG, max 2 MB.</p>
        </div>
      </div>

      <Separator />

      <div className="flex gap-4 max-w-sm">
        <FieldRow label="First name">
          <Input
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
          />
        </FieldRow>
        <FieldRow label="Last name">
          <Input
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
          />
        </FieldRow>
      </div>

      <FieldRow
        label="Email address"
        hint="Changing your address requires re-verification. All notification emails route here."
      >
        <Input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="max-w-sm"
        />
      </FieldRow>

      <div>
        <Button className="rounded-full font-semibold px-6">Save changes</Button>
      </div>
    </div>
  )
}

// ─── Section: Notifications ───────────────────────────────────────────────────

function NotificationsSection({
  notif,
  onToggle,
}: {
  notif: NotifSettings
  onToggle: (key: NotifKey, channel: "inApp" | "email") => void
}) {
  return (
    <div className="flex flex-col">
      {/* Sticky header with column labels */}
      <div className="sticky top-0 z-10 flex items-end justify-between bg-background/95 px-8 pb-3 pt-8 backdrop-blur-sm border-b border-border/50">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold text-foreground">Notifications</h2>
          <p className="text-sm text-muted-foreground">
            Choose how and when you hear about activity.
          </p>
        </div>
        <div className="flex shrink-0 pb-0.5">
          <div className="flex w-[72px] items-center justify-center gap-1 text-xs text-muted-foreground">
            <Smartphone className="h-3 w-3" />
            In-App
          </div>
          <div className="flex w-[72px] items-center justify-center gap-1 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            Email
          </div>
        </div>
      </div>

      <div className="px-8 pb-8 flex flex-col gap-7 pt-6">
        {NOTIF_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.label}
            </p>
            <div className="flex flex-col rounded-xl border border-border/60 divide-y divide-border/50 overflow-hidden">
              {group.rows.map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between gap-4 bg-card px-4 py-3.5"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm text-foreground">{row.label}</span>
                    {row.sub && (
                      <span className="text-xs leading-relaxed text-muted-foreground">
                        {row.sub}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0">
                    <div className="flex w-[72px] items-center justify-center">
                      {row.noInApp ? (
                        <span className="text-xs text-muted-foreground/30 select-none">—</span>
                      ) : (
                        <Switch
                          checked={notif[row.key].inApp}
                          onCheckedChange={() => onToggle(row.key, "inApp")}
                          aria-label={`In-app: ${row.label}`}
                        />
                      )}
                    </div>
                    <div className="flex w-[72px] items-center justify-center">
                      <Switch
                        checked={notif[row.key].email}
                        onCheckedChange={() => onToggle(row.key, "email")}
                        aria-label={`Email: ${row.label}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Section: Blocked Users ───────────────────────────────────────────────────

function BlockedSection({
  users,
  onUnblock,
}: {
  users: BlockedUser[]
  onUnblock: (id: string) => void
}) {
  return (
    <div className="p-8 flex flex-col gap-7">
      <SectionHeader
        title="Blocked Users"
        description="Blocked members can't interact with you or see your requests."
      />

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
            <Ban className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No blocked users</p>
        </div>
      ) : (
        <div className="flex flex-col rounded-xl border border-border/60 divide-y divide-border/50 overflow-hidden">
          {users.map((u) => {
            const fallback = u.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
            return (
              <div
                key={u.id}
                className="flex items-center justify-between gap-4 bg-card px-4 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 shrink-0 border-2 border-primary-foreground shadow-md">
                    <AvatarImage src={u.avatar} />
                    <AvatarFallback className="text-xs">{fallback}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">{u.name}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full font-semibold text-xs"
                  onClick={() => onUnblock(u.id)}
                >
                  Unblock
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Section: Security ────────────────────────────────────────────────────────

function SecuritySection({
  currentPw,
  newPw,
  confirmPw,
  onCurrentChange,
  onNewChange,
  onConfirmChange,
}: {
  currentPw: string
  newPw: string
  confirmPw: string
  onCurrentChange: (v: string) => void
  onNewChange: (v: string) => void
  onConfirmChange: (v: string) => void
}) {
  const mismatch =
    newPw.length > 0 && confirmPw.length > 0 && newPw !== confirmPw

  return (
    <div className="p-8 flex flex-col gap-7">
      <SectionHeader
        title="Security"
        description="Update your password to keep your account secure."
      />

      <div className="flex flex-col gap-5 max-w-sm">
        <FieldRow label="Current password">
          <Input
            type="password"
            value={currentPw}
            onChange={(e) => onCurrentChange(e.target.value)}
            autoComplete="current-password"
          />
        </FieldRow>

        <Separator />

        <FieldRow label="New password">
          <Input
            type="password"
            value={newPw}
            onChange={(e) => onNewChange(e.target.value)}
            autoComplete="new-password"
          />
        </FieldRow>

        <FieldRow
          label="Confirm new password"
          hint={mismatch ? "Passwords don't match." : undefined}
          hintDestructive={mismatch}
        >
          <Input
            type="password"
            value={confirmPw}
            onChange={(e) => onConfirmChange(e.target.value)}
            autoComplete="new-password"
            className={mismatch ? "border-destructive focus-visible:ring-destructive/30" : ""}
          />
        </FieldRow>
      </div>

      <div>
        <Button
          className="rounded-full font-semibold px-6"
          disabled={!currentPw || !newPw || !confirmPw || mismatch}
        >
          Update password
        </Button>
      </div>
    </div>
  )
}

// ─── Section: Subscription ────────────────────────────────────────────────────

function SubscriptionSection() {
  return (
    <div className="p-8 flex flex-col gap-7">
      <SectionHeader
        title="Subscription"
        description="Manage your plan and access additional features."
      />

      {/* Current plan */}
      <Card className="rounded-xl bg-muted/20">
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 p-6">
          <div>
            <CardTitle className="text-base">Free plan</CardTitle>
            <CardDescription className="mt-1">
              Core features included. No credit card required.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="rounded-full text-xs shrink-0">
            Current
          </Badge>
        </CardHeader>
      </Card>
    </div>
  )
}

// ─── Section: Account ─────────────────────────────────────────────────────────

function AccountSection() {
  return (
    <div className="p-8 flex flex-col gap-8">
      <SectionHeader
        title="Account"
        description="Manage your account status. These actions have lasting consequences."
      />

      {/* Deactivate */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-foreground">Deactivate account</span>
          <span className="text-sm text-muted-foreground">
            Pauses your presence on the platform. Your profile and history are preserved and
            you can reactivate at any time.
          </span>
        </div>
        <div>
          <Button variant="outline" className="rounded-full font-semibold px-6">
            Deactivate account
          </Button>
        </div>
      </div>

      <Separator />

      {/* Delete */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-destructive">Delete account</span>
          <span className="text-sm text-muted-foreground">
            Permanently removes your account, profile, and all data. Accounts with active
            help interactions cannot be deleted. This action cannot be undone.
          </span>
        </div>
        <div>
          <Button variant="destructive" className="rounded-full font-semibold px-6">
            Delete account
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function FieldRow({
  label,
  hint,
  hintDestructive,
  children,
}: {
  label: string
  hint?: string
  hintDestructive?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {hint && (
        <p
          className={cn(
            "text-xs",
            hintDestructive ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {hint}
        </p>
      )}
    </div>
  )
}
