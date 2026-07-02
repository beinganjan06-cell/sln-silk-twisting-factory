import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Tags, Ruler } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
      <PageHeader title="Masters" subtitle="Categories & units for product master" />
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
    <Card className="card-hover">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2.5 gradient-primary text-white">
            <Icon className="size-4" />
          </div>
          <CardTitle>{title}</CardTitle>
          <span className="ml-auto text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            {values.length} items
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <form
          className="flex gap-2 mb-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!val.trim()) return;
            onAdd(val.trim());
            setVal("");
            toast.success("Added");
          }}
        >
          <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder} className="flex-1" />
          <Button type="submit"><Plus className="size-4" /> Add</Button>
        </form>
        <div className="flex flex-wrap gap-2">
          {values.map((v) => (
            <span key={v} className="group inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold border border-border/60">
              {v}
              <button
                onClick={() => { onRemove(v); toast.success("Removed"); }}
                className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity"
                aria-label={`Remove ${v}`}
              >
                <Trash2 className="size-3" />
              </button>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
