"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { toast } from "@/features/admin/lib/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { CalendarDays, Ban, Trash2, UserX, UserCheck, RefreshCcw, KeyRound, MessageSquare, Infinity, CreditCard, ExternalLink, Mail, Send } from "lucide-react"

// ── Types & Schema ────────────────────────────────────────────────────────

const memberStatuses = ["active", "banned", "waitlisted"] as const

type MemberStatus = typeof memberStatuses[number]

type Member = {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
  linkedinUrl: string
  status: MemberStatus
  inviteQuota: number
  hasUnlimitedInvites: boolean
  subscriptionEnabled: boolean
  subscriptionRenewalDate: Date
}

const memberSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  avatarUrl: z.string().nullable(),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").or(z.literal("")),
  status: z.enum(memberStatuses),
  inviteQuota: z.number().min(0, "Quota cannot be negative"),
  hasUnlimitedInvites: z.boolean(),
  subscriptionEnabled: z.boolean(),
  subscriptionRenewalDate: z.date(),
})

type FormValues = z.infer<typeof memberSchema>

// ── Status Config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<MemberStatus, { label: string; icon: React.ReactNode; color: string; dot: string }> = {
  active:     { label: "Active",     icon: <UserCheck className="h-3 w-3" />, color: "text-emerald-700", dot: "bg-emerald-500" },
  banned:     { label: "Banned",     icon: <Ban className="h-3 w-3" />,       color: "text-red-700",     dot: "bg-red-500"     },
  waitlisted: { label: "Waitlisted", icon: <CalendarDays className="h-3 w-3" />, color: "text-blue-700", dot: "bg-blue-500"    },
}

// ── Member Avatar ──────────────────────────────────────────────────────────

function MemberAvatar({ firstName, lastName, avatarUrl }: { firstName: string; lastName: string; avatarUrl?: string | null }) {
  const initials = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || "?"
  return (
    <Avatar className="h-11 w-11 shrink-0 rounded-full border border-border">
      <AvatarImage src={avatarUrl ?? ""} alt={`${firstName} ${lastName}`} className="object-cover" />
      <AvatarFallback className="font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}

// ── Section Divider ────────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="pb-1">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}

// ── Action Row ─────────────────────────────────────────────────────────────

function ActionRow({
  icon,
  title,
  description,
  buttonLabel,
  buttonVariant = "outline",
  onClick,
  destructive = false,
  amber = false,
  disabled = false,
}: {
  icon: React.ReactNode
  title: string
  description: string
  buttonLabel: React.ReactNode
  buttonVariant?: "outline" | "destructive" | "ghost"
  onClick: () => void
  destructive?: boolean
  amber?: boolean
  disabled?: boolean
}) {
  return (
    <div className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${destructive ? "border-destructive/20 bg-destructive/5" : amber ? "border-amber-200 bg-amber-50/50" : "border-border"} ${disabled ? "opacity-50" : ""}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${destructive ? "bg-destructive/10 text-destructive" : amber ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${destructive ? "text-destructive" : amber ? "text-amber-700" : "text-foreground"}`}>{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <Button
        type="button"
        size="sm"
        variant={buttonVariant}
        className={`shrink-0 rounded-full font-semibold text-xs px-3 ${destructive && buttonVariant === "outline" ? "border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive" : amber && buttonVariant === "outline" ? "border-amber-200 text-amber-700 hover:bg-amber-50" : ""}`}
        onClick={onClick}
        disabled={disabled}
      >
        {buttonLabel}
      </Button>
    </div>
  )
}

// ── Toggle Row ─────────────────────────────────────────────────────────────

function ToggleRow({
  icon,
  title,
  description,
  checked,
  onCheckedChange,
  id,
}: {
  icon: React.ReactNode
  title: string
  description: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  id: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <Label htmlFor={id} className="text-sm font-medium text-foreground cursor-pointer">{title}</Label>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} className="shrink-0" />
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────

export function EditMemberDialog({
  member,
  open,
  onOpenChange,
}: {
  member: Member | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [isBanDialogOpen, setIsBanDialogOpen] = React.useState(false)
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = React.useState(false)
  const [isRenewalPopoverOpen, setIsRenewalPopoverOpen] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(memberSchema),
      defaultValues: member || {
        id: "",
        firstName: "",
        lastName: "",
        email: "",
        avatarUrl: null,
        linkedinUrl: "",
        status: "active",
        inviteQuota: 5,
        hasUnlimitedInvites: false,
        subscriptionEnabled: false,
        subscriptionRenewalDate: new Date(),
      },
  })

  const { watch, setValue, handleSubmit, control } = form
  const hasUnlimitedInvites = watch("hasUnlimitedInvites")
  const currentStatus = watch("status")
  const watchedFirstName = watch("firstName")
  const watchedLastName = watch("lastName")

  React.useEffect(() => {
    if (member) {
      const memberData = { ...member } as Member & { name?: string }
      if (memberData.name && !memberData.firstName) {
        const [firstName, ...lastNameParts] = memberData.name.split(" ")
        memberData.firstName = firstName
        memberData.lastName = lastNameParts.join(" ") || ""
      }
      form.reset(memberData)
    }
  }, [member, form])

  const onSubmit = (data: FormValues) => {
    console.log("Submitting member data:", data)
    toast.success("Member settings updated successfully")
    onOpenChange(false)
  }

  const handleBanMember = () => {
    if (currentStatus === "banned") {
      // Unban: restore to active status
      setValue("status", "active")
      toast.success("Member has been unbanned and access restored")
    } else {
      // Ban: set to banned status
      setValue("status", "banned")
      toast.success("Member has been banned (you can reverse this later)")
    }
    setIsBanDialogOpen(false)
  }

  const handleRemoveMember = () => {
    toast.success("Member has been removed")
    setIsRemoveDialogOpen(false)
    onOpenChange(false)
  }



  const handleTriggerPasswordReset = () => {
    const email = form.getValues("email")
    toast.success(`A password reset link has been sent to ${email}`)
  }

  const memberFullName = member
    ? `${member.firstName} ${member.lastName}`.trim()
    : "this member"

  const statusConfig = STATUS_CONFIG[currentStatus]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl overflow-hidden rounded-2xl p-0 gap-0"
        onPointerDownOutside={(e) => {
          const target = e.detail.originalEvent.target as HTMLElement
          if (target.closest("[data-radix-popper-content-wrapper]")) {
            e.preventDefault()
          }
        }}
      >

        {/* ── Header ─────────────────────────────────────────────── */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-start gap-3">
            {member && (
              <MemberAvatar
                firstName={watchedFirstName || member.firstName}
                lastName={watchedLastName || member.lastName}
                avatarUrl={member.avatarUrl}
              />
            )}
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-base font-semibold leading-snug">
                  {member ? `${member.firstName} ${member.lastName}` : "Edit Member"}
                </DialogTitle>
                {member && (
                  <Badge
                    variant="outline"
                    className={`rounded-full gap-1.5 shrink-0 font-medium ${statusConfig.color} border-current/20 bg-current/5`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                    {statusConfig.label}
                  </Badge>
                )}
              </div>
              {member && (
                <DialogDescription className="text-xs mt-0.5 truncate">{member.email}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* ── Form ───────────────────────────────────────────────── */}
        <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: "calc(80vh - 140px)" }}>
            <Tabs defaultValue="identity" className="w-full">
              <TabsList className="w-full rounded-xl bg-muted/40 p-1 mb-5 h-auto">
                <TabsTrigger value="identity" className="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium">
                  Identity
                </TabsTrigger>
                <TabsTrigger value="access" className="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium">
                  Invites
                </TabsTrigger>
                <TabsTrigger value="subscription" className="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium">
                  Subscription
                </TabsTrigger>
                <TabsTrigger value="support" className="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium">
                  Services
                </TabsTrigger>
                <TabsTrigger value="danger" className="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium text-destructive data-[state=active]:text-destructive">
                  Danger
                </TabsTrigger>
              </TabsList>

              {/* ── Tab: Identity & Status ──────────────────────── */}
              <TabsContent value="identity" className="space-y-5 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={control} name="firstName" render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-medium text-muted-foreground">First Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-9 text-sm" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />
                  <FormField control={control} name="lastName" render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-medium text-muted-foreground">Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-9 text-sm" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />
                </div>

                <FormField control={control} name="email" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-medium text-muted-foreground">Email Address</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" className="h-9 text-sm" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />

                <FormField control={control} name="status" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-medium text-muted-foreground">Member Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {memberStatuses.map((status) => {
                          const cfg = STATUS_CONFIG[status]
                          return (
                            <SelectItem key={status} value={status}>
                              <div className="flex items-center gap-2">
                                <span className={cfg.color}>{cfg.icon}</span>
                                <span>{cfg.label}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />
              </TabsContent>

              {/* ── Tab: Invites ────────────────────────────────── */}
              <TabsContent value="access" className="space-y-4 mt-0">
                <SectionHeader
                  title="Invite Access"
                  description="Control how many members this person can invite to the platform."
                />

                <ToggleRow
                  id="unlimited-invites"
                  icon={<Infinity className="h-4 w-4" />}
                  title="Unlimited Invites"
                  description="Allow this member to invite without a cap"
                  checked={hasUnlimitedInvites}
                  onCheckedChange={(v) => setValue("hasUnlimitedInvites", v)}
                />

                <FormField control={control} name="inviteQuota" render={({ field }) => (
                  <FormItem className="space-y-0">
                    <div className={`flex items-center gap-4 rounded-xl border border-border px-4 py-3 transition-opacity ${hasUnlimitedInvites ? "opacity-50" : ""}`}>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <UserCheck className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">Invite Quota</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {hasUnlimitedInvites ? "Unlimited — quota ignored" : "Max this member can invite"}
                        </p>
                      </div>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          disabled={hasUnlimitedInvites}
                          className="h-8 w-16 rounded-lg text-sm text-center px-2 shrink-0"
                        />
                      </FormControl>
                    </div>
                    <FormMessage className="text-xs pt-1" />
                  </FormItem>
                )} />
              </TabsContent>

              {/* ── Tab: Subscription ───────────────────────────── */}
              <TabsContent value="subscription" className="space-y-4 mt-0">
                <SectionHeader
                  title="Subscription"
                  description="Manage this member's billing status and renewal date."
                />

                <ToggleRow
                  id="subscription-enabled"
                  icon={<CreditCard className="h-4 w-4" />}
                  title="Subscription Active"
                  description="Enable or disable this member's subscription"
                  checked={watch("subscriptionEnabled")}
                  onCheckedChange={(v) => setValue("subscriptionEnabled", v)}
                />

                <FormField control={control} name="subscriptionRenewalDate" render={({ field }) => (
                  <FormItem className="space-y-0">
                    <Popover open={isRenewalPopoverOpen} onOpenChange={setIsRenewalPopoverOpen}>
                      <div className="flex items-center gap-4 rounded-xl border border-border px-4 py-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <CalendarDays className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">Renewal Date</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            When this member's subscription next renews
                          </p>
                        </div>
                         <PopoverTrigger asChild>
                           <FormControl>
                             <Button
                               type="button"
                               size="sm"
                               variant="outline"
                               className="shrink-0 rounded-lg font-semibold text-xs px-3 min-w-[100px] justify-center tabular-nums"
                               disabled={!watch("subscriptionEnabled")}
                             >
                                 <CalendarDays className="h-3 w-3 mr-1" />
                               {field.value ? format(field.value, "MMM d, yyyy") : "Set date"}
                             </Button>
                           </FormControl>
                         </PopoverTrigger>
                      </div>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            if (date) field.onChange(date)
                            setIsRenewalPopoverOpen(false)
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage className="text-xs pt-1" />
                  </FormItem>
                )} />

                 <ActionRow
                   icon={<RefreshCcw className="h-4 w-4" />}
                   title="View in Stripe"
                   description="View this member's subscription details in the Stripe dashboard"
                   buttonLabel={<><ExternalLink className="h-3 w-3 mr-1" /> View in Stripe</>}
                   onClick={() => window.open('https://stripe.com', '_blank')}
                   disabled={!watch("subscriptionEnabled")}
                 />
              </TabsContent>

              {/* ── Tab: Account Services ────────────────────────── */}
              <TabsContent value="support" className="space-y-4 mt-0">
                <SectionHeader
                  title="Account Services"
                  description="Trigger account-level actions on behalf of this member."
                />
                <div className="space-y-2">
                  <ActionRow
                    icon={<KeyRound className="h-4 w-4" />}
                    title="Password Reset"
                    description="Send a reset link to their email address"
                    buttonLabel={<><Mail className="h-3 w-3 mr-1" />Send Email</>}
                    onClick={handleTriggerPasswordReset}
                  />
                  {/* <ActionRow
                    icon={<MessageSquare className="h-4 w-4" />}
                    title="Feedback Request"
                    description="Ask this member to submit a platform review"
                    buttonLabel={<><Send className="h-3 w-3 mr-1" />Send</>}
                    onClick={() => toast.info("Feedback feature coming soon")}
                  /> */}
                </div>
              </TabsContent>

              {/* ── Tab: Danger Zone ────────────────────────────── */}
              <TabsContent value="danger" className="space-y-4 mt-0">
                <SectionHeader
                  title="Destructive Actions"
                  description="These actions are permanent and cannot be undone."
                />
                <div className="space-y-2">
                 <ActionRow
                   icon={<Ban className="h-4 w-4" />}
                   title={currentStatus === "banned" ? "Unban Member" : "Ban Member"}
                   description={currentStatus === "banned" ? "Restore platform access" : "Immediately revoke platform access"}
                   buttonLabel={currentStatus === "banned" ? <><UserCheck className="h-3 w-3 mr-1" />Unban</> : <><Ban className="h-3 w-3 mr-1" />Ban</>}
                   buttonVariant="outline"
                   onClick={() => setIsBanDialogOpen(true)}
                   amber
                 />
                  <ActionRow
                    icon={<Trash2 className="h-4 w-4" />}
                    title="Remove Member"
                    description="Permanently delete their account and all data"
                    buttonLabel={<><Trash2 className="h-3 w-3 mr-1" />Remove</>}
                    buttonVariant="outline"
                    onClick={() => setIsRemoveDialogOpen(true)}
                    destructive
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* ── Footer ─────────────────────────────────────────── */}
          <DialogFooter className="border-t border-border px-6 py-4 flex-row gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="rounded-full font-semibold"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-full font-semibold px-6">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
        </Form>
      </DialogContent>

       {/* ── Ban/Unban Confirmation ──────────────────────────────────── */}
       <AlertDialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>{currentStatus === "banned" ? "Unban" : "Ban"} {memberFullName}?</AlertDialogTitle>
             <AlertDialogDescription>
               {currentStatus === "banned" ? 
                 "This will restore their access to the platform. They will be able to log in and use all features again." :
                 "This will immediately revoke their access to the platform. They will not be able to log in or use all features. You can reverse this action later if needed."
               }
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel className="rounded-full font-semibold">Cancel</AlertDialogCancel>
             <AlertDialogAction
               className="rounded-full font-semibold bg-amber-600 hover:bg-amber-700 text-white"
               onClick={handleBanMember}
             >
               {currentStatus === "banned" ? "Unban Member" : "Ban Member"}
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>

      {/* ── Remove Confirmation ───────────────────────────────── */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {memberFullName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete their account and all associated data. This action cannot
              be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full font-semibold bg-destructive text-destructive-foreground"
              onClick={handleRemoveMember}
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


    </Dialog>
  )
}
