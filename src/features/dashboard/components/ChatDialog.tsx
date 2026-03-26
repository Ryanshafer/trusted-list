import { ArrowRight, ArrowUp, CircleCheckBig, Sparkles, Plus } from "lucide-react";
import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ChatMessage = {
  id: number;
  sender: "contact" | "user" | "system";
  text: string;
  type?: "message" | "system" | "karma";
  timestamp?: string;
};

export type Outcome = "worked_out" | "partially" | "not_quite";

export type CompletionData = {
  outcome: Outcome;
  note: string;
};

type ChatDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestTitle?: string;
  contactName: string;
  contactAvatarUrl?: string;
  messages: ChatMessage[];
  composer: string;
  onComposerChange: (value: string) => void;
  onSend: (message: string) => void;
  isHelpRequest?: boolean;
  isCompleted?: boolean;
  onComplete?: (data: CompletionData) => void;
  onUndoComplete?: () => void;
};

export const ChatDialog = ({
  open,
  onOpenChange,
  requestTitle,
  contactName,
  contactAvatarUrl,
  messages,
  composer,
  onComposerChange,
  onSend,
  isHelpRequest,
  isCompleted,
  onComplete,
}: ChatDialogProps) => {
  const [showCloseForm, setShowCloseForm] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) setShowCloseForm(false);
  }, [open]);

  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSend(composer);
  };

  const handleAttachClick = () => {
    if (isCompleted) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onSend(`[Attachment] ${file.name}`);
      event.target.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <DialogTitle asChild>
            <h2 className="text-lg leading-snug">
              {requestTitle ? (
                <>
                  <span className="font-bold">{requestTitle}</span>
                  <span className="font-normal"> with {contactName}</span>
                </>
              ) : (
                <span className="font-bold">{contactName}</span>
              )}
            </h2>
          </DialogTitle>
        </DialogHeader>
        <div className="flex h-[80dvh] flex-col gap-3">
          <div className="relative flex-1 min-h-0">
            <div
              ref={scrollRef}
              className="h-full space-y-4 overflow-y-auto py-4 pr-2"
              style={{ scrollbarGutter: "stable" }}
            >
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  contactName={contactName}
                  contactAvatarUrl={contactAvatarUrl}
                />
              ))}
            </div>
            <div className="pointer-events-none absolute -top-px left-0 right-0 h-8 bg-gradient-to-b from-background to-transparent z-10" />
            <div className="pointer-events-none absolute -bottom-px left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent z-10" />
          </div>

          {showCloseForm ? (
            <CloseTheLoopForm
              contactName={contactName}
              onCancel={() => setShowCloseForm(false)}
              onSubmit={(data) => {
                onComplete?.(data);
                setShowCloseForm(false);
              }}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {isHelpRequest && !isCompleted && (
                <Button
                  variant="outline"
                  className="w-full rounded-full font-semibold leading-none text-primary hover:bg-primary-10 hover:text-primary"
                  onClick={() => setShowCloseForm(true)}
                >
                  <CircleCheckBig className="mr-2 h-4 w-4" />
                  Mark this as helped
                </Button>
              )}

              <form onSubmit={handleSubmit}>
                <div className="rounded-2xl border border-border bg-muted p-3 shadow-sm transition-all focus-within:border-primary-25 focus-within:shadow-md">
                  <Textarea
                    value={composer}
                    onChange={(event) => onComposerChange(event.target.value)}
                    placeholder={
                      isCompleted
                        ? "This request is completed"
                        : `Let ${contactName.split(" ")[0] ?? contactName} know how you can help`
                    }
                    disabled={isCompleted}
                    className="min-h-8 w-full resize-none border-none bg-transparent p-1 text-base font-normal leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                    rows={2}
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleAttachClick}
                      disabled={isCompleted}
                      className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted-50 hover:text-foreground disabled:opacity-50"
                      aria-label="Attach a file"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isCompleted}
                    />

                    <Button
                      type="submit"
                      size="icon"
                      disabled={isCompleted || !composer.trim()}
                      className="h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary-75 disabled:opacity-50 transition-all active:scale-95"
                    >
                      <ArrowUp className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const OUTCOMES: { value: Outcome; label: string }[] = [
  { value: "worked_out", label: "It worked out" },
  { value: "partially", label: "Partially there" },
  { value: "not_quite", label: "Not quite there" },
];

const CloseTheLoopForm = ({
  contactName,
  onCancel,
  onSubmit,
}: {
  contactName: string;
  onCancel: () => void;
  onSubmit: (data: CompletionData) => void;
}) => {
  const [outcome, setOutcome] = React.useState<Outcome>("worked_out");
  const [note, setNote] = React.useState("");
  const firstName = contactName.split(" ")[0] ?? contactName;

  return (
    <div className="rounded-2xl border border-primary bg-primary/10 p-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="space-y-5">
        <div className="space-y-0.5">
          <h4 className="text-xl font-bold leading-none">Close the loop</h4>
          <p className="text-sm text-muted-foreground">Share how it went and complete this request.</p>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold">How did it go with {firstName}?</Label>
          <div className="flex gap-3">
            {OUTCOMES.map(({ value, label }) => {
              const selected = outcome === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOutcome(value)}
                  className={`flex flex-1 items-center gap-2 rounded-lg border px-3 py-3 text-left transition-colors ${
                    selected
                      ? "border-primary bg-primary-25 text-accent-foreground"
                      : "border-border bg-background text-foreground hover:bg-muted/50"
                  }`}
                >
                  <div
                    className={`h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${
                      selected ? "border-primary bg-primary" : "border-muted-foreground"
                    }`}
                  >
                    {selected && (
                      <div className="m-auto mt-[2px] h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                    )}
                  </div>
                  <span className="text-sm font-semibold leading-tight">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold">What would you like {firstName} to know?</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Share some details…"
            className="resize-none bg-background"
            rows={3}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            className="rounded-full font-semibold leading-none"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            className="rounded-full font-semibold leading-none"
            onClick={() => onSubmit({ outcome, note: note.trim() })}
          >
            Share & Close the Loop
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const ChatBubble = ({
  message,
  contactName,
  contactAvatarUrl,
}: {
  message: ChatMessage;
  contactName: string;
  contactAvatarUrl?: string;
}) => {
  if (message.type === "system") {
    return (
      <div className="flex items-center justify-center gap-4 py-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-muted-foreground">{message.text}</span>
        <div className="h-px flex-1 bg-border" />
      </div>
    );
  }

  if (message.type === "karma") {
    const isUser = message.sender === "user";
    const title = isUser
      ? `You publicly thanked ${contactName}!`
      : `${contactName} publicly thanked you!`;

    return (
      <div className="flex justify-center py-2">
        <div className="flex max-w-[85%] flex-col items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-900/50 dark:bg-amber-900/25">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">{title}</p>
            <p className="text-xs text-amber-700 dark:text-amber-300">{message.text}</p>
          </div>
        </div>
      </div>
    );
  }

  const isUser = message.sender === "user";

  if (isUser) {
    return (
      <div className="flex w-full pl-14">
        <div className="flex flex-1 flex-col gap-1 rounded-lg bg-primary-25 p-4 text-foreground">
          <p className="text-base leading-relaxed">{message.text}</p>
          {message.timestamp && (
            <p className="text-right text-xs text-muted-foreground">{message.timestamp}</p>
          )}
        </div>
      </div>
    );
  }

  const initials = contactName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex gap-4">
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={contactAvatarUrl} alt={contactName} />
        <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-1 flex-col gap-1 pt-1">
        <p className="text-base leading-relaxed text-foreground">{message.text}</p>
        {message.timestamp && (
          <p className="text-right text-xs text-muted-foreground">{message.timestamp}</p>
        )}
      </div>
    </div>
  );
};
