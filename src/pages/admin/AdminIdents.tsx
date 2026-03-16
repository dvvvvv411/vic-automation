import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandingFilter } from "@/hooks/useBrandingFilter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Video, Clock, User, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface IdentSession {
  id: string;
  order_id: string;
  contract_id: string;
  assignment_id: string;
  status: string;
  phone_api_url: string | null;
  test_data: Array<{ label: string; value: string }>;
  created_at: string;
  updated_at: string;
  branding_id: string | null;
}

export default function AdminIdents() {
  const { activeBrandingId } = useBrandingFilter();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["ident-sessions", activeBrandingId],
    enabled: !!activeBrandingId,
    refetchInterval: 10000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ident_sessions" as any)
        .select("*")
        .eq("branding_id", activeBrandingId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as IdentSession[];
    },
  });

  useEffect(() => {
    if (!activeBrandingId) return;
    const channel = supabase
      .channel("admin-ident-sessions")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "ident_sessions", filter: `branding_id=eq.${activeBrandingId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["ident-sessions", activeBrandingId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeBrandingId, queryClient]);

  const contractIds = [...new Set(sessions.map(s => s.contract_id))];
  const { data: contracts = [] } = useQuery({
    queryKey: ["ident-contracts", contractIds],
    enabled: contractIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("employment_contracts")
        .select("id, first_name, last_name")
        .in("id", contractIds);
      return data ?? [];
    },
  });

  const orderIds = [...new Set(sessions.map(s => s.order_id))];
  const { data: orders = [] } = useQuery({
    queryKey: ["ident-orders", orderIds],
    enabled: orderIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("id, title").in("id", orderIds);
      return data ?? [];
    },
  });

  const getContractName = (contractId: string) => {
    const c = contracts.find(c => c.id === contractId);
    return c ? `${c.first_name || ""} ${c.last_name || ""}`.trim() || "Unbekannt" : "...";
  };

  const getOrderTitle = (orderId: string) => {
    const o = orders.find(o => o.id === orderId);
    return o?.title ?? "...";
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "waiting": return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Wartet</Badge>;
      case "data_sent": return <Badge className="gap-1 bg-blue-500"><MessageSquare className="h-3 w-3" /> Daten gesendet</Badge>;
      case "completed": return <Badge className="gap-1 bg-green-500">Abgeschlossen</Badge>;
      case "cancelled": return <Badge variant="destructive" className="gap-1">Abgebrochen</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const activeSessions = sessions.filter(s => s.status === "waiting" || s.status === "data_sent");
  const completedSessions = sessions.filter(s => s.status === "completed" || s.status === "cancelled");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Idents</h2>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Idents</h2>
          <p className="text-sm text-muted-foreground">Video-Chat Verifizierungen verwalten</p>
        </div>
        {activeSessions.length > 0 && (
          <Badge variant="secondary" className="text-sm gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            {activeSessions.length} aktiv
          </Badge>
        )}
      </div>

      {sessions.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 text-center">
            <Video className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Keine Ident-Sessions vorhanden.</p>
            <p className="text-xs text-muted-foreground mt-1">Sessions werden automatisch erstellt, wenn Mitarbeiter einen Video-Chat starten.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeSessions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Aktiv</h3>
              <div className="grid gap-3">
                {activeSessions.map(session => (
                  <Card
                    key={session.id}
                    className="border border-border/60 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/admin/idents/${session.id}`)}
                  >
                    <CardContent className="py-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{getContractName(session.contract_id)}</p>
                        <p className="text-xs text-muted-foreground truncate">{getOrderTitle(session.order_id)}</p>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        {statusBadge(session.status)}
                        <p className="text-[10px] text-muted-foreground">{format(new Date(session.created_at), "dd.MM.yyyy HH:mm")}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {completedSessions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Abgeschlossen</h3>
              <div className="grid gap-3">
                {completedSessions.map(session => (
                  <Card
                    key={session.id}
                    className="border border-border/60 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => navigate(`/admin/idents/${session.id}`)}
                  >
                    <CardContent className="py-3 flex items-center gap-4">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{getContractName(session.contract_id)}</p>
                        <p className="text-xs text-muted-foreground truncate">{getOrderTitle(session.order_id)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {statusBadge(session.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
