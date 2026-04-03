"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrustTierCardProps {
  id: string;
  name: string;
  requestSummary?: string;
  avatarUrl?: string;
  href: string;
  className?: string;
}

export const TrustTierCard = React.forwardRef<HTMLAnchorElement, TrustTierCardProps>(
  ({ id, name, requestSummary, avatarUrl, href, className }, ref) => {
    return (
      <a
        ref={ref}
        href={href}
        className={cn(
          "group flex items-center justify-between bg-background rounded-lg shadow-sm pl-2.5 pr-1.5 py-2 hover:bg-muted/30 transition-colors",
          className
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage src={avatarUrl ?? undefined} />
            <AvatarFallback className="text-xs">{name?.[0]}</AvatarFallback>
          </Avatar>
          <span className="text-lg font-semibold truncate text-card-foreground group-hover:text-primary transition-colors leading-7">
            {requestSummary ?? name}
          </span>
        </div>
        <span className="shrink-0 rounded-full bg-secondary flex items-center justify-center h-6 w-6">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </span>
      </a>
    );
  }
);

TrustTierCard.displayName = "TrustTierCard";