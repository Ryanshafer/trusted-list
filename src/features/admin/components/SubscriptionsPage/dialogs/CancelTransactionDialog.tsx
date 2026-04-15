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

interface CancelTransactionDialogProps {
  subscription: Subscription | null
  onClose: () => void
  onConfirm: (subscription: Subscription) => void
}

export function CancelTransactionDialog({ subscription, onClose, onConfirm }: CancelTransactionDialogProps) {
  function handleConfirm() {
    if (!subscription) return
    onConfirm(subscription)
    onClose()
  }

  return (
    <AlertDialog open={subscription !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Void billing period?</AlertDialogTitle>
          <AlertDialogDescription>
            The current billing cycle for{