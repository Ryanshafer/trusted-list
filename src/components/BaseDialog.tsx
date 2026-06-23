import * as React from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogDescription,
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
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  showCloseButton?: boolean;
  contentClassName?: string;
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
  contentClassName,
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
    "2xl": "max-w-[768px]",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        sizeClasses[size],
        "top-[10vh] translate-y-0 p-0 gap-0 overflow-hidden rounded-2xl [&>button]:hidden"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex flex-col gap-0">
            <DialogTitle className="font-serif text-2xl font-normal leading-8 tracking-normal">{title}</DialogTitle>
            {description ? (
              <DialogDescription className="text-sm text-muted-foreground">{description}</DialogDescription>
            ) : (
              <DialogDescription className="sr-only">{title}</DialogDescription>
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
        <div className={cn("overflow-y-auto max-h-[calc(100vh-220px)] px-6 pt-4 pb-6", contentClassName)}>
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