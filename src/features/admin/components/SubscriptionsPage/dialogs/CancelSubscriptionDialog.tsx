"use client"

import * as React from "react"
import { toast } from "@/features/admin/lib/toast"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { Subscription } from "../types"

interface CancelSubscriptionDialogProps {
  subscription: Subscription | null
  onClose: () => void
  onConfirm: (subscription: Subscription) => void
}

export function CancelSubscriptionDialog({ subscription, onClose, onConfirm }: CancelSubscriptionDialogProps) {
  function handleConfirm() {
    if (!subscription) return
    onConfirm(subscription)
    onClose()
  }

  return (
    <AlertDialog open={subscription !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{subscription?.memberName}</span>'s
            subscription will be canceled. Auto-renewal will stop at the end of the current billing
            period.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full font-semibold">Keep Active</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-full font-semibold bg-amber-600 text-white hover:bg-amber-700"
            onClick={handleConfirm}
          >
            Cancel Subscription
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
