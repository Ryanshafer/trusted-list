import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessagesSquare, MoreHorizontal, Flag, EyeOff, BellPlus } from "lucide-react";
import { UserIdentityLink } from "@/components/UserIdentityLink";
import type { CardData } from "@/features/dashboard/types";
import { FlagRequestDialog } from "@/features/moderation/components/FlagRequestDialog";
import { AudienceBadge, cardVariantToAudienceKey } from "@/components/AudienceBadge";
import { formatReminderTime } from "./SetReminderDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChatMultiHelperModal,
  type Message as MultiChatMessage,
} from "@/features/dashboard/components/ChatMultiHelperModal";
import { getInitials } from "./OutgoingRequestCard";

export const ReminderListRow = ({
  card,
  reminderLabel,
  onClear,
}: {
  card: CardData;
  reminderLabel: string;
  onClear: () => void;
}) => {
  const [chatOpen, setChatOpen] = React.useState(false);
  const [flagOpen, setFlagOpen] = React.useState(false);
  const [isDismissing, setIsDismissing] = React.useState(false);

  const rawFirstName = card.name.split(" ")[0] ?? card.name;
  const firstName =
    rawFirstName.length > 12 ? rawFirstName.slice(0, 12) + "…" : rawFirstName;
  const initials = getInitials(card.name);

  const initialText = React.useMemo(() => {
    const s = card.requestSummary?.trim() ?? "";
    const d = card.request.trim();
    if (!s) return d;
    return `${s.replace(/[.!?]\s*$/, "")}. ${d}`;
  }, [card.requestSummary, card.request]);

  const initialMessages = React.useMemo(
    (): MultiChatMessage[] => [
      { id: "seed", sender: "incoming", text: initialText, timestamp: "" },
    ],
    [initialText],
  );

  const handleDismiss = () => {
    if (isDismissing) return;
    setIsDismissing(true);
    setTimeout(() => onClear(), 250);
  };

  return (
    <>
      <TableRow
        className={`hover:bg-transparent transition-opacity duration-300 ease-in-out $
          ${
          isDismissing ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        {/* Requestor */}
        <TableCell className="py-5 pl-4">
          <UserIdentityLink
            avatarUrl={card.avatarUrl}
            name={card.name}
            trustedFor={card.trustedFor ? [card.trustedFor] : []}
            href={`/trusted-list/members/${card.name.toLowerCase().replace(/\s+/g, "-")}`}
            avatarSize="sm"
            avatarBorderClass="border-background"
            showTrustedFor={!!card.trustedFor}
            className="min-w-0"
          />
        </TableCell>
        {/* Request */}
        <TableCell className="py-5">
          <a
            href={`/trusted-list/requests/view/${card.id}`}
            className="group/link flex flex-col min-w-0 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-medium leading-tight text-card-foreground truncate transition-colors group-hover/link:text-primary">
              {card.requestSummary}
            </p>
          </a>
        </TableCell>
        {/* Reminder */}
        <TableCell className="py-5 whitespace-nowrap">
          <span className="inline-flex items-center gap-1 rounded-full border border-lime-200 bg-lime-50 px-2.5 py-1 text-xs font-medium text-lime-700">
            <BellPlus className="h-3 w-3 shrink-0" />
            {reminderLabel}
          </span>
        </TableCell>
        {/* Audience */}
        <TableCell className="py-5 whitespace-nowrap">
          <AudienceBadge audience={cardVariantToAudienceKey(card.variant)} />
        </TableCell>
        {/* Topic */}
        <TableCell className="py-5">
          {card.category ? (
            <Badge
              variant="outline"
              className="rounded-full capitalize leading-4"
            >
              {card.category}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        {/* Actions */}
        <TableCell className="py-5 pr-4">
          <div className="flex justify-end items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="max-w-[9rem] px-3 h-8 text-xs font-semibold rounded-full gap-1.5 border shadow-sm hover:bg-accent hover:text-accent-foreground overflow-hidden"
              onClick={(e) => {
                e.stopPropagation();
                setChatOpen(true);
              }}
            >
              <MessagesSquare className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Help {firstName}</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDismiss}>
                  <EyeOff className="mr-2 h-4 w-4" /> I can't help with this
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setFlagOpen(true)}
                >
                  <Flag className="mr-2 h-4 w-4" /> Flag as inappropriate
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>

      <ChatMultiHelperModal
        open={chatOpen}
        onOpenChange={setChatOpen}
        isMyRequest={false}
        title={card.requestSummary ?? card.request.slice(0, 60)}
        contacts={[
          {
            id: card.id,
            name: card.name,
            role: "",
            trustedFor: card.trustedFor ?? null,
            avatarUrl: card.avatarUrl ?? null,
          },
        ]}
        messagesByContactId={{ [card.id]: initialMessages }}
      />

      <FlagRequestDialog
        open={flagOpen}
        onOpenChange={setFlagOpen}
        requestorName={card.name}
        requestorAvatarUrl={card.avatarUrl || undefined}
        requestSummary={card.requestSummary}
        requestText={card.request}
        onSubmit={handleDismiss}
      />
    </>
  );
};