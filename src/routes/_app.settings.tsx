import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { openMenu } from "./_app";
import { applyTheme, useSettings, saveSettings } from "@/lib/store";
import { settingsAPI } from "@/lib/settings";

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
        onOpenMenu={openMenu}
        actions={
          <button onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-xl gradient-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow-glow disabled:opacity-70">
            <Save className="size-4" /> Save changes
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Company information">
          <Grid>
            <L label="Company name" full><I value={s.companyName} onChange={(e) => setS({ ...s, companyName: e.target.value })} /></L>
            <L label="Owner / Proprietor"><I value={s.ownerName} onChange={(e) => setS({ ...s, ownerName: e.target.value })} /></L>
            <L label="Phone"><I value={s.phone} onChange={(e) => setS({ ...s, phone: e.target.value })} /></L>
            <L label="Email"><I value={s.email} onChange={(e) => setS({ ...s, email: e.target.value })} /></L>
            <L label="GST"><I value={s.gst} onChange={(e) => setS({ ...s, gst: e.target.value })} /></L>
            <L label="TIN"><I value={s.tin} onChange={(e) => setS({ ...s, tin: e.target.value })} /></L>
            <L label="Address" full><I value={s.address} onChange={(e) => setS({ ...s, address: e.target.value })} /></L>
          </Grid>
        </Card>

        <Card title="Billing">
          <Grid>
            <L label="Bill prefix"><I value={s.billPrefix} onChange={(e) => setS({ ...s, billPrefix: e.target.value })} /></L>
            <L label="Next bill number"><I type="number" value={s.nextBillNumber} onChange={(e) => setS({ ...s, nextBillNumber: parseInt(e.target.value || "1")})} /></L>
            <L label="Default GST %"><I type="number" step="0.5" value={s.defaultGst} onChange={(e) => setS({ ...s, defaultGst: parseFloat(e.target.value || "0")})} /></L>
            <L label="Currency"><I value={s.currency} onChange={(e) => setS({ ...s, currency: e.target.value })} /></L>
          </Grid>
        </Card>

        <Card title="Appearance">
          <div className="flex items-center gap-3">
            <span className="text-sm">Theme</span>
            <div className="flex rounded-xl bg-muted p-1">
              {(["light", "dark"] as const).map((t) => (
                <button key={t} onClick={() => setS({ ...s, theme: t })} className={"px-4 py-1.5 text-xs font-semibold rounded-lg capitalize " + (s.theme === t ? "bg-card shadow-sm" : "text-muted-foreground")}>{t}</button>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Backup &amp; restore">
          <p className="text-sm text-muted-foreground mb-3">Export all bills, products and customers as a JSON backup. You can restore it on this or another device.</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={backup} className="inline-flex items-center gap-2 rounded-xl border border-input bg-card px-4 py-2 text-sm font-semibold hover:bg-accent">
              <Download className="size-4" /> Download backup
            </button>
            <label className="inline-flex items-center gap-2 rounded-xl border border-input bg-card px-4 py-2 text-sm font-semibold hover:bg-accent cursor-pointer">
              <Upload className="size-4" /> Restore from file
              <input type="file" accept="application/json" className="hidden" onChange={restore} />
            </label>
          </div>
        </Card>
      </div>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card border border-border/60 p-5">
      <h2 className="font-display font-bold text-lg mb-4">{title}</h2>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) { return <div className="grid grid-cols-2 gap-3">{children}</div>; }
function L({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={"block " + (full ? "col-span-2" : "")}>
      <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}
function I(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full rounded-xl border border-input bg-card/60 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />;
}
