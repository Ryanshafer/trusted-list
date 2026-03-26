import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type CarouselSectionHeaderProps = {
  title: string;
  count: number;
  showCount?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
};

export function CarouselSectionHeader({
  title,
  count,
  showCount = true,
  ctaLabel,
  ctaHref,
}: CarouselSectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <h2 className="font-serif text-3xl font-normal leading-none text-foreground sm:text-4xl">{title}</h2>
        {showCount && (
          <span className="flex h-8 min-w-8 items-center justify-center rounded-full border border-primary-foreground bg-primary/10 px-2 text-sm font-medium leading-none text-foreground shadow-md">
            {count}
          </span>
        )}
      </div>
      {ctaLabel && ctaHref && (
        <Button asChild variant="ghost" size="lg" className="rounded-full font-semibold text-primary hover:bg-muted/75">
          <a href={ctaHref}>
            {ctaLabel}
            <ChevronRight className="h-4 w-4" />
          </a>
        </Button>
      )}
    </div>
  );
}
