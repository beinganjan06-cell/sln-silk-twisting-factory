import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone, Receipt, Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SlnLogo } from "@/components/sln-logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <PageHeader title="Profile" subtitle="Company profile & identity" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-6 lg:col-span-1 text-center card-hover">
          <div className="relative mx-auto w-fit">
            <SlnLogo size={92} />
            <div className="absolute -inset-2 rounded-3xl gradient-primary opacity-10 blur-xl -z-10" />
          </div>
          <h2 className="mt-5 font-display font-bold text-lg leading-tight">{s.companyName}</h2>
          <p className="text-xs text-muted-foreground mt-1.5">{s.address}</p>
          <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
            <Pill icon={Receipt} label="TIN" value={s.tin || "—"} />
            <Pill icon={Receipt} label="GST" value={s.gst || "—"} />
          </div>
        </Card>

        <Card className="lg:col-span-2 card-hover">
          <CardHeader>
            <CardTitle>Contact information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Row icon={Phone} label="Phone" value={s.phone} />
              <Row icon={Mail} label="Email" value={s.email || "—"} />
              <Row icon={MapPin} label="Address" value={s.address} />
              <Row icon={Wallet} label="UPI" value={s.upi || "—"} />
            </div>

            <h3 className="font-display font-bold text-lg mt-8 mb-3">Bank details</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap rounded-xl bg-muted/50 p-4">
              {s.bank || "Add bank details in Settings to display them here."}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Pill({ icon: Icon, label, value }: { icon: typeof Receipt; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-3 py-2.5 flex items-center gap-2">
      <Icon className="size-3.5 text-primary shrink-0" />
      <div className="text-left min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold truncate">{value}</div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Receipt; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 p-4 hover:border-primary/20 transition-colors">
      <div className="rounded-xl p-2.5 gradient-primary text-white shrink-0">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
        <div className="text-sm font-medium truncate mt-0.5">{value}</div>
      </div>
    </div>
  );
}
