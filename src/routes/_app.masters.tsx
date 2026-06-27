import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Tags, Ruler } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { openMenu } from "./_app";
import { useCategories, useUnits } from "@/lib/store";

export const Route = createFileRoute("/_app/masters")({
  head: () => ({
    meta: [
      { title: "Masters — SLN Billing" },
      { name: "description", content: "Manage categories and units used in product master." },
    ],
  }),
  component: Masters,
});

function Masters() {
  const [categories, setCategories] = useCategories();
  const [units, setUnits] = useUnits();
  return (
    <>
      <PageHeader title="Masters" subtitle="Categories &amp; units" onOpenMenu={openMenu} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ListCard
          title="Categories"
          icon={Tags}
          values={categories}
          onAdd={(v) => { if (categories.includes(v)) return toast.error("Already exists"); setCategories([...categories, v]); }}
          onRemove={(v) => setCategories(categories.filter((c) => c !== v))}
          placeholder="e.g. Twisted Silk"
        />
        <ListCard
          title="Units"
          icon={Ruler}
          values={units}
          onAdd={(v) => { if (units.includes(v)) return toast.error("Already exists"); setUnits([...units, v]); }}
          onRemove={(v) => setUnits(units.filter((c) => c !== v))}
          placeholder="e.g. Cone"
        />
      </div>
    </>
  );
}

function ListCard({
  title, icon: Icon, values, onAdd, onRemove, placeholder,
}: { title: string; icon: typeof Tags; values: string[]; onAdd: (v: string) => void; onRemove: (v: string) => void; placeholder: string }) {
  const [val, setVal] = useState("");
  return (
    <div className="rounded-2xl bg-card border border-border/60 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="rounded-xl p-2 gradient-primary text-primary-foreground"><Icon className="size-4" /></div>
        <h2 className="font-display font-bold text-lg">{title}</h2>
        <span className="ml-auto text-xs text-muted-foreground">{values.length} items</span>
      </div>
      <form className="flex gap-2 mb-3" onSubmit={(e) => { e.preventDefault(); if (!val.trim()) return; onAdd(val.trim()); setVal(""); toast.success("Added"); }}>
        <input value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder} className="flex-1 rounded-xl border border-input bg-card/60 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <button className="inline-flex items-center gap-1.5 rounded-xl gradient-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-glow"><Plus className="size-4" /> Add</button>
      </form>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => (
          <span key={v} className="group inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium">
            {v}
            <button onClick={() => { onRemove(v); toast.success("Removed"); }} className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity">
              <Trash2 className="size-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
