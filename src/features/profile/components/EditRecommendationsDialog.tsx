"use client";

import { useEffect, useState } from "react";
import { Eye, EyeClosed, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Recommendation } from "../types";

interface RecItem {
  id: number;
  rec: Recommendation;
  visible: boolean;
  order: number | null;
}

function buildItems(recs: Recommendation[], hiddenRecs: Recommendation[]): RecItem[] {
  const visible = recs.map((rec, i) => ({ id: i, rec, visible: true, order: i + 1 }));
  const hidden = hiddenRecs.map((rec, i) => ({
    id: recs.length + i,
    rec,
    visible: false,
    order: null,
  }));
  return [...visible, ...hidden];
}

interface EditRecommendationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendations: Recommendation[];
  hiddenRecommendations: Recommendation[];
  onSave: (result: { visible: Recommendation[]; hidden: Recommendation[] }) => void;
}

export function EditRecommendationsDialog({
  open,
  onOpenChange,
  recommendations,
  hiddenRecommendations,
  onSave,
}: EditRecommendationsDialogProps) {
  const [items, setItems] = useState<RecItem[]>(() =>
    buildItems(recommendations, hiddenRecommendations)
  );

  useEffect(() => {
    if (open) setItems(buildItems(recommendations, hiddenRecommendations));
  }, [open, recommendations, hiddenRecommendations]);

  const visibleCount = items.filter((it) => it.visible).length;

  function toggleVisibility(id: number) {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id)!;

      if (target.visible) {
        // Hiding: remove from order, compact remaining visible
        let counter = 1;
        return prev.map((it) => {
          if (it.id === id) return { ...it, visible: false, order: null };
          if (!it.visible) return it;
          return { ...it, order: counter++ };
        });
      } else {
        // Showing: append to end of visible list
        const newVisibleCount = prev.filter((it) => it.visible).length + 1;
        return prev.map((it) => {
          if (it.id === id) return { ...it, visible: true, order: newVisibleCount };
          return it;
        });
      }
    });
  }

  function reorder(id: number, newOrder: number) {
    setItems((prev) => {
      const currentOrder = prev.find((it) => it.id === id)?.order;
      if (currentOrder == null || currentOrder === newOrder) return prev;
      return prev.map((it) => {
        if (!it.visible) return it;
        if (it.id === id) return { ...it, order: newOrder };
        if (it.order === newOrder) return { ...it, order: currentOrder };
        return it;
      });
    });
  }

  function handleSave() {
    const visible = items
      .filter((it) => it.visible)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((it) => it.rec);
    const hidden = items.filter((it) => !it.visible).map((it) => it.rec);
    onSave({ visible, hidden });
    onOpenChange(false);
  }

  const displayItems = [...items].sort((a, b) => {
    if (a.visible && b.visible) return (a.order ?? 0) - (b.order ?? 0);
    if (a.visible) return -1;
    if (b.visible) return 1;
    return 0;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[672px] gap-0 overflow-hidden rounded-2xl border-border bg-popover p-0 shadow-lg [&>button]:hidden">
        {/* Header */}
        <div className="flex w-full items-start justify-between px-6 py-4">
          <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
            <h2 className="font-serif text-2xl font-normal leading-8 text-popover-foreground">
              Manage your recommendations
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

        {/* Scrollable list */}
        <div className="w-full overflow-y-auto max-h-[calc(100vh-200px)] px-6 pb-6 pt-4 [scrollbar-color:theme(colors.zinc.300)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-track]:bg-transparent">
          <div className="flex flex-col gap-3">
            {displayItems.map((item) => (
              <RecommendationRow
                key={item.id}
                item={item}
                visibleCount={visibleCount}
                onToggle={() => toggleVisibility(item.id)}
                onReorder={(newOrder) => reorder(item.id, newOrder)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex w-full items-center justify-end gap-4 border-t border-border bg-card px-6 py-4">
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
            className="h-9 rounded-full px-4 text-sm font-semibold shadow-none"
          >
            Save recommendations
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface RecommendationRowProps {
  item: RecItem;
  visibleCount: number;
  onToggle: () => void;
  onReorder: (newOrder: number) => void;
}

function RecommendationRow({ item, visibleCount, onToggle, onReorder }: RecommendationRowProps) {
  const [inputValue, setInputValue] = useState(item.visible ? String(item.order) : "-");

  useEffect(() => {
    setInputValue(item.visible ? String(item.order) : "-");
  }, [item.order, item.visible]);

  function commitOrder() {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= visibleCount) {
      onReorder(parsed);
    } else {
      setInputValue(item.visible ? String(item.order) : "-");
    }
  }

  return (
    <div
      className={cn(
        "flex items-stretch overflow-hidden rounded-lg",
        item.visible ? "bg-card" : "bg-sidebar"
      )}
    >
      {/* Order input panel */}
      <div className="flex w-[60px] shrink-0 items-center self-stretch border-r border-border bg-muted/50 px-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => item.visible && setInputValue(e.target.value)}
          onBlur={commitOrder}
          onKeyDown={(e) => e.key === "Enter" && commitOrder()}
          readOnly={!item.visible}
          aria-label="Recommendation order"
          className={cn(
            "w-full min-h-8 rounded-lg border border-border bg-background px-2 text-center text-sm text-foreground transition-opacity focus:outline-none focus:ring-1 focus:ring-ring",
            !item.visible && "opacity-50"
          )}
        />
      </div>

      {/* Content + eye button */}
      <div className="flex flex-1 items-center gap-5 pl-5 pr-3 py-5">
        {/* Recommendation content */}
        <div
          className={cn(
            "flex flex-1 flex-col gap-3.5 transition-opacity",
            !item.visible && "opacity-50"
          )}
        >
          {/* User info */}
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-background shadow-sm">
              {item.rec.recommenderAvatarUrl ? (
                <img
                  src={item.rec.recommenderAvatarUrl}
                  alt={item.rec.recommenderName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-muted" />
              )}
            </div>

            {/* Name + degree badge + trusted-for */}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex items-center gap-3">
                <span className="font-sans text-lg font-bold leading-7 text-card-foreground whitespace-nowrap">
                  {item.rec.recommenderName}
                </span>
                <span className="rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-800">
                  {item.rec.recommenderConnectionDegree}
                </span>
              </div>
              <p className="truncate text-xs font-normal leading-4 text-muted-foreground">
                Trusted for {item.rec.recommenderTrustedFor.join(", ")}
              </p>
            </div>
          </div>

          {/* Body */}
          <p
            className={cn(
              "font-serif text-base leading-6 transition-colors",
              item.visible ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {item.rec.body}
          </p>
        </div>

        {/* Visibility toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={onToggle}
          className="h-9 w-9 shrink-0 rounded-full border-border bg-background shadow-none hover:bg-accent"
          aria-label={item.visible ? "Hide recommendation" : "Show recommendation"}
        >
          {item.visible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeClosed className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
