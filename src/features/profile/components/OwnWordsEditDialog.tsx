"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { OwnWordsEntry } from "../types";

const MAX_ANSWER_LENGTH = 220;

interface OwnWordsEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: OwnWordsEntry[];
  onSave: (entries: OwnWordsEntry[]) => void;
}

export function OwnWordsEditDialog({
  open,
  onOpenChange,
  entries,
  onSave,
}: OwnWordsEditDialogProps) {
  const [draftEntries, setDraftEntries] = useState(entries);

  useEffect(() => {
    if (open) {
      setDraftEntries(entries);
    }
  }, [entries, open]);

  const hasUpdates =
    draftEntries.length !== entries.length ||
    draftEntries.some((entry, index) => entry.answer !== entries[index]?.answer);

  const handleAnswerChange = (index: number, value: string) => {
    const clamped = value.slice(0, MAX_ANSWER_LENGTH);
    setDraftEntries((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], answer: clamped };
      return updated;
    });
  };

  const handleSave = () => {
    if (!hasUpdates) return;
    onSave(draftEntries);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[672px] gap-0 overflow-hidden rounded-2xl border-border bg-popover p-0 shadow-lg [&>button]:hidden">
        <div className="flex w-full items-start justify-between px-6 py-4">
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <h2 className="font-serif text-2xl font-normal leading-8 text-popover-foreground">
              Edit your {draftEntries.length} answers
            </h2>
          </div>
          <DialogClose asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-border bg-muted text-muted-foreground shadow-none hover:bg-muted"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </div>

        <div className="flex w-full">
          <div className="max-h-[calc(100vh-196px)] w-full overflow-y-auto px-6 pb-6 pt-4 [scrollbar-color:theme(colors.zinc.300)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-track]:bg-transparent">
            {draftEntries.map((entry, index) => {
              const length = entry.answer.length;
              return (
                <div
                  key={`${entry.question}-${index}`}
                  className={index === 0 ? "flex flex-col gap-1" : "mt-8 flex flex-col gap-1"}
                >
                  <div className="flex items-start justify-between gap-10">
                    <label
                      htmlFor={`own-words-answer-${index}`}
                      className="text-sm font-medium leading-5 text-popover-foreground"
                    >
                      {entry.question}
                    </label>
                    <p className="shrink-0 text-sm font-normal leading-5 text-muted-foreground">
                      <span className="text-popover-foreground">{length}</span>/{MAX_ANSWER_LENGTH}
                    </p>
                  </div>
                  <Textarea
                    id={`own-words-answer-${index}`}
                    value={entry.answer}
                    onChange={(event) => handleAnswerChange(index, event.target.value)}
                    rows={4}
                    maxLength={MAX_ANSWER_LENGTH}
                    className="min-h-[76px] resize-y rounded-lg border-border bg-popover px-[7px] py-[7px] text-sm leading-5 text-popover-foreground shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex w-full items-center justify-end gap-4 border-t border-border bg-card px-6 py-4">
          <div className="flex items-center justify-end gap-2">
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-full px-4 text-sm font-semibold text-popover-foreground hover:bg-transparent"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasUpdates}
              className="h-9 rounded-full px-4 text-sm font-semibold shadow-sm"
            >
              Save answers
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
