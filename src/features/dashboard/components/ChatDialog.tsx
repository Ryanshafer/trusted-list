import { ArrowUp, CheckCircle2, Sparkles, Star, X, Paperclip, Plus } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
};

export type CompletionData = {
  rating: number;
  note: string;
  publicThanks: boolean;
};

type ChatDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactName: string;
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
  contactName,
  messages,
  composer,
  onComposerChange,
  onSend,
  isHelpRequest,
  isCompleted,
  onComplete,
  onUndoComplete,
}: ChatDialogProps) => {
  const [showCompletionForm, setShowCompletionForm] = React.useState(false);
  const [showUndoConfirm, setShowUndoConfirm] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Reset form state when dialog closes or opens
  React.useEffect(() => {
    if (!open) setShowCompletionForm(false);
  }, [open]);

  // Auto-scroll to bottom when messages change or dialog opens
  React.useEffect(() => {
    if (open) {
      // Use setTimeout to ensure DOM has updated and dialog is fully mounted
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DialogTitle>Chat with {contactName}</DialogTitle>
          </DialogHeader>
          <div className="flex h-[80dvh] flex-col space-y-1">
            <div className="relative flex-1 min-h-0">
              <div
                ref={scrollRef}
                className="h-full space-y-3 overflow-y-auto py-4 pr-2"
                style={{ scrollbarGutter: "stable" }}
              >
                {messages.map((message) => (
                  <ChatBubble key={message.id} message={message} contactName={contactName} />
                ))}
              </div>
              <div className="pointer-events-none absolute -top-px left-0 right-0 h-8 bg-gradient-to-b from-white dark:from-background to-transparent z-10" />
              <div className="pointer-events-none absolute -bottom-px left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-background to-transparent z-10" />
            </div>

            {showCompletionForm ? (
              <CompletionForm
                contactName={contactName}
                onCancel={() => setShowCompletionForm(false)}
                onSubmit={(data) => {
                  onComplete?.(data);
                  setShowCompletionForm(false);
                }}
              />
            ) : (
              <div className="flex flex-col gap-3">
                <form onSubmit={handleSubmit}>
                  <div className="rounded-3xl border border-border bg-muted/20 p-2 shadow-sm transition-all focus-within:border-primary/30 focus-within:bg-muted/30 focus-within:shadow-md">
                    <Textarea
                      value={composer}
                      onChange={(event) => onComposerChange(event.target.value)}
                      placeholder={
                        isCompleted
                          ? "This request is completed"
                          : `Let ${contactName.split(" ")[0] ?? contactName} know how you can help`
                      }
                      disabled={isCompleted}
                      className="min-h-8 w-full resize-none border-none bg-transparent p-2 text-md font-normal leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0"
                      rows={1}
                    />
                    <div className="mt-2 flex items-center justify-between px-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleAttachClick}
                        disabled={isCompleted}
                        className="h-8 w-8 rounded-xl border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
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
                        className="h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95"
                      >
                        <ArrowUp className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </form>

                {isHelpRequest && (
                  <div className="flex items-center space-x-2 px-1">
                    <Checkbox
                      id="request-complete"
                      checked={isCompleted}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setShowCompletionForm(true);
                        } else {
                          setShowUndoConfirm(true);
                        }
                      }}
                    />
                    <label
                      htmlFor="request-complete"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Request complete
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showUndoConfirm} onOpenChange={setShowUndoConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Undo completion?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will remove the public thank you and revoke the karma points awarded.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowUndoConfirm(false)}>Cancel</Button>
            <Button onClick={() => {
              onUndoComplete?.();
              setShowUndoConfirm(false);
            }}>Confirm Undo</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const CompletionForm = ({
  contactName,
  onCancel,
  onSubmit
}: {
  contactName: string;
  onCancel: () => void;
  onSubmit: (data: CompletionData) => void;
}) => {
  const [rating, setRating] = React.useState(5);
  const [note, setNote] = React.useState("");
  const [publicThanks, setPublicThanks] = React.useState(true);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="font-semibold">Complete Request</h4>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Rate help quality</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`rounded-md p-1 transition-colors ${rating >= star ? "text-amber-400" : "text-muted-foreground/30"
                  }`}
              >
                <Star className="h-6 w-6 fill-current" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Add a note (optional)</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`Thank ${contactName} for their help...`}
            className="resize-none"
            rows={2}
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="public-thanks" className="flex flex-col gap-1">
            <span>Publicly thank {contactName}</span>
            <span className="font-normal text-xs text-muted-foreground">They will receive karma points</span>
          </Label>
          <Switch
            id="public-thanks"
            checked={publicThanks}
            onCheckedChange={setPublicThanks}
          />
        </div>

        <Button
          className="w-full"
          onClick={() => onSubmit({ rating, note, publicThanks })}
        >
          Complete & Send Feedback
        </Button>
      </div>
    </div>
  );
};

const ChatBubble = ({ message, contactName }: { message: ChatMessage; contactName: string }) => {
  if (message.type === "system") {
    return (
      <div className="flex items-center justify-center gap-4 py-4">
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
        <div className="flex max-w-[85%] flex-col items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-900/50 dark:bg-amber-900/20">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              {title}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {message.text}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isUser = message.sender === "user";
  const label = isUser ? "You" : contactName;
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
          }`}
      >
        <p className="text-xs font-semibold">{label}</p>
        <p className="mt-1 leading-relaxed">{message.text}</p>
      </div>
    </div>
  );
};
