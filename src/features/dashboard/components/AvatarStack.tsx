"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface AvatarStackProps {
  people: {
    name: string;
    avatarUrl?: string;
    slug: string;
  }[];
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const AvatarStack = React.forwardRef<HTMLDivElement, AvatarStackProps>(
  ({ people, size = "md", className }, ref) => {
    const sizeClasses = {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base"
    };

    return (
      <div ref={ref} className={cn("flex items-center", className)}>
        {people.map((person, i) => (
          <a
            key={person.name}
            href={`/trusted-list/members/${person.slug}`}
            className="group/avatar relative shrink-0"
            style={{
              marginRight: i < people.length - 1 ? -12 : 0,
              zIndex: people.length - i
            }}
            aria-label={person.name}
          >
            <Avatar className={cn(sizeClasses[size], "border-2 border-card shadow-md transition-colors group-hover/avatar:border-primary")}>
              <AvatarImage src={person.avatarUrl} className="object-cover" />
              <AvatarFallback>{person.name[0]}</AvatarFallback>
            </Avatar>
          </a>
        ))}
      </div>
    );
  }
);

AvatarStack.displayName = "AvatarStack";