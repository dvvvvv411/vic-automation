import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Star, ClipboardCheck, Euro, CreditCard, CalendarClock, History } from "lucide-react";
import { addMonths, startOfMonth, format, startOfDay } from "date-fns";
import { de } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface ContextType {
  contract: { id: string; first_name: string | null; application_id: string } | null;
  branding: { logo_url: string | null; company_name: string; brand_color: string | null } | null;
  loading: boolean;
}

interface ContractDetails {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  street: string | null;
  zip_code: string | null;
  city: string | null;
  balance: number;
  iban: string | null;
  bic: string | null;
  bank_name: string | null;
}

const MeineDaten = () => {
  const { contract, loading: contextLoading } = useOutletContext<ContextType>();
  const [contractDetails, setContractDetails] = useState<ContractDetails | null>(null);
  const [stats, setStats] = useState({ ratedOrders: 0, avgRating: 0 });
  const [pendingPayout, setPendingPayout] = useState(0);
  const [rewardHistory, setRewardHistory] = useState<{ title: string; reward: string; date: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contract?.id) return;

    const fetchData = async () => {
      const now = new Date();
      const monthStart = startOfDay(startOfMonth(now));

      const [contractRes, reviewsRes, assignmentsRes] = await Promise.all([
        supabase
          .from("employment_contracts")
          .select("first_name, last_name, email, phone, street, zip_code, city, balance, iban, bic, bank_name")
          .eq("id", contract.id)
          .maybeSingle(),
        supabase
          .from("order_reviews")
          .select("order_id, rating")
          .eq("contract_id", contract.id),
        supabase
          .from("order_assignments")
          .select("order_id, assigned_at, orders(title, reward)")
          .eq("contract_id", contract.id)
          .eq("status", "erfolgreich"),
      ]);

      if (contractRes.data) {
        setContractDetails(contractRes.data);
      }

      if (reviewsRes.data && reviewsRes.data.length > 0) {
        const uniqueOrders = new Set(reviewsRes.data.map((r) => r.order_id));
        const avg = reviewsRes.data.reduce((sum, r) => sum + r.rating, 0) / reviewsRes.data.length;
        setStats({ ratedOrders: uniqueOrders.size, avgRating: Math.round(avg * 10) / 10 });
      }

      // Calculate current month payout from successful assignments
      if (assignmentsRes.data) {
        // Get reviews created this month to filter
        const reviewsThisMonth = await supabase
          .from("order_reviews")
          .select("order_id, created_at")
          .eq("contract_id", contract.id)
          .gte("created_at", monthStart.toISOString());

        const thisMonthOrderIds = new Set(
          (reviewsThisMonth.data || []).map((r) => r.order_id)
        );

        let total = 0;
        for (const a of assignmentsRes.data) {
          if (thisMonthOrderIds.has(a.order_id)) {
            const reward = (a as any).orders?.reward as string | undefined;
            if (reward) {
              const parsed = parseFloat(reward.replace(/[^0-9.,]/g, "").replace(",", "."));
              if (!isNaN(parsed)) total += parsed;
            }
          }
        }
        setPendingPayout(total);

        // Build reward history from all successful assignments
        const history = assignmentsRes.data
          .map((a) => {
            const order = (a as any).orders;
            return {
              title: order?.title || "—",
              reward: order?.reward || "0",
              date: a.assigned_at,
            };
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRewardHistory(history);
      }

      setLoading(false);
    };

    fetchData();
  }, [contract?.id]);

  if (contextLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-48 w-full max-w-md" />
      </div>
    );
  }

  if (!contractDetails) {
    return <p className="text-muted-foreground">Keine Daten gefunden.</p>;
  }

  const fullName = [contractDetails.first_name, contractDetails.last_name].filter(Boolean).join(" ") || "—";

  const formatIban = (iban: string | null) => {
    if (!iban) return "—";
    return iban.replace(/(.{4})/g, "$1 ").trim();
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Meine Daten</h2>
        <p className="text-muted-foreground text-sm mt-1">Deine persönlichen Informationen im Überblick</p>
      </motion.div>

      {/* Personal Info */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card className="bg-white border border-border/40 shadow-md rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Persönliche Informationen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={User} label="Name" value={fullName} />
              <InfoRow icon={Mail} label="E-Mail" value={contractDetails.email || "—"} />
              <InfoRow icon={Phone} label="Telefon" value={contractDetails.phone || "—"} />
              <InfoRow icon={MapPin} label="Adresse" value={
                [contractDetails.street, [contractDetails.zip_code, contractDetails.city].filter(Boolean).join(" ")].filter(Boolean).join(", ") || "—"
              } />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Statistics */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
        <Card className="bg-white border border-border/40 shadow-md rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              Statistiken
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <StatCard icon={ClipboardCheck} label="Bewertete Aufträge" value={String(stats.ratedOrders)} />
              <StatCard icon={Star} label="Ø Bewertung" value={stats.avgRating > 0 ? String(stats.avgRating) : "—"} showStars rating={stats.avgRating} />
              <StatCard icon={Euro} label="Kontostand" value={`€${Number(contractDetails.balance).toFixed(2)}`} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bank Card + Payouts */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
        <Card className="bg-white border border-border/40 shadow-md rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Bankverbindung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Bank card */}
              <div className="relative rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 p-6 text-white shadow-xl aspect-[1.6/1] flex flex-col justify-between overflow-hidden">
                <div className="absolute top-4 right-4 flex">
                  <div className="w-8 h-8 rounded-full bg-white/20" />
                  <div className="w-8 h-8 rounded-full bg-white/10 -ml-3" />
                </div>
                <div className="space-y-1 mt-2">
                  <p className="text-[10px] uppercase tracking-widest text-white/50">IBAN</p>
                  <p className="text-sm font-mono tracking-wider">{formatIban(contractDetails.iban)}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-white/50">BIC: {contractDetails.bic || "—"}</p>
                  <p className="text-xs text-white/50">{contractDetails.bank_name || "—"}</p>
                  <p className="text-sm font-semibold tracking-wide mt-1">{fullName}</p>
                </div>
              </div>

              {/* Right: Payouts */}
              <div className="flex flex-col justify-center">
                <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  Gehaltsauszahlungen
                </h4>
                <div className="rounded-xl bg-muted/50 p-5 space-y-3">
                  <p className="text-xs text-muted-foreground">Anstehende Gehaltsauszahlung am</p>
                  <p className="text-lg font-bold text-foreground">
                    {format(startOfMonth(addMonths(new Date(), 1)), "dd.MM.yyyy", { locale: de })}
                  </p>
                  <div className="border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground">Voraussichtlicher Betrag</p>
                    <p className="text-2xl font-bold text-primary">€{pendingPayout.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reward History */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
        <Card className="bg-white border border-border/40 shadow-md rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Verdienst-Historie
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rewardHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine abgeschlossenen Aufträge.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Auftrag</TableHead>
                    <TableHead>Prämie</TableHead>
                    <TableHead>Datum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewardHistory.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>{item.reward.replace(/[^0-9.,]/g, "").replace(",", ".")} €</TableCell>
                      <TableCell>{format(new Date(item.date), "dd.MM.yyyy", { locale: de })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, showStars, rating }: { icon: React.ElementType; label: string; value: string; showStars?: boolean; rating?: number }) {
  return (
    <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-white border border-border/40 shadow-md">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary shadow-md shadow-primary/20 mb-2">
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-3xl font-extrabold text-foreground">{value}</p>
      {showStars && rating && rating > 0 && (
        <div className="flex gap-0.5 mt-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

export default MeineDaten;
