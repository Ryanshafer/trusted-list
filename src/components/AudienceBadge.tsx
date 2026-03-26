import { Badge } from "@/components/ui/badge";
import { User, Users, Globe } from "lucide-react";

export type AudienceKey = "contact" | "circle" | "community";

const AUDIENCE_CONFIG: Record<AudienceKey, { label: string; icon: React.ElementType; degree: string | null }> = {
  contact:   { label: "My Contact",        icon: User,  degree: "1st" },
  circle:    { label: "My Circle",         icon: Users, degree: "2nd" },
  community: { label: "The Trusted List",  icon: Globe, degree: null  },
};

/** Maps CardVariant ("contact" | "circle" | "community") to AudienceKey */
export function cardVariantToAudienceKey(variant: string): AudienceKey {
  if (variant === "contact")   return "contact";
  if (variant === "community") return "community";
  return "circle";
}

interface AudienceBadgeProps {
  audience: AudienceKey;
  category?: string | null;
  showDegree?: boolean;
}

export function AudienceBadge({ audience, category, showDegree }: AudienceBadgeProps) {
  const { label, icon: Icon, degree } = AUDIENCE_CONFIG[audience];
  const displayCategory = category ? category.charAt(0).toUpperCase() + category.slice(1) : null;
  const text = displayCategory ? `${label} · ${displayCategory}` : label;

  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge variant="outline" className="rounded-full gap-1 border-blue-200 bg-blue-50 text-blue-800 font-semibold text-xs leading-4">
        <Icon className="h-3 w-3 text-blue-700 -translate-y-[0.5px] shrink-0" />
        {text}
      </Badge>
      {showDegree && degree && (
        <Badge variant="outline" className="rounded-full border-neutral-200 bg-neutral-100 text-neutral-800 text-xs font-semibold leading-4">
          {degree}
        </Badge>
      )}
    </span>
  );
}
