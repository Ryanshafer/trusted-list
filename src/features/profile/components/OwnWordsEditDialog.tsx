"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BaseDialog } from "@/components/BaseDialog";
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

  const footerContent = (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-9 rounded-full px-4 text-sm font-semibold text-popover-foreground hover:bg-transparent"
        onClick={() => onOpenChange(false)}
      >
        Cancel
      </Button>
      <Button
        size="sm"
        onClick={handleSave}
        disabled={!hasUpdates}
        className="h-9 rounded-full px-4 text-sm font-semibold shadow-sm"
      >
        Save answers
      </Button>
    </div>
  );

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit your ${draftEntries.length} answers`}
      size="xl"
      footerContent={footerContent}
    >
      <div className="flex w-full">
        <div className="w-full">
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
    </BaseDialog>
  );
}
