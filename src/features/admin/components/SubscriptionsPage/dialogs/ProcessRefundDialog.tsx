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

import type { Subscription } from "../types"
import { formatAmount } from "../helpers"

interface ProcessRefundDialogProps {
  subscription: Subscription | null
  onClose: () => void
  onConfirm: (subscription: Subscription) => void
}

export function ProcessRefundDialog({ subscription, onClose, onConfirm }: ProcessRefundDialogProps) {
  function handleConfirm() {
    if (!subscription) return
    onConfirm(subscription)
    onClose()
  }

  return (
    <AlertDialog open={subscription !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Process refund?</AlertDialogTitle>
          <AlertDialogDescription>
            {subscription?.amountCents === 0 ? (
              <>
                <span className="font-medium text-foreground">{subscription.memberName}</span> has no
                charge on file — there is nothing to refund.
              </>
            ) : (
              <>
                <span className="font-medium text-foreground">
                  {formatAmount(subscription?.amountCents ?? 0)}
                </span>{' '}
                will be refunded to{' '}
                <span className="font-medium text-foreground">{subscription?.memberName}</span> via
                Stripe. This action cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full font-semibold">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-full font-semibold"
            onClick={handleConfirm}
          >
            {subscription?.amountCents === 0 ? "Understood" : "Process Refund"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
