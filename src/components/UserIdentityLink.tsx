"use client";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { cn, getInitials } from "@/lib/utils";

interface UserIdentityLinkProps {
  avatarUrl?: string | null;
  name: string;
  connectionDegree?: string;
  trustedFor?: string[];
  href?: string;
  avatarSize?: "sm" | "md" | "lg" | "xl";
  avatarBorderClass?: string;
  showTrustedFor?: boolean;
  className?: string;
  groupClass?: string;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

export function UserIdentityLink({
  avatarUrl,
  name,
  connectionDegree,
  trustedFor = [],
  href,
  avatarSize = "md",
  avatarBorderClass,
  showTrustedFor = true,
  className,
  groupClass = "group",
  children,
  onClick,
}: UserIdentityLinkProps) {
  const getAvatarSize = () => {
    switch (avatarSize) {
      case "sm": return "h-10 w-10";
      case "md": return "h-[60px] w-[60px]";
      case "lg": return "h-15 w-15";
      case "xl": return "h-18 w-18";
      default: return "h-[60px] w-[60px]";
    }
  };

  const getAvatarBorder = () => {
    switch (avatarSize) {
      case "sm": return "border-2";
      case "lg": return "border-2";
      case "xl": return "border-[3px]";
      default: return "border-[3px]";
    }
  };

  const avatarClasses = cn(
    getAvatarSize(),
    "shrink-0",
    getAvatarBorder(),
    avatarBorderClass ?? "border-background",
    "shadow-md transition-colors",
    "group-hover:border-primary"
  );

  const nameClasses = cn(
    avatarSize === "sm" ? "text-base" : "text-lg",
    "font-bold text-card-foreground leading-7 transition-colors",
    "group-hover:text-primary"
  );

  const content = (
    <>
      <Avatar className={avatarClasses}>
        <AvatarImage src={avatarUrl ?? undefined} alt={name} className="object-cover" />
        <AvatarFallback className={avatarSize === "sm" ? "text-xs font-semibold" : "text-sm font-semibold"}>
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-3">
          <span className={nameClasses}>
            {name}
          </span>
          {connectionDegree && (
            <Badge className="rounded-full border border-neutral-200 bg-neutral-100 hover:bg-neutral-100 px-2 py-0.5 text-xs font-semibold leading-4 text-neutral-800">
              {connectionDegree}
            </Badge>
          )}
        </div>
        {showTrustedFor && Array.isArray(trustedFor) && trustedFor.length > 0 && (
          <p className={avatarSize === "sm" ? "text-xs leading-4 line-clamp-2" : "text-xs"} style={{ color: "hsl(var(--muted-foreground))" }}>
            Trusted for {trustedFor.join(", ")}
          </p>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <a href={href} className={cn("flex items-center gap-3", className, "group", groupClass)} onClick={onClick}>
        {children || content}
      </a>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className, "group", groupClass)} onClick={onClick}>
      {children || content}
    </div>
  );
}
