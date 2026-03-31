"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RequestCardPreview } from "@/features/dashboard/components/HelpRequestCards";
import type { OpenRequest } from "../types";

interface OpenRequestCardProps {
  request: OpenRequest;
  isOwner: boolean;
  basePath?: string;
  onOfferToHelp?: (requestId: string) => void;
}

export function OpenRequestCard({
  request,
  isOwner,
  basePath = "/trusted-list",
  onOfferToHelp,
}: OpenRequestCardProps) {
  return (
    <div className="flex w-full flex-col gap-5 py-5">
      <div className="flex w-full flex-col gap-3">
        {/* Category badge */}
        {request.category && (
          <div className="flex">
            <Badge
              variant="outline"
              className="rounded-full border-blue-200 bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800"
            >
              {request.category}
            </Badge>
          </div>
        )}

        {/* Content Preview Block */}
        <RequestCardPreview
          id={request.requestId}
          requestSummary={request.title}
          request={request.description}
          endDate={request.endDate}
        />
      </div>

      {/* Action */}
      <div className="flex w-full shrink-0">
        {isOwner ? (
          <Button
            asChild
            variant="outline"
            className="w-full rounded-full font-medium h-8 px-3 text-sm border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground shadow-sm"
          >
            <a href={`${basePath}/requests/${request.requestId}`}>Read the full request</a>
          </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full rounded-full font-medium h-8 px-3 text-sm border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground shadow-sm"
            onClick={() => onOfferToHelp?.(request.requestId)}
          >
            Offer to help
          </Button>
        )}
      </div>
    </div>
  );
}
