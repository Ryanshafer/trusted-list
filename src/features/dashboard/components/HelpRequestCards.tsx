import * as React from "react";
import { ArrowUpRight, BellPlus, Hand, HeartHandshake, X } from "lucide-react";

import type { CardData } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const HelpRequestCard = (card: CardData) => {
  if (card.variant === "circle") {
    return <CircleHelpCard {...card} />;
  }

  return <DefaultHelpCard {...card} />;
};

const DefaultHelpCard = ({
  name,
  request,
  relationshipTag,
  primaryCTA,
  secondaryCTA = "Cannot help",
  subtitle,
  connectedVia,
}: CardData) => {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-semibold">{name}</CardTitle>
          {subtitle || connectedVia ? (
            <CardDescription>
              Connected via <span className="font-medium text-foreground">{connectedVia ?? subtitle}</span>
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <RequestPreview text={request} onExpand={() => setOpen(true)} />
          <span className="inline-flex items-center rounded-full border border-dashed border-primary/40 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
            {relationshipTag}
          </span>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Button>
            {primaryCTA}
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline">{secondaryCTA}</Button>
        </CardFooter>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{name}</DialogTitle>
          </DialogHeader>
          <p className="text-base text-foreground">{request}</p>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button className="sm:flex-1">
              {primaryCTA}
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="ghost" className="sm:flex-1">
              {secondaryCTA}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} className="sm:flex-1">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const CircleHelpCard = ({
  name,
  request,
  avatarUrl,
}: CardData) => {
  const firstName = name.split(" ")[0] ?? name;
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Card className="relative rounded-3xl border border-border bg-card shadow-sm">
        <CardContent className="space-y-4 p-6">
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-2.5 top-2.5 h-8 w-8 rounded-full border border-dashed border-border/60"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
          <div className="flex items-start gap-4 pr-10">
            <Avatar className="h-12 w-12">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} className="object-cover" /> : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-lg font-semibold">{name}</p>
              <p className="text-xs text-muted-foreground">Directly Connected</p>
            </div>
          </div>
          <RequestPreview text={request} onExpand={() => setOpen(true)} />
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button className="sm:flex-1">
              <Hand className="mr-2 h-4 w-4" />
              Help {firstName}
            </Button>
            <Button variant="ghost" className="sm:flex-1">
              <BellPlus className="mr-2 h-4 w-4" />
              Remind me
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{name}</DialogTitle>
          </DialogHeader>
          <p className="text-base text-foreground">{request}</p>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button className="sm:flex-1">
              <Hand className="mr-2 h-4 w-4" />
              Help {firstName}
            </Button>
            <Button variant="ghost" className="sm:flex-1">
              <BellPlus className="mr-2 h-4 w-4" />
              Remind me
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} className="sm:flex-1">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const RequestPreview = ({ text, onExpand }: { text: string; onExpand: () => void }) => (
  <div className="flex items-start gap-3 rounded-3xl bg-rose-50 p-4">
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-200 text-rose-700">
      <HeartHandshake className="h-5 w-5" />
    </span>
    <div className="flex-1">
      <div className="flex items-start gap-2 rounded-2xl bg-white px-4 py-3 text-base text-foreground shadow-sm">
        <p className="flex-1 line-clamp-2">{text}</p>
        <button
          type="button"
          className="text-xs font-semibold text-rose-700 hover:text-rose-800"
          onClick={onExpand}
        >
          Expand
        </button>
      </div>
    </div>
  </div>
);
