"use client";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ContributionItem } from "../types";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function memberHref(name: string, basePath = "/trusted-list") {
  return `${basePath}/members/${name.toLowerCase().replace(/\s+/g, "-")}`;
}

interface ContributionCardProps {
  item: ContributionItem;
  basePath?: string;
}

const BODY_CLAMP = 200;

export function ContributionCard({ item, basePath = "/trusted-list" }: ContributionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const long = item.feedbackBody.length > BODY_CLAMP;

  return (
    <div className="flex flex-col gap-3.5">
      {/* Requester identity */}
      <a href={memberHref(item.requesterName, basePath)} className="group flex items-center gap-3">
        <Avatar className="h-[60px] w-[60px] shrink-0 border-[3.5px] border-white shadow-md transition-colors group-hover:border-primary">
          <AvatarImage src={item.requesterAvatarUrl ?? undefined} alt={item.requesterName} />
          <AvatarFallback className="text-sm font-semibold">
            {getInitials(item.requesterName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-lg font-bold text-card-foreground transition-colors group-hover:text-primary">
              {item.requesterName}
            </span>
            <Badge className="rounded-full border border-neutral-200 bg-neutral-100 hover:bg-neutral-100 px-2 py-0.5 text-xs font-semibold leading-4 text-neutral-800">
              {item.requesterConnectionDegree}
            </Badge>
          </div>
          {item.requesterTrustedFor.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Trusted for {item.requesterTrustedFor.join(", ")}
            </p>
          )}
        </div>
      </a>

      {/* Request title */}
      <a
        href={`${basePath}/requests/view/${item.requestId}`}
        className="line-clamp-2 font-serif text-2xl font-normal text-foreground transition-colors hover:text-primary"
      >
        {item.requestTitle}
      </a>

      {/* Feedback */}
      <div className="flex flex-col gap-[10px] rounded-2xl bg-card px-4 py-3">
        <p className="text-base font-semibold text-foreground">{item.feedbackSubject}</p>
        <p className={`text-sm leading-5 text-foreground ${!expanded && long ? "line-clamp-3" : ""}`}>
          {item.feedbackBody}
        </p>
        {long && (
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
    </div>
  );
}
