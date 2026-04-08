import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowRight,
  ArrowUp,
  CircleCheck,
  CircleCheckBig,
  Download,
  FileText,
  Flag,
  MoreVertical,
  Plus,
  Search,
  UserX,
  X,
} from "lucide-react";

import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { FlagRequestDialog } from "@/features/moderation/components/FlagRequestDialog";
import chatData from "../../../../data/chat-multi-helper.json";
import currentUser from "../../../../data/current-user.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConversationStatus = "active" | "closing" | "completed";
type OutcomeOption = "worked-out" | "partially" | "not-quite";

interface Contact {
  id: string;
  name: string;
  role: string;
  trustedFor?: string | null;
  avatarUrl?: string | null;
  isCompleted?: boolean;
}

interface Attachment {
  name: string;
  size: string;
  fileType: string;
  pages: number;
}

export interface Message {
  id: string;
  text?: string;
  sender: "outgoing" | "incoming";
  timestamp: string;
  attachment?: Attachment;
}

type ContactMessagesMap = Record<string, Message[]>;

const MOCK_CONTACTS: Contact[] = chatData.contacts as Contact[];
const MOCK_MESSAGES: Message[] = chatData.messages as Message[];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------



// ---------------------------------------------------------------------------
// Contact row
// ---------------------------------------------------------------------------

function ContactRow({
  contact,
  isSelected,
  isReopened,
  isCompletedInSession,
  onClick,
}: {
  contact: Contact;
  isSelected: boolean;
  isReopened: boolean;
  isCompletedInSession: boolean;
  onClick: () => void;
}) {
  const effectivelyCompleted = (contact.isCompleted || isCompletedInSession) && !isReopened;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-between gap-2 w-full p-3 rounded-lg text-left transition-colors",
        cn(
          isSelected ? "bg-muted" : effectivelyCompleted ? "bg-emerald-100" : "bg-transparent",
          !isSelected && (effectivelyCompleted ? "hover:bg-emerald-200" : "hover:bg-accent")
        )
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Avatar className="h-10 w-10 shrink-0 border-2 border-primary-foreground shadow-md">
          {contact.avatarUrl ? (
            <AvatarImage
              src={contact.avatarUrl}
              alt={contact.name}
              className="object-cover"
            />
          ) : null}
          <AvatarFallback className="text-sm font-bold bg-accent">
            {getInitials(contact.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col min-w-0">
          <span className={cn(
            "text-base font-semibold leading-6 truncate",
            effectivelyCompleted ? "text-neutral-900" : "text-foreground"
          )}>
            {contact.name}
          </span>
          <span className={cn(
            "text-xs leading-4 line-clamp-2 leading-tight",
            effectivelyCompleted ? "text-neutral-600" : "text-muted-foreground"
          )}>
            {`Trusted for ${contact.trustedFor}`}
          </span>
        </div>
      </div>

      {effectivelyCompleted && (
        <div className="flex items-center px-2 shrink-0">
          <div className="bg-popover flex items-center p-0.5 rounded-full">
            <CircleCheck className="h-6 w-6 text-success-600" />
          </div>
        </div>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Outcome pill
// ---------------------------------------------------------------------------

const OUTCOME_LABELS: Record<OutcomeOption, string> = {
  "worked-out": "It worked out",
  partially: "Partially there",
  "not-quite": "Not quite there",
};

function OutcomePill({
  value,
  selected,
  onSelect,
}: {
  value: OutcomeOption;
  selected: boolean;
  onSelect: (v: OutcomeOption) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        "flex-1 flex items-center gap-2 px-3 h-12 rounded-lg border text-sm font-semibold transition-colors",
        selected
          ? "bg-primary-25 border-primary text-accent-foreground"
          : "bg-background border-border-75 text-foreground hover:bg-muted"
      )}
    >
      <span
        className={cn(
          "h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center",
          selected ? "border-primary" : "border-muted-foreground"
        )}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
      {OUTCOME_LABELS[value]}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Message bubbles
// ---------------------------------------------------------------------------

function OutgoingBubble({ message }: { message: Message }) {
  return (
    <div className="flex items-start pl-16 w-full shrink-0">
      <div className="flex-1 flex flex-col gap-1 bg-primary-10 p-4 rounded-lg">
        {message.attachment ? (
          <div className="flex items-start gap-2 w-full">
            <FileText className="h-6 w-6 shrink-0 text-foreground mt-0.5" />
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <span className="text-base font-semibold text-foreground leading-6">
                {message.attachment.name}
              </span>
              <span className="text-sm text-muted-foreground leading-5">
                {message.attachment.size} · {message.attachment.fileType} ·{" "}
                {message.attachment.pages} page
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full shrink-0"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <p className="text-base text-foreground leading-6">{message.text}</p>
        )}
        <p className="text-xs text-muted-foreground leading-4 text-right">
          {message.timestamp}
        </p>
      </div>
    </div>
  );
}

function IncomingBubble({ message }: { message: Message }) {
  return (
    <div className="flex items-start pr-16 w-full shrink-0">
      <div className="flex-1 flex flex-col gap-1 bg-muted/50 p-4 rounded-lg">
        <p className="text-base text-foreground leading-6">{message.text}</p>
        <p className="text-xs text-muted-foreground leading-4 text-right">
          {message.timestamp}
        </p>
      </div>
    </div>
  );
}

function ConversationSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="pb-3 shrink-0">
      <div className="flex items-center gap-2 h-9 px-3 rounded-full border border-border bg-background">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground mb-0.5" />
        <input
          type="text"
          placeholder="Search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground outline-none"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function ContactListPanel({
  contacts,
  selectedContactId,
  reopenedContactIds,
  sessionCompletedIds,
  onSelectContact,
}: {
  contacts: Contact[];
  selectedContactId?: string;
  reopenedContactIds: Set<string>;
  sessionCompletedIds: Set<string>;
  onSelectContact: (contact: Contact) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {contacts.map((contact) => (
        <ContactRow
          key={contact.id}
          contact={contact}
          isSelected={contact.id === selectedContactId}
          isReopened={reopenedContactIds.has(contact.id)}
          isCompletedInSession={sessionCompletedIds.has(contact.id)}
          onClick={() => onSelectContact(contact)}
        />
      ))}
    </div>
  );
}

function ConversationHeader({
  contact,
  isCompletedContact,
  onFlag,
  onBlock,
}: {
  contact?: Contact;
  isCompletedContact: boolean;
  onFlag: () => void;
  onBlock: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 pl-6 pr-4 py-3 border-b shrink-0 shadow-md",
        isCompletedContact
          ? "bg-success-700 border-emerald-900"
          : "bg-accent border-border"
      )}
    >
      <a
        href={contact ? `/trusted-list/members/${contact.name.toLowerCase().replace(/\s+/g, "-")}` : undefined}
        className="flex items-center gap-3 min-w-0 group/member"
      >
        <Avatar className={cn(
          "h-[60px] w-[60px] shrink-0 border-2 border-primary-foreground shadow-md transition-colors",
          isCompletedContact
            ? "group-hover/member:border-white/50"
            : "group-hover/member:border-primary"
        )}>
          {contact?.avatarUrl ? (
            <AvatarImage
              src={contact.avatarUrl}
              alt={contact.name}
              className="object-cover"
            />
          ) : null}
          <AvatarFallback className="text-lg font-bold bg-accent">
            {getInitials(contact?.name ?? "")}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col flex-1 min-w-0">
          <span
            className={cn(
              "text-xl font-bold leading-7 transition-colors",
              isCompletedContact
                ? "text-primary-foreground group-hover/member:text-primary-foreground/70"
                : "text-foreground group-hover/member:text-primary"
            )}
          >
            {contact?.name}
          </span>
          <span
            className={cn(
              "text-sm leading-6 line-clamp-2 leading-tight",
              isCompletedContact
                ? "text-primary-foreground/70"
                : "text-muted-foreground"
            )}
          >
            {`Trusted for ${contact?.trustedFor}`}
          </span>
        </div>
      </a>

      <div className="ml-auto flex items-center gap-3 shrink-0">
        {isCompletedContact && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-popover shrink-0">
            <span className="text-xs font-bold leading-4 text-success-700 whitespace-nowrap">Complete</span>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-full shrink-0",
                isCompletedContact ? "text-primary-foreground hover:bg-white/20 hover:text-primary-foreground" : "text-muted-foreground"
              )}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onFlag}
            >
              <Flag className="mr-2 h-4 w-4" />
              Flag this conversation
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onBlock}
            >
              <UserX className="mr-2 h-4 w-4" />
              Block this user
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function ConversationMessageThread({
  messages,
  isCompletedContact,
  activeFeedback,
  outcomeCopy,
  requesterName,
  onReopenContact,
  messagesEndRef,
}: {
  messages: Message[];
  isCompletedContact: boolean;
  activeFeedback?: CompletionFeedback;
  outcomeCopy: { emoji: string; title: string };
  requesterName: string;
  onReopenContact: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-6 pt-6 flex flex-col gap-6 min-h-0">
      {messages.map((message) =>
        message.sender === "outgoing" ? (
          <OutgoingBubble key={message.id} message={message} />
        ) : (
          <IncomingBubble key={message.id} message={message} />
        )
      )}

      {isCompletedContact && activeFeedback && (
        <ConversationCompletionCard
          feedback={activeFeedback}
          outcomeCopy={outcomeCopy}
          requesterName={requesterName}
          onReopen={onReopenContact}
        />
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

function ConversationCompletionCard({
  feedback,
  outcomeCopy,
  requesterName,
  onReopen,
}: {
  feedback: CompletionFeedback;
  outcomeCopy: { emoji: string; title: string };
  requesterName: string;
  onReopen: () => void;
}) {
  return (
    <div className="flex items-center justify-center w-full py-2 shrink-0">
      <div className="relative bg-success-50 rounded-2xl shadow-md p-6 w-80 flex flex-col gap-7">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onReopen}>
              Reopen request
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex flex-col gap-3 text-center">
          <div className="flex flex-col gap-2 text-neutral-900">
            <p className="text-4xl leading-10">{outcomeCopy.emoji}</p>
            <p className="text-xl font-bold leading-7">
              {requesterName} {outcomeCopy.title}
            </p>
          </div>
          <p className="text-base text-neutral-600 leading-6">
            <span className="font-semibold text-neutral-900">
              {requesterName} said —{" "}
            </span>
            {feedback.text}
          </p>
        </div>
      </div>
    </div>
  );
}

function ActiveConversationComposer({
  composer,
  onComposerChange,
  onSend,
  onMarkComplete,
}: {
  composer: string;
  onComposerChange: (value: string) => void;
  onSend: () => void;
  onMarkComplete: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 px-6 pb-6 pt-4 shrink-0">
      <div className="flex items-center justify-center">
        <Button
          variant="outline"
          className="w-full rounded-full font-semibold text-primary border-border gap-2 px-4 shadow-none"
          onClick={onMarkComplete}
        >
          <CircleCheckBig className="h-4 w-4 shrink-0 mb-0.5" />
          Mark this as completed
        </Button>
      </div>

      <div className="relative">
        <div className="bg-secondary border border-border rounded-2xl h-[120px] overflow-hidden px-3.5 pt-3 pb-12">
          <textarea
            value={composer}
            onChange={(event) => onComposerChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
            placeholder="Write a message…"
            className="w-full h-full bg-transparent text-base leading-6 placeholder:text-muted-foreground outline-none resize-none"
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3.5 py-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full text-muted-foreground"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            disabled={!composer.trim()}
            onClick={onSend}
            className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ClosingConversationPanel({
  selectedFirstName,
  outcome,
  feedback,
  onOutcomeChange,
  onFeedbackChange,
  onCancel,
  onShareClose,
}: {
  selectedFirstName: string;
  outcome: OutcomeOption;
  feedback: string;
  onOutcomeChange: (value: OutcomeOption) => void;
  onFeedbackChange: (value: string) => void;
  onCancel: () => void;
  onShareClose: () => void;
}) {
  return (
    <div className="px-6 pb-6 pt-2 shrink-0">
      <div className="border border-primary rounded-2xl overflow-hidden">
        <div className="bg-primary-10 p-6 flex flex-col gap-8">
          <div className="flex flex-col gap-1">
            <p className="font-serif text-2xl leading-8 font-bold text-foreground">
              Close the loop
            </p>
            <p className="text-base leading-6 text-muted-foreground">
              Share how it went and complete this request.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-base font-semibold leading-6 text-foreground">
              How did it go with {selectedFirstName}?
            </p>
            <div className="flex gap-3">
              {(
                [
                  "worked-out",
                  "partially",
                  "not-quite",
                ] as OutcomeOption[]
              ).map((value) => (
                <OutcomePill
                  key={value}
                  value={value}
                  selected={outcome === value}
                  onSelect={onOutcomeChange}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-base font-semibold leading-6 text-foreground">
              What would you like {selectedFirstName} to know?
            </p>
            <Textarea
              value={feedback}
              onChange={(event) => onFeedbackChange(event.target.value)}
              placeholder="Share some details…"
              className="h-[120px] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-4">
            <Button
              variant="ghost"
              className="rounded-full font-semibold text-sm"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              onClick={onShareClose}
            >
              Share & Close the Loop
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export type CompletionFeedback = {
  outcome: OutcomeOption;
  text: string;
};

export interface ChatMultiHelperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  contacts?: Contact[];
  messages?: Message[];
  messagesByContactId?: Record<string, Message[]>;
  completionFeedbackByContactId?: Record<string, CompletionFeedback>;
  requesterName?: string;
  initialContactId?: string;
}

const OUTCOME_COPY: Record<OutcomeOption, { emoji: string; title: string }> = {
  "worked-out": { emoji: "🎉", title: "thinks this request worked out!" },
  partially:    { emoji: "🙂", title: "thinks this partially worked out" },
  "not-quite":  { emoji: "😔", title: "thinks this didn't quite work out" },
};

export function ChatMultiHelperModal({
  open,
  onOpenChange,
  title = "Hiring Senior Engineers",
  contacts = MOCK_CONTACTS,
  messages = MOCK_MESSAGES,
  messagesByContactId,
  completionFeedbackByContactId,
  requesterName = currentUser.firstName,
  initialContactId,
}: ChatMultiHelperModalProps) {
  const [selectedContactId, setSelectedContactId] = React.useState(
    initialContactId ?? contacts[0]?.id
  );

  React.useEffect(() => {
    if (open) setSelectedContactId(initialContactId ?? contacts[0]?.id);
  }, [open, initialContactId]);
  const [status, setStatus] = React.useState<ConversationStatus>("active");
  const [outcome, setOutcome] = React.useState<OutcomeOption>("worked-out");
  const [feedback, setFeedback] = React.useState("");
  const [submittedFeedback, setSubmittedFeedback] = React.useState("");
  const [composer, setComposer] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [reopenedContactIds, setReopenedContactIds] = React.useState<Set<string>>(new Set());
  const [sessionCompletedIds, setSessionCompletedIds] = React.useState<Set<string>>(new Set());
  const [localMessages, setLocalMessages] = React.useState<Record<string, Message[]>>({});
  const [flagOpen, setFlagOpen] = React.useState(false);
  const [blockedIds, setBlockedIds] = React.useState<Set<string>>(new Set());
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const selected = contacts.find((c) => c.id === selectedContactId) ?? contacts[0];
  const mappedMessages = messagesByContactId && selectedContactId
    ? messagesByContactId[selectedContactId]
    : undefined;
  const baseMessages = mappedMessages && mappedMessages.length > 0 ? mappedMessages : messages;
  const displayMessages = selectedContactId
    ? [...baseMessages, ...(localMessages[selectedContactId] ?? [])]
    : baseMessages;
  const selectedFirst = selected?.name.split(" ")[0] ?? "";
  const isReopened = selectedContactId ? reopenedContactIds.has(selectedContactId) : false;
  // Completed if: just closed in this session, OR pre-completed from data and not reopened
  const isCompletedContact = status === "completed" || (!isReopened && !!selected?.isCompleted);

  // Feedback: skip stored when reopened (user will submit fresh feedback)
  const storedFeedback = (!isReopened && selectedContactId)
    ? completionFeedbackByContactId?.[selectedContactId]
    : undefined;
  const activeFeedback: CompletionFeedback | undefined = storedFeedback
    ?? (status === "completed" ? { outcome, text: submittedFeedback } : undefined);
  const outcomeCopy = OUTCOME_COPY[activeFeedback?.outcome ?? "worked-out"];

  // After modal opens or contact changes, wait for animation then jump to bottom
  React.useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    }, 220);
    return () => clearTimeout(id);
  }, [open, selectedContactId]);

  // Smooth-scroll as new messages or status changes arrive
  React.useEffect(() => {
    if (!open) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [status, displayMessages]);

  const handleReopenContact = () => {
    if (!selectedContactId) return;
    setReopenedContactIds((prev) => new Set([...prev, selectedContactId]));
    setSessionCompletedIds((prev) => { const next = new Set(prev); next.delete(selectedContactId); return next; });
    setStatus("active");
    setSubmittedFeedback("");
  };

  const handleSend = () => {
    const text = composer.trim();
    if (!text || !selectedContactId) return;
    const newMsg: Message = {
      id: `local-${Date.now()}`,
      sender: "outgoing",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    };
    setLocalMessages((prev) => ({
      ...prev,
      [selectedContactId]: [...(prev[selectedContactId] ?? []), newMsg],
    }));
    setComposer("");
  };

  const handleMarkComplete = () => setStatus("closing");
  const handleCancel = () => setStatus("active");
  const handleShareClose = () => {
    if (selectedContactId) setSessionCompletedIds((prev) => new Set([...prev, selectedContactId]));
    setSubmittedFeedback(feedback);
    setFeedback("");
    setStatus("completed");
  };

  const handleSelectContact = React.useCallback((contact: Contact) => {
    setSelectedContactId(contact.id);
    if (!contact.isCompleted || reopenedContactIds.has(contact.id)) {
      setStatus("active");
    }
  }, [reopenedContactIds]);

  const handleBlockSelectedContact = React.useCallback(() => {
    if (selected) {
      setBlockedIds((prev) => new Set([...prev, selected.id]));
    }
  }, [selected]);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-[1024px] h-[900px] rounded-2xl overflow-hidden",
            "flex flex-col bg-popover shadow-2xl",
            "duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          )}
        >
          {/* ── Modal header ───────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 py-4 bg-muted shrink-0">
            <DialogPrimitive.Title className="font-serif text-2xl font-normal leading-8 text-foreground">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full bg-background shrink-0"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogPrimitive.Close>
          </div>

          {/* ── Two-column layout ──────────────────────────────────────── */}
          <div className="flex flex-1 min-h-0">

            {/* ── Left panel ─────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col px-3 py-4 border-r border-border bg-popover min-w-0 overflow-y-auto">
              <ConversationSearch
                value={search}
                onChange={setSearch}
              />

              <ContactListPanel
                contacts={filtered}
                selectedContactId={selectedContactId}
                reopenedContactIds={reopenedContactIds}
                sessionCompletedIds={sessionCompletedIds}
                onSelectContact={handleSelectContact}
              />
            </div>

            {/* ── Right panel ────────────────────────────────────────── */}
            <div className="w-[623px] shrink-0 flex flex-col h-full bg-popover overflow-hidden">

              {/* Conversation header */}
              <ConversationHeader
                contact={selected}
                isCompletedContact={isCompletedContact}
                onFlag={() => setFlagOpen(true)}
                onBlock={handleBlockSelectedContact}
              />

              {/* Chat area */}
              <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

                {/* Message thread */}
                <ConversationMessageThread
                  messages={displayMessages}
                  isCompletedContact={isCompletedContact}
                  activeFeedback={activeFeedback}
                  outcomeCopy={outcomeCopy}
                  requesterName={requesterName}
                  onReopenContact={handleReopenContact}
                  messagesEndRef={messagesEndRef}
                />

                {/* ── Active: mark complete + composer ───────────────── */}
                {status === "active" && (!selected?.isCompleted || isReopened) && (
                  <ActiveConversationComposer
                    composer={composer}
                    onComposerChange={setComposer}
                    onSend={handleSend}
                    onMarkComplete={handleMarkComplete}
                  />
                )}

                {/* ── Closing: close-the-loop panel ──────────────────── */}
                {status === "closing" && (
                  <ClosingConversationPanel
                    selectedFirstName={selectedFirst}
                    outcome={outcome}
                    feedback={feedback}
                    onOutcomeChange={setOutcome}
                    onFeedbackChange={setFeedback}
                    onCancel={handleCancel}
                    onShareClose={handleShareClose}
                  />
                )}
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>

    <FlagRequestDialog
      open={flagOpen}
      onOpenChange={setFlagOpen}
      requestorName={selected?.name}
      requestorAvatarUrl={selected?.avatarUrl}
      requestSummary={title}
      requestText={title}
      onSubmit={() => setFlagOpen(false)}
    />
    </>
  );
}
