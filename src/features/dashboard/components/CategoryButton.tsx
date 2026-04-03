"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CategoryButtonProps {
  value: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

export const CategoryButton = React.forwardRef<HTMLButtonElement, CategoryButtonProps>(
  ({ value, label, isActive, onClick, className }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full min-h-8 px-3 py-1 text-sm border transition-colors",
          isActive
            ? "bg-primary/10 border-primary text-card-foreground"
            : "border-muted-foreground text-card-foreground hover:border-primary hover:text-primary",
          className
        )}
      >
        {isActive && <Check className="h-3.5 w-3.5 shrink-0" />}
        {label}
      </button>
    );
  }
);

CategoryButton.displayName = "CategoryButton";