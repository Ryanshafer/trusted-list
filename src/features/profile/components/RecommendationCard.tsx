"use client";
import { useEffect, useRef, useState } from "react";
import { UserIdentityLink } from "@/components/UserIdentityLink";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Recommendation } from "../types";

function memberHref(name: string, basePath = "/trusted-list") {
  return `${basePath}/members/${name.toLowerCase().replace(/\s+/g, "-")}`;
}

interface RecommendationCardProps {
  rec: Recommendation;
  basePath?: string;
}

export function RecommendationCard({ rec, basePath = "/trusted-list" }: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const bodyRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    setIsClamped(el.scrollHeight > el.clientHeight);
  }, []);

  return (
    <div className="flex flex-col gap-3.5">
      {/* Recommender identity */}
      <UserIdentityLink
        avatarUrl={rec.recommenderAvatarUrl}
        name={rec.recommenderName}
        connectionDegree={rec.recommenderConnectionDegree}
        trustedFor={rec.recommenderTrustedFor}
        href={memberHref(rec.recommenderName, basePath)}
        avatarSize="md"
        avatarBorderClass="border-white"
      />

      {/* Quote body */}
      <div className="flex flex-col gap-0.5">
        <p ref={bodyRef} className={`font-serif text-xl font-normal leading-8 text-foreground ${!expanded ? "line-clamp-9" : ""}`}>
          "{rec.body}"
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
    </div>
  );
}
