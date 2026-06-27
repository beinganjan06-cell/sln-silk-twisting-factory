import type { ReactNode } from "react";
import { MenuButton } from "./app-sidebar";

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  onOpenMenu: () => void;
}
export function PageHeader({ title, subtitle, actions, onOpenMenu }: Props) {
  return (
    <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] sm:flex sm:items-end sm:justify-between gap-4 mb-6">
      <MenuButton onClick={onOpenMenu} />
      <div className="min-w-0">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight truncate">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="col-span-3 sm:col-span-1 flex flex-wrap gap-2 justify-end">{actions}</div>}
    </header>
  );
}
