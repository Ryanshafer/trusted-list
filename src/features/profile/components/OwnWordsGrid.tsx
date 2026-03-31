"use client";
import { Fragment, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, SquarePen } from "lucide-react";
import type { OwnWordsEntry } from "../types";

function OwnWordsAnswer({ entry }: { entry: OwnWordsEntry }) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const bodyRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    setIsClamped(el.scrollHeight > el.clientHeight);
  }, []);

  return (
    <div className="flex flex-col gap-0.5 self-start">
      <p
        ref={bodyRef}
        className={`font-serif text-xl font-normal leading-8 text-foreground ${!expanded ? "line-clamp-6" : ""}`}
      >
        "{entry.answer}"
      </p>
      {isClamped && (
        <button
          type="button"
          className="flex items-center gap-1.5 self-start text-xs font-medium text-foreground transition-opacity hover:opacity-70"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Show less" : "Read more"}
          {expanded
            ? <ChevronUp className="h-3.5 w-3.5" />
            : <ChevronDown className="h-3.5 w-3.5" />
          }
        </button>
      )}
    </div>
  );
}

interface OwnWordsGridProps {
  firstName: string;
  entries: OwnWordsEntry[];
  isOwner?: boolean;
  onEditClick?: () => void;
}

export function OwnWordsGrid({ firstName, entries, isOwner, onEditClick }: OwnWordsGridProps) {
  if (!entries.length) return null;

  return (
    <section className="flex flex-col gap-4 border-t py-8">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-3xl font-normal text-foreground">
          In {firstName}'s own words
        </h2>

        {isOwner && onEditClick && (
          <div className="mr-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditClick}
              className="flex h-8 items-center gap-1.5 rounded-full text-xs font-medium text-card-foreground hover:bg-accent transition-colors"
            >
              <SquarePen className="h-3 w-3" />
              Edit answers
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-[21.5rem_1fr] gap-x-14 gap-y-8 pt-4 pr-10">
        {entries.slice(0, 3).map((entry, i) => (
          <Fragment key={i}>
            <div className="flex items-center gap-2 self-start">
              <p className="text-sm font-bold leading-5 text-muted-foreground uppercase tracking-wide">
                {entry.question}
              </p>
            </div>
            <OwnWordsAnswer entry={entry} />
          </Fragment>
        ))}
      </div>
    </section>
  );
}
