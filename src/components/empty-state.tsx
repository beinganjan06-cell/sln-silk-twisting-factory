import type { LucideIcon } from "lucide-react";
import { FileSearch, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}>
      <div className="relative mb-6">
        <div className="size-20 rounded-2xl gradient-primary opacity-10" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="size-10 text-primary" strokeWidth={1.5} />
        </div>
      </div>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-6">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function SearchEmptyState({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={FileSearch}
      title="No results found"
      description={
        query
          ? `Nothing matches "${query}". Try a different search term.`
          : "Try adjusting your filters or search criteria."
      }
    />
  );
}
