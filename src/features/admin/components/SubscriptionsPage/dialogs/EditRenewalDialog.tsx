"use client"

import * as React from "react"
import { format } from "date-fns"
import { toast } from "@/features/admin/lib/toast"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import type { Subscription } from "../types"

interface EditRenewalDialogProps {
  subscription: Subscription | null
  onClose: () => void
  onSave: (subscription: Subscription, newDate: Date) => void
}

export function EditRenewalDialog({ subscription, onClose, onSave }: EditRenewalDialogProps) {
  const [renewalDate, setRenewalDate] = React.useState<Date | undefined>(() => 
    subscription ? new Date(subscription.renewalDate + "T00:00:00") : undefined
  )

  React.useEffect(() => {
    if (subscription) {
      setRenewalDate(new Date(subscription.renewalDate + "T00:00:00"))
    }
  }, [subscription])

  function handleSave() {
    if (!subscription || !renewalDate) return
    onSave(subscription, renewalDate)
    onClose()
  }

  return (
    <Dialog open={subscription !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-auto max-w-none gap-0 p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-sm font-semibold">Edit Renewal Date</DialogTitle>
          {subscription && (
            <p className="text-xs text-muted-foreground mt-0.5">{subscription.memberName}</p>
          )}
        </DialogHeader>
        <div className="px-3 py-2">
          <Calendar
            mode="single"
            selected={renewalDate}
            onSelect={setRenewalDate}
            className="min-w-[214px] min-h-[261px]"
          />
        </div>
        <DialogFooter className="flex-row justify-end gap-2 border-t border-border px-5 py-4">
          <DialogClose asChild>
            <Button variant="outline" size="sm" className="rounded-full font-semibold">
              Cancel
            </Button>
          </DialogClose>
          <Button
            size="sm"
            className="rounded-full font-semibold"
            disabled={!renewalDate}
            onClick={handleSave}
          >
            Save Date
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
