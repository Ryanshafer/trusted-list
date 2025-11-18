import * as React from "react";
import { ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ChatMessage = {
  id: number;
  sender: "contact" | "user";
  text: string;
};

type ChatDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactName: string;
  messages: ChatMessage[];
  composer: string;
  onComposerChange: (value: string) => void;
  onSend: (message: string) => void;
};

export const ChatDialog = ({
  open,
  onOpenChange,
  contactName,
  messages,
  composer,
  onComposerChange,
  onSend,
}: ChatDialogProps) => {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSend(composer);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Chat with {contactName}</DialogTitle>
        </DialogHeader>
        <div className="flex h-[420px] flex-col space-y-4">
          <div
            className="flex-1 space-y-3 overflow-y-auto pr-2"
            style={{ scrollbarGutter: "stable" }}
          >
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} contactName={contactName} />
            ))}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-3 rounded-3xl border border-border bg-muted/50 px-4 py-3">
              <Input
                value={composer}
                onChange={(event) => onComposerChange(event.target.value)}
                placeholder={`Let ${contactName.split(" ")[0] ?? contactName} know how you can help`}
                className="flex-1 border-none bg-transparent p-0 text-base text-muted-foreground shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 rounded-full bg-muted-foreground/30 text-muted-foreground hover:bg-primary hover:text-primary-foreground"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ChatBubble = ({ message, contactName }: { message: ChatMessage; contactName: string }) => {
  const isUser = message.sender === "user";
  const label = isUser ? "You" : contactName;
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        }`}
      >
        <p className="text-xs font-semibold">{label}</p>
        <p className="mt-1 leading-relaxed">{message.text}</p>
      </div>
    </div>
  );
};

