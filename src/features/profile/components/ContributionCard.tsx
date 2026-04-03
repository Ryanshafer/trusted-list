"use client";
import { useState } from "react";
import { UserIdentityLink } from "@/components/UserIdentityLink";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ContributionItem } from "../types";

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
      <UserIdentityLink
        avatarUrl={item.requesterAvatarUrl}
        name={item.requesterName}
        connectionDegree={item.requesterConnectionDegree}
        trustedFor={item.requesterTrustedFor}
        href={memberHref(item.requesterName, basePath)}
        avatarSize="md"
        avatarBorderClass="border-white"
      />

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
