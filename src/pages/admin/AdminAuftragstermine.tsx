import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CalendarClock, ChevronLeft, ChevronRight, History, ArrowRight, Unlock, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format, addDays } from "date-fns";
import { toast } from "sonner";

const PAGE_SIZE = 20;
type ViewMode = "default" | "past" | "future";

export default function AdminAuftragstermine() {
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("default");
  const queryClient = useQueryClient();

  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const tomorrow = format(addDays(now, 1), "yyyy-MM-dd");

  const { data, isLoading } = useQuery({
    queryKey: ["order-appointments-admin", page, viewMode],
    queryFn: async () => {
      let query = supabase
        .from("order_appointments")
        .select("id, appointment_date, appointment_time, created_at, order_id, contract_id", { count: "exact" });

      if (viewMode === "past") {
        query = query
          .lt("appointment_date", today)
          .order("appointment_date", { ascending: false })
          .order("appointment_time", { ascending: false });
      } else if (viewMode === "future") {
        query = query
          .gt("appointment_date", tomorrow)
          .order("appointment_date", { ascending: true })
          .order("appointment_time", { ascending: true });
      } else {
        query = query
          .gte("appointment_date", today)
          .lte("appointment_date", tomorrow)
          .order("appointment_date", { ascending: true })
          .order("appointment_time", { ascending: true });
      }

      const { data: appointments, error, count } = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (error) throw error;
      if (!appointments?.length) return { items: [], total: count || 0 };

      const orderIds = [...new Set(appointments.map((a: any) => a.order_id))];
      const contractIds = [...new Set(appointments.map((a: any) => a.contract_id))];

      // Build unique order_id+contract_id pairs for assignments lookup
      const pairs = appointments.map((a: any) => ({ order_id: a.order_id, contract_id: a.contract_id }));

      const [{ data: orders }, { data: contracts }, { data: assignments }] = await Promise.all([
        supabase.from("orders").select("id, title, order_number").in("id", orderIds),
        supabase.from("employment_contracts").select("id, first_name, last_name").in("id", contractIds),
        supabase.from("order_assignments").select("order_id, contract_id, status, review_unlocked").in("order_id", orderIds).in("contract_id", contractIds),
      ]);

      const orderMap = Object.fromEntries((orders ?? []).map((o) => [o.id, o]));
      const contractMap = Object.fromEntries((contracts ?? []).map((c) => [c.id, c]));
      const assignmentMap = Object.fromEntries(
        (assignments ?? []).map((a: any) => [`${a.order_id}_${a.contract_id}`, a])
      );

      const items = appointments.map((a: any) => ({
        ...a,
        order: orderMap[a.order_id] || null,
        contract: contractMap[a.contract_id] || null,
        assignment: assignmentMap[`${a.order_id}_${a.contract_id}`] || null,
      }));

      return { items, total: count || 0 };
    },
  });

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  const toggleView = (mode: ViewMode) => {
    setViewMode((prev) => (prev === mode ? "default" : mode));
    setPage(0);
  };

  const handleUnlockReview = async (orderId: string, contractId: string) => {
    const { error } = await supabase
      .from("order_assignments")
      .update({ review_unlocked: true } as any)
      .eq("order_id", orderId)
      .eq("contract_id", contractId);

    if (error) {
      toast.error("Freigabe fehlgeschlagen.");
      return;
    }
    toast.success("Bewertung freigegeben.");
    queryClient.invalidateQueries({ queryKey: ["order-appointments-admin"] });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Auftragstermine</h2>
        <p className="text-muted-foreground mt-1">
          {viewMode === "default" && "Termine von heute und morgen."}
          {viewMode === "past" && "Vergangene Termine."}
          {viewMode === "future" && "Zukünftige Termine."}
        </p>
      </motion.div>

      <div className="flex gap-2 mb-4">
        <Button
          variant={viewMode === "past" ? "default" : "outline"}
          size="sm"
          onClick={() => toggleView("past")}
        >
          <History className="h-4 w-4 mr-1" />
          Vergangene Termine
        </Button>
        <Button
          variant={viewMode === "future" ? "default" : "outline"}
          size="sm"
          onClick={() => toggleView("future")}
        >
          <ArrowRight className="h-4 w-4 mr-1" />
          Zukünftige Termine
        </Button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laden...</div>
        ) : !data?.items.length ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <CalendarClock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Keine Termine in dieser Ansicht.</p>
          </div>
        ) : (
          <>
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Uhrzeit</TableHead>
                    <TableHead>Mitarbeiter</TableHead>
                    <TableHead>Auftrag</TableHead>
                    <TableHead>Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {new Date(item.appointment_date).toLocaleDateString("de-DE", {
                          weekday: "short",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.appointment_time?.slice(0, 5)} Uhr</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.contract
                          ? `${item.contract.first_name || ""} ${item.contract.last_name || ""}`.trim() || "–"
                          : "–"}
                      </TableCell>
                      <TableCell>
                        {item.order ? (
                          <span>
                            <span className="text-muted-foreground">#{item.order.order_number}</span>{" "}
                            <span className="font-medium">{item.order.title}</span>
                          </span>
                        ) : "–"}
                      </TableCell>
                      <TableCell>
                        {item.assignment?.review_unlocked ? (
                          <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Freigegeben
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnlockReview(item.order_id, item.contract_id)}
                          >
                            <Unlock className="h-3.5 w-3.5 mr-1" />
                            Bewertung freigeben
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Seite {page + 1} von {totalPages} ({data.total} Termine)
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Zurück
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                    Weiter <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </>
  );
}
