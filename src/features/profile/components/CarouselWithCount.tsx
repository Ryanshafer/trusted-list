"use client";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Info, SquarePen } from "lucide-react";

interface CarouselWithCountProps {
  title: string;
  totalCount: number;
  countLabel: string;
  filterLabel?: string;
  filterSkills?: string[];
  actionLabel?: string;
  onActionClick?: () => void;
  infoTooltip?: string;
  items: ReactNode[];
  itemBasis?: string;
  showWhenEmpty?: boolean;
}

export function CarouselWithCount({
  title,
  totalCount,
  countLabel,
  filterLabel,
  filterSkills = [],
  actionLabel,
  onActionClick,
  infoTooltip,
  items,
  itemBasis = "basis-[340px]",
  showWhenEmpty = false,
}: CarouselWithCountProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateState = useCallback((api: CarouselApi) => {
    if (!api) return;
    setCanPrev(api.canScrollPrev());
    setCanNext(api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!api) return;
    updateState(api);
    api.on("select", () => updateState(api));
    api.on("reInit", () => updateState(api));
  }, [api, updateState]);

  if (!items.length && !showWhenEmpty) return null;

  return (
    <section className="flex flex-col gap-4 border-t pt-8">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pr-10">
        <h2 className="font-serif text-3xl font-normal text-foreground">{title}</h2>
        {actionLabel ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onActionClick}
            className="flex h-8 items-center gap-1.5 rounded-full text-xs font-medium text-card-foreground transition-colors hover:bg-accent"
          >
            <SquarePen className="h-3 w-3" />
            {actionLabel}
          </Button>
        ) : filterLabel && filterSkills.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              {filterLabel}
            </span>
            {infoTooltip && (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 rounded-full text-muted-foreground hover:text-foreground"
                      aria-label="More info"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-64 text-xs leading-snug">
                    {infoTooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {filterSkills.map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="rounded-full px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {skill}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="relative">
          <Carousel setApi={setApi} opts={{ align: "start", dragFree: false, slidesToScroll: 1, containScroll: false }}>
            <CarouselContent className="-ml-10">
              {items.map((item, i) => (
                <CarouselItem key={i} className={`pl-10 ${itemBasis}`}>
                  {item}
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-22 bg-gradient-to-r from-transparent to-background" />
        </div>
      )}

      {/* Bottom row: count + nav */}
      <div className="flex items-center justify-end gap-3 py-3 pr-10">
        <Badge
          variant="outline"
          className="rounded-full px-3 py-1 text-xs font-medium text-foreground"
        >
          {totalCount} {countLabel}
        </Badge>
        {items.length > 0 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="h-9 w-9 rounded-full font-semibold"
              onClick={() => api?.scrollPrev()}
              disabled={!canPrev}
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-9 w-9 rounded-full font-semibold"
              onClick={() => api?.scrollNext()}
              disabled={!canNext}
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
