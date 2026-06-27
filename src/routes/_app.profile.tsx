import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone, Receipt, Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { openMenu } from "./_app";
import { SlnLogo } from "@/components/sln-logo";
import { useSettings } from "@/lib/store";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — SLN Billing" },
      { name: "description", content: "Company profile, contact details and bank information." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const [s] = useSettings();
  return (
    <>
      <PageHeader title="Profile" subtitle="Company profile &amp; identity" onOpenMenu={openMenu} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-card border border-border/60 p-6 lg:col-span-1 text-center">
          <div className="mx-auto"><SlnLogo size={92} /></div>
          <h2 className="mt-4 font-display font-bold text-lg leading-tight">{s.companyName}</h2>
          <p className="text-xs text-muted-foreground mt-1">{s.address}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <Pill icon={Receipt} label="TIN" value={s.tin || "—"} />
            <Pill icon={Receipt} label="GST" value={s.gst || "—"} />
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border/60 p-6 lg:col-span-2">
          <h3 className="font-display font-bold text-lg mb-4">Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Row icon={Phone} label="Phone" value={s.phone} />
            <Row icon={Mail} label="Email" value={s.email || "—"} />
            <Row icon={MapPin} label="Address" value={s.address} />
            <Row icon={Wallet} label="UPI" value={s.upi || "—"} />
          </div>

          <h3 className="font-display font-bold text-lg mt-6 mb-2">Bank details</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{s.bank || "Add bank details in Settings to display them here."}</p>
        </div>
      </div>
    </>
  );
}

function Pill({ icon: Icon, label, value }: { icon: typeof Receipt; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-3 py-2 flex items-center gap-2">
      <Icon className="size-3.5 text-muted-foreground" />
      <div className="text-left">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold truncate">{value}</div>
      </div>
    </div>
  );
}
function Row({ icon: Icon, label, value }: { icon: typeof Receipt; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 p-3">
      <div className="rounded-lg p-2 gradient-primary text-primary-foreground"><Icon className="size-4" /></div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-medium truncate">{value}</div>
      </div>
    </div>
  );
}
