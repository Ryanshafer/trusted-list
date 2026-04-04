import React from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import {
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";

export type ColumnDef = { key: string; label: string; className?: string };

export const SortableTableHeader = ({
  columns,
  sortKey,
  sortDir,
  onSort,
  actionsClassName = "pr-4 text-right",
}: {
  columns: ColumnDef[];
  sortKey: string | null;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  actionsClassName?: string;
}) => (
  <TableHeader className="[&_th]:uppercase [&_th]:tracking-wider [&_th]:text-xs [&_th_button]:uppercase [&_th_button]:tracking-wider [&_th_button]:text-xs [&_tr]:border-foreground">
    <TableRow>
      {columns.map(({ key, label, className }) => {
        const active = sortKey === key;
        const Icon = active
          ? sortDir === "asc"
            ? ArrowUp
            : ArrowDown
          : ArrowUpDown;
        return (
          <TableHead key={key} className={className ?? ""}>
            <button
              onClick={() => onSort(key)}
              className="group/th flex items-center gap-1 hover:text-foreground transition-colors"
            >
              {label}
              <Icon
                className={`h-3 w-3 shrink-0 transition-opacity $
                  ${
                  active
                    ? "opacity-100 text-foreground"
                    : "opacity-0 group-hover/th:opacity-40"
                }`}
              />
            </button>
          </TableHead>
        );
      })}
      <TableHead className={actionsClassName}>Actions</TableHead>
    </TableRow>
  </TableHeader>
);