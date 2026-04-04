import * as React from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
  cancelButtonText?: string;
  confirmButtonText?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  confirmDisabled?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
}

export function BaseDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footerContent,
  cancelButtonText = "Cancel",
  confirmButtonText = "Confirm",
  onCancel,
  onConfirm,
  confirmDisabled = false,
  size = "md",
  showCloseButton = true,
}: BaseDialogProps) {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  // Size classes
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-[672px]",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        sizeClasses[size],
        "p-0 gap-0 overflow-hidden rounded-2xl [&>button]:hidden"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex flex-col gap-0">
            <h2 className="font-serif text-2xl font-normal leading-8">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {showCloseButton && (
            <DialogClose asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-border bg-muted font-semibold"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          )}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[calc(100vh-220px)] px-6 pt-4 pb-6">
          {children}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 px-6 py-4 bg-card border-t border-border">
          {footerContent ? (
            footerContent
          ) : (
            <>
              <Button
                variant="ghost"
                className="rounded-full font-semibold"
                onClick={handleCancel}
                type="button"
              >
                {cancelButtonText}
              </Button>
              <Button
                className="rounded-full font-semibold"
                onClick={handleConfirm}
                disabled={confirmDisabled}
                type="button"
              >
                {confirmButtonText}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

BaseDialog.displayName = "BaseDialog";