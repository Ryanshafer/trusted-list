import * as React from "react";
import { ArrowUpRight, BellPlus, BellRing, EyeOff, Flag, Hand, MoreHorizontal } from "lucide-react";

import type { CardData } from "../types";
import { ChatDialog, type ChatMessage } from "./ChatDialog";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type HelpRequestCardProps = CardData & {
  onClear?: () => void;
};

type HeaderLine = {
  text: string;
  className?: string;
};

export const HelpRequestCard = (card: HelpRequestCardProps) => {
  if (card.variant === "circle") {
    return <CircleHelpCard {...card} />;
  }
  if (card.variant === "network") {
    return <NetworkHelpCard {...card} />;
  }
  if (card.variant === "opportunities") {
    return <OpportunityHelpCard {...card} />;
  }

  return <DefaultHelpCard {...card} />;
};

const DismissButton = ({ onClear, disabled, className }: { onClear?: () => void; disabled?: boolean; className?: string }) => {
  if (!onClear) return null;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className={className ?? "h-8 w-8 rounded-full border border-dashed border-border/60"}
            onClick={onClear}
            disabled={disabled}
          >
            <EyeOff className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Hide request</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const MoreOptionsButton = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="absolute right-2.5 top-2.5 h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">More options</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem className="text-destructive focus:text-destructive">
        <Flag className="mr-2 h-4 w-4" />
        Flag this request
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const CardActions = ({
  primaryLabel,
  onPrimary,
  onRemind,
  reminderActive,
  reminderLabel,
  celebrating,
  onDismiss,
  isDismissing,
}: {
  primaryLabel: string;
  onPrimary: () => void;
  onRemind: () => void;
  reminderActive: boolean;
  reminderLabel?: string;
  celebrating?: boolean;
  onDismiss?: () => void;
  isDismissing?: boolean;
}) => (
  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
    <div className="relative sm:flex-1">
      <Button className="relative z-10 w-full overflow-hidden gap-1" onClick={onPrimary}>
        <Hand className="mr-1 h-4 w-4" />
        {primaryLabel}
      </Button>
      {celebrating ? <ConfettiBurst /> : null}
    </div>
    <Button
      variant="ghost"
      className={`w-full sm:flex-1 gap-1 ${
        reminderActive ? "bg-lime-100 text-lime-900 hover:bg-lime-200" : ""
      }`}
      onClick={onRemind}
    >
      {reminderActive ? (
        <BellRing className="mr-1 h-4 w-4" />
      ) : (
        <BellPlus className="mr-1 h-4 w-4" />
      )}
      {reminderActive ? reminderLabel ?? "Reminder set" : "Remind me"}
    </Button>
    {onDismiss ? (
      <DismissButton 
        onClear={onDismiss} 
        disabled={isDismissing} 
        className="h-9 w-9 shrink-0 rounded-md text-muted-foreground" 
      />
    ) : null}
  </div>
);

const ConnectedCardHeader = ({
  name,
  avatarUrl,
  headerLines,
}: {
  name: string;
  avatarUrl?: string | null;
  headerLines: HeaderLine[];
}) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 pr-10">
      <Avatar className="h-12 w-12">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} className="object-cover" /> : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="mb-1">
        <p className="text-lg font-semibold leading-tight">{name}</p>
        {headerLines.map(({ text, className }, index) => (
          <p key={`${text}-${index}`} className={className ?? "text-xs text-muted-foreground/80"}>
            {text}
          </p>
        ))}
      </div>
    </div>
  );
};

const ConnectedHelpCard = ({
  name,
  request,
  requestSummary,
  avatarUrl,
  headerLines,
  connectionLabel,
  primaryActionLabel,
  onClear,
}: {
  name: string;
  request: string;
  requestSummary?: string | null;
  avatarUrl?: string | null;
  headerLines: HeaderLine[];
  connectionLabel: string;
  primaryActionLabel: string;
  onClear?: () => void;
}) => {
  const [open, setOpen] = React.useState(false);
  const [chatOpen, setChatOpen] = React.useState(false);
  const initialLead = React.useMemo(() => {
    const trimmedSummary = requestSummary?.trim() ?? "";
    const trimmedDetails = request.trim();
    if (!trimmedSummary) return trimmedDetails;
    const cleanSummary = trimmedSummary.replace(/[.!?]\s*$/, "");
    return `${cleanSummary}. ${trimmedDetails}`;
  }, [request, requestSummary]);

  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>(() => [
    { id: Date.now(), sender: "contact", text: initialLead },
  ]);
  const [composer, setComposer] = React.useState("");
  const [celebrating, setCelebrating] = React.useState(false);
  const [remindOpen, setRemindOpen] = React.useState(false);
  const [remindOption, setRemindOption] = React.useState("3 days");
  const [reminderActive, setReminderActive] = React.useState(false);
  const [isDismissing, setIsDismissing] = React.useState(false);
  const [celebrationTarget, setCelebrationTarget] = React.useState<"card" | "dialog">("card");
  const celebrationTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatOpenTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogCloseTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSendMessage = React.useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      setChatMessages((prev) => [...prev, { id: Date.now(), sender: "user", text: trimmed }]);
    },
    [setChatMessages],
  );

  const triggerConfetti = React.useCallback(
    (target: "card" | "dialog") => {
      if (celebrating) return;
      setCelebrationTarget(target);
      setCelebrating(true);
      if (target === "dialog") {
        dialogCloseTimeout.current = setTimeout(() => {
          setOpen(false);
        }, 700);
      }
      chatOpenTimeout.current = setTimeout(() => {
        setChatOpen(true);
      }, 700);
      celebrationTimeout.current = setTimeout(() => {
        setCelebrating(false);
      }, 1000);
    },
    [celebrating],
  );

  const handlePrimaryClick = () => {
    triggerConfetti("card");
  };

  const handleDialogPrimary = React.useCallback(() => {
    triggerConfetti("dialog");
  }, [triggerConfetti]);

  const openRemindDialog = React.useCallback(() => {
    setOpen(false);
    setRemindOpen(true);
  }, []);

  React.useEffect(() => {
    return () => {
      if (celebrationTimeout.current) clearTimeout(celebrationTimeout.current);
      if (chatOpenTimeout.current) clearTimeout(chatOpenTimeout.current);
      if (dialogCloseTimeout.current) clearTimeout(dialogCloseTimeout.current);
      if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
    };
  }, []);

  const handleDismiss = React.useCallback(() => {
    if (isDismissing) return;
    setIsDismissing(true);
    dismissTimeoutRef.current = setTimeout(() => {
      onClear?.();
    }, 250);
  }, [isDismissing, onClear]);

  return (
    <>
      <Card
        className={`relative flex h-full flex-col rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 ease-in-out ${
          isDismissing ? "translate-y-4 scale-95 opacity-0" : "opacity-100"
        }`}
      >
        <CardContent className="flex flex-1 flex-col gap-5 p-6 pb-4">
          <MoreOptionsButton />
          <ConnectedCardHeader name={name} avatarUrl={avatarUrl} headerLines={headerLines} />
          <div className="flex flex-1 flex-col gap-2">
            <RequestPreview text={request} onExpand={() => setOpen(true)} />
            <div className="flex-1" />
            <CardActions
              primaryLabel={primaryActionLabel}
              onPrimary={handlePrimaryClick}
              onRemind={() => setRemindOpen(true)}
              reminderActive={reminderActive}
              reminderLabel={reminderActive ? `${remindOption}` : undefined}
              celebrating={celebrating && celebrationTarget === "card"}
              onDismiss={handleDismiss}
              isDismissing={isDismissing}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <ExpandedHelpDialog
            name={name}
            request={request}
            avatarUrl={avatarUrl}
            connectionLabel={connectionLabel}
            primaryLabel={primaryActionLabel}
            onPrimaryAction={handleDialogPrimary}
            onRemindAction={openRemindDialog}
            confettiActive={celebrating && celebrationTarget === "dialog"}
          />
        </DialogContent>
      </Dialog>

      <ChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        contactName={name}
        messages={chatMessages}
        composer={composer}
        onComposerChange={setComposer}
        onSend={(message) => {
          handleSendMessage(message);
          setComposer("");
        }}
      />
      <RemindDialog
        open={remindOpen}
        onOpenChange={setRemindOpen}
        selection={remindOption}
        onSelectionChange={setRemindOption}
        reminderActive={reminderActive}
        onSet={() => {
          setReminderActive(true);
          setRemindOpen(false);
        }}
        onCancelReminder={() => {
          setReminderActive(false);
          setRemindOpen(false);
        }}
      />
    </>
  );
};

const DefaultHelpCard = ({
  name,
  request,
  relationshipTag,
  primaryCTA,
  secondaryCTA = "Cannot help",
  subtitle,
  connectedVia,
  requestSummary,
  onClear,
}: HelpRequestCardProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Card className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{name}</CardTitle>
          {subtitle || connectedVia ? (
            <CardDescription>
              Connected via <span className="font-medium text-foreground">{connectedVia ?? subtitle}</span>
            </CardDescription>
          ) : null}
        </CardHeader>
          <CardContent className="flex flex-1 flex-col space-y-4 pb-4">
          <RequestPreview text={requestSummary ?? request} onExpand={() => setOpen(true)} />
          <span className="inline-flex items-center rounded-full border border-dashed border-primary/40 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
            {relationshipTag}
          </span>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 pt-0 sm:flex-row">
          <Button>
            {primaryCTA}
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline">{secondaryCTA}</Button>
        </CardFooter>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <RequestDialog
            name={name}
            subtitle={connectedVia ?? subtitle ?? ""}
            request={request}
            primaryCTA={primaryCTA}
            secondaryCTA={secondaryCTA}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

const CircleHelpCard = ({
  name,
  request,
  avatarUrl,
  requestSummary,
  onClear,
}: HelpRequestCardProps) => {
  const firstName = name.split(" ")[0] ?? name;

  return (
    <ConnectedHelpCard
      name={name}
      request={request}
      requestSummary={requestSummary}
      avatarUrl={avatarUrl}
      connectionLabel="Directly Connected"
      primaryActionLabel={`Help ${firstName}`}
      headerLines={[{ text: "Directly Connected", className: "text-xs text-muted-foreground/60" }]}
      onClear={onClear}
    />
  );
};

const RequestPreview = ({ text, onExpand }: { text: string; onExpand: () => void }) => (
  <div className="group relative cursor-pointer rounded-3xl bg-muted/50 p-4 transition-colors hover:bg-muted/70 dark:bg-muted/40" onClick={onExpand}>
    <div className="relative max-h-[4.5rem] overflow-hidden [mask-image:linear-gradient(to_bottom,black_30%,transparent_100%)]">
      <p className="text-base text-foreground/90 dark:text-slate-100 leading-relaxed">
        {text}
      </p>
    </div>
    <div className="mt-2 flex items-center justify-center">
      <span className="text-xs font-medium text-primary py-1 px-3 rounded-full group-hover:bg-muted">
        Read more
      </span>
    </div>
  </div>
);

const confettiColors = ["bg-primary", "bg-amber-400", "bg-emerald-400", "bg-rose-400", "bg-sky-400", "bg-purple-400"];
const remindOptions = ["4 hours", "12 hours", "1 day", "3 days", "1 week", "2 weeks"];

const ConfettiBurst = () => {
  const pieces = React.useMemo(
    () =>
      Array.from({ length: 24 }).map((_, index) => {
        const spread = Math.PI / 1.2;
        const baseAngle = Math.PI / 2;
        const angle = baseAngle + (Math.random() - 0.5) * spread;
        const distance = 60 + Math.random() * 30;
        const size = 1 + Math.random() * 2;
        return {
          angle,
          distance,
          rotation: Math.random() * 360,
          color: confettiColors[index % confettiColors.length],
          size,
        };
      }),
    [],
  );
  const [animate, setAnimate] = React.useState(false);

  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
      {pieces.map((piece, index) => {
        const x = Math.cos(piece.angle) * piece.distance;
        const y = -Math.sin(piece.angle) * piece.distance;
        return (
          <span
            key={`${piece.color}-${index}`}
            className={`absolute rounded-full ${piece.color}`}
            style={{
              height: `${piece.size * 4}px`,
              width: `${piece.size * 1.5}px`,
              transform: animate
                ? `translate(${x}px, ${y}px) rotate(${piece.rotation}deg)`
                : "translate(0px, 0px)",
              opacity: animate ? 0 : 1,
              transition: "transform 600ms ease-out, opacity 600ms ease-out",
            }}
          />
        );
      })}
    </div>
  );
};

const RemindDialog = ({
  open,
  onOpenChange,
  selection,
  onSelectionChange,
  reminderActive,
  onSet,
  onCancelReminder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selection: string;
  onSelectionChange: (value: string) => void;
  reminderActive: boolean;
  onSet: () => void;
  onCancelReminder: () => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>{reminderActive ? "Reminder scheduled" : "Schedule a reminder"}</DialogTitle>
        <DialogDescription>
          {reminderActive
            ? "You're set to get a nudge. Adjust the timing below or cancel the reminder."
            : "Pick when you want to be nudged again."}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Remind me in</p>
        <Select value={selection} onValueChange={onSelectionChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {remindOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {reminderActive ? (
        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-2">
          <Button variant="destructive" className="w-full sm:flex-1" onClick={onCancelReminder}>
            Cancel reminder
          </Button>
          <Button className="w-full sm:flex-1" onClick={onSet}>
            Update reminder
          </Button>
        </DialogFooter>
      ) : (
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSet}>Set reminder</Button>
        </DialogFooter>
      )}
    </DialogContent>
  </Dialog>
);

const NetworkHelpCard = ({
  name,
  request,
  requestSummary,
  connectedBy,
  onClear,
  avatarUrl,
}: HelpRequestCardProps) => {
  const connector = connectedBy ?? "your trusted network";
  const firstName = name.split(" ")[0] ?? name;
  const headerLines: HeaderLine[] = [
    { text: `Connected by ${connector}`, className: "text-xs text-muted-foreground/60" },
  ];

  return (
    <ConnectedHelpCard
      name={name}
      request={request}
      requestSummary={requestSummary}
      avatarUrl={avatarUrl}
      connectionLabel={`Connected by ${connector}`}
      primaryActionLabel={`Help ${firstName}`}
      headerLines={headerLines}
      onClear={onClear}
    />
  );
};

const OpportunityHelpCard = ({
  name,
  request,
  requestSummary,
  connectionReason,
  profession,
  level,
  onClear,
  avatarUrl,
}: HelpRequestCardProps) => {
  const firstName = name.split(" ")[0] ?? name;
  const connectionLine = connectionReason
    ? connectionReason.toLowerCase().startsWith("you share similar skills")
      ? connectionReason
      : `You share similar skills: ${connectionReason}`
    : null;
  const levelLine = [level, profession].filter(Boolean).join(" ").trim();
  const headerLines: HeaderLine[] = [
    ...(levelLine ? [{ text: levelLine, className: "text-sm text-muted-foreground" }] : []),
    ...(connectionLine ? [{ text: connectionLine, className: "text-xs text-muted-foreground/60" }] : []),
  ];

  return (
    <ConnectedHelpCard
      name={name}
      request={request}
      requestSummary={requestSummary}
      avatarUrl={avatarUrl}
      connectionLabel={connectionLine ?? "Skill-aligned opportunity"}
      primaryActionLabel={`Help ${firstName}`}
      headerLines={headerLines}
      onClear={onClear}
    />
  );
};

const RequestDialog = ({
  name,
  subtitle,
  request,
  primaryCTA,
  secondaryCTA,
}: {
  name: string;
  subtitle?: string;
  request: string;
  primaryCTA: string;
  secondaryCTA?: string;
}) => (
  <Card className="border-none shadow-none">
    <CardHeader>
      <CardTitle className="text-xl font-semibold">{name}</CardTitle>
      {subtitle ? (
        <CardDescription>
          Connected via <span className="font-medium text-foreground">{subtitle}</span>
        </CardDescription>
      ) : null}
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="rounded-3xl bg-muted/50 p-4 dark:bg-muted/40">
        <p className="rounded-2xl bg-white px-4 py-3 text-base text-foreground shadow-sm dark:bg-slate-900 dark:text-slate-100">
          {request}
        </p>
      </div>
    </CardContent>
    <CardFooter className="mt-8 flex flex-col gap-2 sm:flex-row">
      <Button className="sm:flex-1">
        {primaryCTA}
        <ArrowUpRight className="ml-2 h-4 w-4" />
      </Button>
      <Button variant="ghost" className="sm:flex-1">
        {secondaryCTA}
      </Button>
    </CardFooter>
  </Card>
);

const ExpandedHelpDialog = ({
  name,
  request,
  avatarUrl,
  connectionLabel,
  primaryLabel,
  onPrimaryAction,
  onRemindAction,
  confettiActive = false,
}: {
  name: string;
  request: string;
  avatarUrl?: string | null;
  connectionLabel?: string;
  primaryLabel: string;
  onPrimaryAction?: () => void;
  onRemindAction?: () => void;
  confettiActive?: boolean;
}) => (
  <Card className="border-none shadow-none">
    <CardContent className="space-y-4 p-3">
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} className="object-cover" /> : null}
          <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-lg font-semibold">{name}</p>
          {connectionLabel ? (
            <p className="text-xs text-muted-foreground">{connectionLabel}</p>
          ) : null}
        </div>
      </div>
      <div className="rounded-3xl bg-muted/50 p-4 dark:bg-muted/40">
        <p className="text-base text-foreground leading-relaxed">
          {request}
        </p>
      </div>
      <div className="mt-10 flex flex-col gap-8 sm:flex-row">
        <div className="relative w-full sm:flex-1">
          <Button className="relative z-10 w-full overflow-hidden" onClick={onPrimaryAction}>
            <Hand className="mr-1 h-4 w-4" />
            {primaryLabel}
          </Button>
          {confettiActive ? <ConfettiBurst /> : null}
        </div>
        <Button variant="ghost" className="sm:flex-1" onClick={onRemindAction}>
          <BellPlus className="mr-1 h-4 w-4" />
          Remind me
        </Button>
      </div>
    </CardContent>
  </Card>
);
