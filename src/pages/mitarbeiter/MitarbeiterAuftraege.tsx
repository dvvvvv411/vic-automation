import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, ExternalLink, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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

const filterOptions = [
  { value: "alle", label: "Alle Status" },
  { value: "offen", label: "Offen" },
  { value: "in_pruefung", label: "In Überprüfung" },
  { value: "erfolgreich", label: "Erfolgreich" },
  { value: "fehlgeschlagen", label: "Fehlgeschlagen" },
];

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = statusConfig[status] ?? statusConfig.offen;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`text-[11px] ${cfg.color}`}>
      <Icon className="h-3 w-3 mr-1" />
      {cfg.label}
    </Badge>
  );
};

const StatusButton = ({ status, orderId, navigate }: { status: string; orderId: string; navigate: (path: string) => void }) => {
  switch (status) {
    case "in_pruefung":
      return (
        <Button className="w-full mt-2" size="sm" disabled variant="outline">
          <Clock className="h-3.5 w-3.5 mr-1.5 text-yellow-500" />
          In Überprüfung
        </Button>
      );
    case "erfolgreich":
      return (
        <Button className="w-full mt-2" size="sm" disabled variant="outline">
          <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-green-500" />
          Erfolgreich
        </Button>
      );
    case "fehlgeschlagen":
      return (
        <Button
          className="w-full mt-2 border-destructive/40 text-destructive hover:bg-destructive/10"
          size="sm"
          variant="outline"
          onClick={() => navigate(`/mitarbeiter/auftragdetails/${orderId}`)}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Erneut bewerten
        </Button>
      );
    default:
      return (
        <Button
          className="w-full mt-2 group/btn"
          size="sm"
          onClick={() => navigate(`/mitarbeiter/auftragdetails/${orderId}`)}
        >
          Auftrag starten
          <ExternalLink className="h-3.5 w-3.5 ml-1.5 opacity-60 group-hover/btn:opacity-100 transition-opacity" />
        </Button>
      );
  }
};

const MitarbeiterAuftraege = () => {
  const navigate = useNavigate();
  const { contract, loading: layoutLoading } = useOutletContext<ContextType>();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("alle");

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

  const filtered = filter === "alle" ? assignments : assignments.filter((a) => a.status === filter);

  if (layoutLoading || loading) {
    return (
      <div className="space-y-8 max-w-7xl">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header with filter */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Aufträge</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {assignments.length} {assignments.length === 1 ? "Auftrag" : "Aufträge"} insgesamt
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-2 border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">Keine Aufträge</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Keine Aufträge in dieser Kategorie gefunden.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((a, i) => (
            <motion.div
              key={a.order_id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: "easeOut" }}
            >
              <Card className="group relative overflow-hidden border border-border/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 to-primary/40" />

                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-[11px] font-medium px-2.5 py-0.5 bg-muted">
                      #{a.order_number}
                    </Badge>
                    <StatusBadge status={a.status} />
                  </div>
                  <CardTitle className="text-base font-semibold leading-snug text-foreground line-clamp-2">
                    {a.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col justify-between gap-4 pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Anbieter</span>
                      <span className="font-medium text-foreground">{a.provider}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Prämie</span>
                      <span className="font-semibold text-primary">{a.reward}</span>
                    </div>
                  </div>

                  <StatusButton status={a.status} orderId={a.order_id} navigate={navigate} />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MitarbeiterAuftraege;
