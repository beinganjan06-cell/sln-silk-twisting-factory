import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { applyTheme, useSettings, saveSettings } from "@/lib/store";
import { settingsAPI } from "@/lib/settings";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SLN Billing" },
      { name: "description", content: "Company information, bill numbering, theme and backup settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [settings, setSettings] = useSettings();
  const [s, setS] = useState(settings);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const result = await settingsAPI.update(s);
      if (result.success) {
        saveSettings(result.settings);
        applyTheme(s.theme);
        toast.success("Settings saved");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setBusy(false);
    }
  }

  function backup() {
    const data: Record<string, unknown> = {};
    for (const k of Object.keys(localStorage)) if (k.startsWith("sln.")) data[k] = JSON.parse(localStorage.getItem(k) || "null");
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sln-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function restore(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const obj = JSON.parse(String(r.result));
        for (const [k, v] of Object.entries(obj)) localStorage.setItem(k, JSON.stringify(v));
        toast.success("Backup restored — reloading");
        setTimeout(() => window.location.reload(), 400);
      } catch { toast.error("Invalid backup file"); }
    };
    r.readAsText(f);
  }

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Company, billing & appearance preferences"
        actions={
          <Button onClick={save} loading={busy}>
            <Save className="size-4" /> Save changes
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SettingsCard title="Company information">
          <Grid>
            <Field label="Company name" full><Input value={s.companyName} onChange={(e) => setS({ ...s, companyName: e.target.value })} /></Field>
            <Field label="Owner / Proprietor"><Input value={s.ownerName} onChange={(e) => setS({ ...s, ownerName: e.target.value })} /></Field>
            <Field label="Phone"><Input value={s.phone} onChange={(e) => setS({ ...s, phone: e.target.value })} /></Field>
            <Field label="Email"><Input value={s.email} onChange={(e) => setS({ ...s, email: e.target.value })} /></Field>
            <Field label="GST"><Input value={s.gst} onChange={(e) => setS({ ...s, gst: e.target.value })} /></Field>
            <Field label="TIN"><Input value={s.tin} onChange={(e) => setS({ ...s, tin: e.target.value })} /></Field>
            <Field label="Address" full><Input value={s.address} onChange={(e) => setS({ ...s, address: e.target.value })} /></Field>
          </Grid>
        </SettingsCard>

        <SettingsCard title="Billing">
          <Grid>
            <Field label="Bill prefix"><Input value={s.billPrefix} onChange={(e) => setS({ ...s, billPrefix: e.target.value })} /></Field>
            <Field label="Next bill number"><Input type="number" value={s.nextBillNumber} onChange={(e) => setS({ ...s, nextBillNumber: parseInt(e.target.value || "1") })} /></Field>
            <Field label="Default GST %"><Input type="number" step="0.5" value={s.defaultGst} onChange={(e) => setS({ ...s, defaultGst: parseFloat(e.target.value || "0") })} /></Field>
            <Field label="Currency"><Input value={s.currency} onChange={(e) => setS({ ...s, currency: e.target.value })} /></Field>
          </Grid>
        </SettingsCard>

        <SettingsCard title="Appearance">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Theme</span>
            <div className="flex rounded-xl bg-muted p-1">
              {(["light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setS({ ...s, theme: t })}
                  className={cn(
                    "px-5 py-2 text-xs font-semibold rounded-lg capitalize transition-all",
                    s.theme === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </SettingsCard>

        <SettingsCard title="Backup & restore">
          <CardDescription className="mb-4">
            Export all bills, products and customers as a JSON backup. Restore on this or another device.
          </CardDescription>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={backup}>
              <Download className="size-4" /> Download backup
            </Button>
            <label className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer inline-flex")}>
              <Upload className="size-4" /> Restore from file
              <input type="file" accept="application/json" className="hidden" onChange={restore} />
            </label>
          </div>
        </SettingsCard>
      </div>
    </>
  );
}

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={cn("block", full && "col-span-2")}>
      <span className="block text-xs font-semibold text-muted-foreground mb-2">{label}</span>
      {children}
    </label>
  );
}
