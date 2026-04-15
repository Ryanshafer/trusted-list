"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  RefreshCw,
  Users,
  Infinity,
  Save,
  Info,
  CalendarClock,
  Hash,
  ShieldCheck,
} from "lucide-react"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AdminPageLayout } from "./AdminShell"

// ── Schema ────────────────────────────────────────────────────────────────────

const inviteSettingsSchema = z.object({
  renewalPeriod: z.enum(["weekly", "monthly", "quarterly", "never"], {
    required_error: "Select a renewal period.",
  }),
  defaultQuota: z
    .number({ invalid_type_error: "Must be a number." })
    .int("Must be a whole number.")
    .min(1, "Minimum quota is 1.")
    .max(100, "Maximum quota is 100."),
  unlimitedForAdmins: z.boolean(),
  requireVoteForApproval: z.boolean(),
  voteThreshold: z
    .number({ invalid_type_error: "Must be a number." })
    .int("Must be a whole number.")
    .min(1, "Minimum threshold is 2.")
    .max(5, "Maximum threshold is 5."),
  allowSelfNomination: z.boolean(),
  pauseNewInvites: z.boolean(),
})

type InviteSettingsValues = z.infer<typeof inviteSettingsSchema>

const DEFAULT_VALUES: InviteSettingsValues = {
  renewalPeriod: "monthly",
  defaultQuota: 5,
  unlimitedForAdmins: true,
  requireVoteForApproval: true,
  voteThreshold: 2,
  allowSelfNomination: false,
  pauseNewInvites: false,
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="ml-1 inline h-3.5 w-3.5 cursor-help text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[220px] text-xs leading-relaxed">
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ── Setting row (for switch fields) ──────────────────────────────────────────

function SettingRow({
  label,
  description,
  hint,
  children,
  disabled,
  badge,
}: {
  label: string
  description?: string
  hint?: string
  children: React.ReactNode
  disabled?: boolean
  badge?: React.ReactNode
}) {
  return (
    <div
      className={`flex items-start justify-between gap-6 rounded-lg px-4 py-3.5 transition-colors ${
        disabled ? "opacity-50" : "hover:bg-muted/40"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {hint && <FieldHint>{hint}</FieldHint>}
          {badge}
        </div>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  )
}

// ── Unsaved changes indicator ─────────────────────────────────────────────────

function UnsavedBadge() {
  return (
    <Badge
      variant="outline"
      className="rounded-full border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400 text-[11px] font-semibold"
    >
      Unsaved changes
    </Badge>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InviteSettingsPage() {
  const [saved, setSaved] = React.useState(false)

  const form = useForm<InviteSettingsValues>({
    resolver: zodResolver(inviteSettingsSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onChange",
  })

  const { isDirty, isSubmitting } = form.formState
  const watchUnlimited = form.watch("unlimitedForAdmins")
  const watchVoteRequired = form.watch("requireVoteForApproval")
  const watchPaused = form.watch("pauseNewInvites")

  const onSubmit = async (values: InviteSettingsValues) => {
    // Simulate save
    await new Promise((r) => setTimeout(r, 600))
    console.log("Saved:", values)
    form.reset(values)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <AdminPageLayout>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-8">
          {/* Page header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Invite Settings
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Configure how members can nominate and invite new people.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isDirty && <UnsavedBadge />}
              {saved && !isDirty && (
                <Badge
                  variant="outline"
                  className="rounded-full border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 text-[11px] font-semibold"
                >
                  Saved
                </Badge>
              )}
              {isDirty && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-full font-semibold text-xs text-muted-foreground"
                  onClick={() => form.reset(DEFAULT_VALUES)}
                >
                  Reset
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={!isDirty || isSubmitting}
                className="rounded-full font-semibold gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                {isSubmitting ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>

          {/* ── Section 1: Quota & renewal ──────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <SectionHeader
                icon={RefreshCw}
                title="Quota & Renewal"
                description="Control how many invites members receive and when they refresh."
              />
            </div>

            <div className="divide-y divide-border/60 px-1 py-1">
              {/* Renewal period */}
              <div className="px-4 py-4">
                <FormField
                  control={form.control}
                  name="renewalPeriod"
                  render={({ field }) => (
                    <FormItem className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium leading-none">
                          Global Invite Renewal Period
                          <FieldHint>
                            How often each member's invite quota resets back to the default value.
                          </FieldHint>
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Applies to all members unless individually overridden.
                        </FormDescription>
                        <FormMessage />
                      </div>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="h-9 w-full sm:w-[180px] rounded-lg text-sm">
                            <div className="flex items-center gap-2">
                              <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                              <SelectValue placeholder="Select period" />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="never">Never (one-time)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Default quota */}
              <div className="px-4 py-4">
                <FormField
                  control={form.control}
                  name="defaultQuota"
                  render={({ field }) => (
                    <FormItem className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium leading-none">
                          Default Invite Quota
                          <FieldHint>
                            Number of invitations a member starts with each renewal period. Admins can override this per-member.
                          </FieldHint>
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Per member, per renewal period. Between 1 and 100.
                        </FormDescription>
                        <FormMessage />
                      </div>
                      <FormControl>
                        <div className="relative w-full sm:w-[120px]">
                          <Hash className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            className="h-9 pl-8 rounded-lg text-sm"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === "" ? "" : parseInt(e.target.value, 10)
                              )
                            }
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Unlimited for admins */}
              <FormField
                control={form.control}
                name="unlimitedForAdmins"
                render={({ field }) => (
                  <FormItem>
                    <SettingRow
                      label="Allow Unlimited Invites for Admins"
                      description="Admins bypass the quota entirely and can send invites without limit."
                      hint="Admins still appear in the audit log for every invite sent."
                      badge={
                        watchUnlimited ? (
                          <Badge
                            variant="outline"
                            className="rounded-full border-primary/30 bg-primary/10 text-primary text-[10px] font-semibold gap-0.5"
                          >
                            <Infinity className="h-2.5 w-2.5" />
                            Unlimited
                          </Badge>
                        ) : null
                      }
                    >
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </SettingRow>
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* ── Section 2: Approval rules ───────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <SectionHeader
                icon={ShieldCheck}
                title="Approval Rules"
                description="Define whether invitations require single or multi-admin review."
              />
            </div>

            <div className="divide-y divide-border/60 px-1 py-1">
              {/* Require vote */}
              <FormField
                control={form.control}
                name="requireVoteForApproval"
                render={({ field }) => (
                  <FormItem>
                    <SettingRow
                      label="Require Multi-admin Vote for Approval"
                      description="New applications must collect votes from multiple admins before being approved. When off, any admin can approve directly."
                      hint="This affects all new applications. Applications already in review follow their original rules."
                    >
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </SettingRow>
                  </FormItem>
                )}
              />

              {/* Vote threshold */}
              <div className={`px-4 py-4 transition-opacity ${watchVoteRequired ? "" : "opacity-40 pointer-events-none"}`}>
                <FormField
                  control={form.control}
                  name="voteThreshold"
                  render={({ field }) => (
                    <FormItem className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium leading-none">
                          Vote Threshold
                          <FieldHint>
                            Minimum number of admin approvals required before an application is accepted.
                          </FieldHint>
                        </FormLabel>
                        <FormDescription className="text-xs">
                          {watchVoteRequired
                            ? `${field.value} admin${Number(field.value) !== 1 ? "s" : ""} must approve before an applicant is accepted.`
                            : "Enable multi-admin voting to configure this."}
                        </FormDescription>
                        <FormMessage />
                      </div>
                      <FormControl>
                        <div className="flex items-center gap-3 w-full sm:w-[200px] [&_[role=slider]]:border-2 [&_[role=slider]]:border-primary">
                          <Slider
                            min={1}
                            max={5}
                            step={1}
                            value={[field.value]}
                            onValueChange={([val]) => field.onChange(val)}
                            disabled={!watchVoteRequired}
                            className="flex-1"
                          />
                          <span className="w-5 text-center text-sm font-semibold tabular-nums text-foreground">
                            {field.value}
                          </span>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </section>

          {/* ── Section 3: Access controls ──────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <SectionHeader
                icon={Users}
                title="Access Controls"
                description="Fine-tune who can invite and under what conditions."
              />
            </div>

            <div className="divide-y divide-border/60 px-1 py-1">
              {/* Allow self-nomination */}
              <FormField
                control={form.control}
                name="allowSelfNomination"
                render={({ field }) => (
                  <FormItem>
                    <SettingRow
                      label="Allow Self-nomination"
                      description="Prospective members can submit their own application without needing an invitation from an existing member."
                      hint="Self-nominated applications still go through the normal approval queue."
                    >
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </SettingRow>
                  </FormItem>
                )}
              />

              {/* Pause invites */}
              <FormField
                control={form.control}
                name="pauseNewInvites"
                render={({ field }) => (
                  <FormItem>
                    <SettingRow
                      label="Pause New Invitations"
                      description="Temporarily prevent members from sending invitations. Existing applications in the queue are unaffected."
                      hint="Use this during membership audits or community resets."
                      badge={
                        watchPaused ? (
                          <Badge
                            variant="outline"
                            className="rounded-full border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400 text-[10px] font-semibold"
                          >
                            Paused
                          </Badge>
                        ) : null
                      }
                    >
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </SettingRow>
                  </FormItem>
                )}
              />
            </div>
          </section>

        </form>
      </Form>
    </AdminPageLayout>
  )
}
