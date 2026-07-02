import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Pagination ──────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  perPage: number;
  onPage: (p: number) => void;
  onPerPage: (n: number) => void;
}

export function Pagination({ page, pages, total, perPage, onPage, onPerPage }: PaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border/60 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <span>Rows per page:</span>
        <select
          value={perPage}
          onChange={(e) => { onPerPage(Number(e.target.value)); onPage(1); }}
          className="rounded-lg border border-input bg-card px-2 py-1 text-xs"
        >
          {[10, 15, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <span>{from}–{to} of {total}</span>
      </div>

      <div className="flex items-center gap-1">
        <NavBtn icon={ChevronsLeft} label="First" disabled={page === 1} onClick={() => onPage(1)} />
        <NavBtn icon={ChevronLeft} label="Prev" disabled={page === 1} onClick={() => onPage(page - 1)} />
        <span className="px-3 py-1 text-xs font-medium">{page} / {pages}</span>
        <NavBtn icon={ChevronRight} label="Next" disabled={page === pages} onClick={() => onPage(page + 1)} />
        <NavBtn icon={ChevronsRight} label="Last" disabled={page === pages} onClick={() => onPage(pages)} />
      </div>
    </div>
  );
}

function NavBtn({ icon: Icon, label, disabled, onClick }: { icon: typeof ChevronLeft; label: string; disabled: boolean; onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon-sm" aria-label={label} disabled={disabled} onClick={onClick}>
      <Icon className="size-4" />
    </Button>
  );
}

// ── Sort header cell ─────────────────────────────────────────────────────────

interface SortThProps {
  col: string;
  label: string;
  sortBy: string;
  sortDir: "asc" | "desc";
  onSort: (col: string) => void;
  className?: string;
}

export function SortTh({ col, label, sortBy, sortDir, onSort, className }: SortThProps) {
  const active = sortBy === col;
  const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th
      className={cn("cursor-pointer select-none whitespace-nowrap", className)}
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <Icon className={cn("size-3.5", active ? "text-primary" : "text-muted-foreground/50")} />
      </span>
    </th>
  );
}
