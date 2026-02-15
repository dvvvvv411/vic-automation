import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, ExternalLink, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface ContextType {
  contract: { id: string; first_name: string | null; application_id: string } | null;
  loading: boolean;
}

interface Assignment {
  order_id: string;
  status: string;
  assigned_at: string;
  order_number: string;
  title: string;
  provider: string;
  reward: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  offen: { label: "Offen", color: "text-blue-600 border-blue-300 bg-blue-50", icon: ExternalLink },
  in_pruefung: { label: "In Überprüfung", color: "text-yellow-600 border-yellow-300 bg-yellow-50", icon: Clock },
  erfolgreich: { label: "Erfolgreich", color: "text-green-600 border-green-300 bg-green-50", icon: CheckCircle },
  fehlgeschlagen: { label: "Fehlgeschlagen", color: "text-destructive border-destructive/30 bg-destructive/5", icon: XCircle },
};

const tabs = [
  { value: "alle", label: "Alle" },
  { value: "offen", label: "Offen" },
  { value: "in_pruefung", label: "In Überprüfung" },
  { value: "erfolgreich", label: "Erfolgreich" },
  { value: "fehlgeschlagen", label: "Fehlgeschlagen" },
];

const MitarbeiterAuftraege = () => {
  const navigate = useNavigate();
  const { contract, loading: layoutLoading } = useOutletContext<ContextType>();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("alle");

  useEffect(() => {
    if (!contract) { setLoading(false); return; }

    const fetch = async () => {
      const { data: rawAssignments } = await supabase
        .from("order_assignments")
        .select("order_id, status, assigned_at")
        .eq("contract_id", contract.id)
        .order("assigned_at", { ascending: false });

      if (!rawAssignments?.length) { setLoading(false); return; }

      const orderIds = rawAssignments.map((a) => a.order_id);
      const { data: orders } = await supabase
        .from("orders")
        .select("id, order_number, title, provider, reward")
        .in("id", orderIds);

      const orderMap = Object.fromEntries((orders ?? []).map((o) => [o.id, o]));

      setAssignments(
        rawAssignments
          .filter((a) => orderMap[a.order_id])
          .map((a) => ({
            order_id: a.order_id,
            status: a.status ?? "offen",
            assigned_at: a.assigned_at,
            order_number: orderMap[a.order_id].order_number,
            title: orderMap[a.order_id].title,
            provider: orderMap[a.order_id].provider,
            reward: orderMap[a.order_id].reward,
          }))
      );
      setLoading(false);
    };
    fetch();
  }, [contract]);

  const filtered = tab === "alle" ? assignments : assignments.filter((a) => a.status === tab);

  if (layoutLoading || loading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Aufträge</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {assignments.length} {assignments.length === 1 ? "Auftrag" : "Aufträge"} insgesamt
        </p>
      </motion.div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          {tabs.map((t) => {
            const count = t.value === "alle" ? assignments.length : assignments.filter((a) => a.status === t.value).length;
            return (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                {t.label}
                <span className="text-[10px] bg-muted-foreground/10 rounded-full px-1.5 py-0.5 font-medium">
                  {count}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={tab}>
          {filtered.length === 0 ? (
            <Card className="border-dashed border-2 border-border/60">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                  <Package className="h-7 w-7 text-muted-foreground/60" />
                </div>
                <p className="text-sm text-muted-foreground">Keine Aufträge in dieser Kategorie.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-border/60 shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Nr.</TableHead>
                    <TableHead>Titel</TableHead>
                    <TableHead className="hidden sm:table-cell">Anbieter</TableHead>
                    <TableHead className="text-right">Prämie</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right w-[140px]">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => {
                    const cfg = statusConfig[a.status] ?? statusConfig.offen;
                    const Icon = cfg.icon;
                    return (
                      <TableRow key={a.order_id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">#{a.order_number}</TableCell>
                        <TableCell className="font-medium">{a.title}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{a.provider}</TableCell>
                        <TableCell className="text-right font-semibold text-primary">{a.reward}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`text-[11px] ${cfg.color}`}>
                            <Icon className="h-3 w-3 mr-1" />
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {a.status === "offen" && (
                            <Button size="sm" onClick={() => navigate(`/mitarbeiter/auftragdetails/${a.order_id}`)}>
                              Starten
                            </Button>
                          )}
                          {a.status === "fehlgeschlagen" && (
                            <Button size="sm" variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10"
                              onClick={() => navigate(`/mitarbeiter/auftragdetails/${a.order_id}`)}>
                              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Erneut
                            </Button>
                          )}
                          {a.status === "in_pruefung" && (
                            <span className="text-xs text-muted-foreground">Wartend…</span>
                          )}
                          {a.status === "erfolgreich" && (
                            <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 text-[11px]">
                              <CheckCircle className="h-3 w-3 mr-1" /> Fertig
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MitarbeiterAuftraege;
