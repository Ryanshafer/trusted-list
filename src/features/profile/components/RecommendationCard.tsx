"use client";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Recommendation } from "../types";

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
      <a href={memberHref(rec.recommenderName, basePath)} className="group flex items-center gap-3">
        <Avatar className="h-[60px] w-[60px] shrink-0 border-[3.5px] border-white shadow-md transition-colors group-hover:border-primary">
          <AvatarImage src={rec.recommenderAvatarUrl ?? undefined} alt={rec.recommenderName} />
          <AvatarFallback className="text-sm font-semibold">
            {getInitials(rec.recommenderName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-lg font-bold text-card-foreground transition-colors group-hover:text-primary">
              {rec.recommenderName}
            </span>
            <Badge className="rounded-full border border-neutral-200 bg-neutral-100 hover:bg-neutral-100 px-2 py-0.5 text-xs font-semibold leading-4 text-neutral-800">
              {rec.recommenderConnectionDegree}
            </Badge>
          </div>
          {rec.recommenderTrustedFor.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Trusted for {rec.recommenderTrustedFor.join(", ")}
            </p>
          )}
        </div>
      </a>

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
