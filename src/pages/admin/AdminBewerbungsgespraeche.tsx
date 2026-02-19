import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/lib/sendEmail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buildBrandingUrl } from "@/lib/buildBrandingUrl";
import { Calendar, ChevronLeft, ChevronRight, History, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format, addDays, subHours } from "date-fns";
import { toast } from "sonner";

const PAGE_SIZE = 20;

type ViewMode = "default" | "past" | "future";

export default function AdminBewerbungsgespraeche() {
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("default");
  const queryClient = useQueryClient();

  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const tomorrow = format(addDays(now, 1), "yyyy-MM-dd");
  const cutoffTime = format(subHours(now, 1), "HH:mm:ss");

  const { data, isLoading } = useQuery({
    queryKey: ["interview-appointments", page, viewMode],
    queryFn: async () => {
      let query = supabase
        .from("interview_appointments")
        .select("*, applications(first_name, last_name, email, phone, employment_type, brandings(id, company_name))", { count: "exact" });

      if (viewMode === "past") {
        // All before today, plus today's that are past cutoff
        query = query
          .lte("appointment_date", today)
          .order("appointment_date", { ascending: false })
          .order("appointment_time", { ascending: false });
      } else if (viewMode === "future") {
        // All after tomorrow
        query = query
          .gt("appointment_date", tomorrow)
          .order("appointment_date", { ascending: true })
          .order("appointment_time", { ascending: true });
      } else {
        // Default: today and tomorrow
        query = query
          .gte("appointment_date", today)
          .lte("appointment_date", tomorrow)
          .order("appointment_date", { ascending: true })
          .order("appointment_time", { ascending: true });
      }

      const { data, error, count } = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (error) throw error;

      let items = data || [];

      // Client-side filtering for time-based cutoff
      if (viewMode === "default") {
        items = items.filter((item: any) => {
          if (item.appointment_date === today) {
            return item.appointment_time >= cutoffTime;
          }
          return true;
        });
      } else if (viewMode === "past") {
        // Keep only truly past items (before today OR today + past cutoff)
        items = items.filter((item: any) => {
          if (item.appointment_date === today) {
            return item.appointment_time < cutoffTime;
          }
          return item.appointment_date < today;
        });
      }

      return { items, total: count || 0 };
    },
  });

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  const handleStatusUpdate = async (item: any, newStatus: string) => {
    const { error } = await supabase.rpc("update_interview_status", {
      _appointment_id: item.id,
      _status: newStatus,
    });
    if (error) {
      toast.error("Status konnte nicht aktualisiert werden.");
      return;
    }
    toast.success(`Status auf "${newStatus}" gesetzt.`);
    queryClient.invalidateQueries({ queryKey: ["interview-appointments"] });

    // Send email on success
    if (newStatus === "erfolgreich" && item.applications?.email) {
      const app = item.applications;
      // Get the contract for this application to build link
      const { data: contract } = await supabase
        .from("employment_contracts")
        .select("id")
        .eq("application_id", item.application_id)
        .maybeSingle();
      const contractLink = contract ? await buildBrandingUrl(app.brandings?.id, `/arbeitsvertrag/${item.application_id}`) : null;

      await sendEmail({
        to: app.email,
        recipient_name: `${app.first_name} ${app.last_name}`,
        subject: "Ihr Bewerbungsgespräch war erfolgreich",
        body_title: "Bewerbungsgespräch erfolgreich",
        body_lines: [
          `Sehr geehrte/r ${app.first_name} ${app.last_name},`,
          "Ihr Bewerbungsgespräch war erfolgreich. Wir freuen uns, Sie im nächsten Schritt willkommen zu heißen.",
          "Bitte füllen Sie nun Ihren Arbeitsvertrag über den folgenden Link aus.",
        ],
        button_text: contractLink ? "Arbeitsvertrag ausfüllen" : undefined,
        button_url: contractLink || undefined,
        branding_id: app.brandings?.id || null,
        event_type: "gespraech_erfolgreich",
        metadata: { appointment_id: item.id, application_id: item.application_id },
      });
    }
  };

  const toggleView = (mode: ViewMode) => {
    setViewMode((prev) => (prev === mode ? "default" : mode));
    setPage(0);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "erfolgreich":
        return <Badge className="bg-green-600 text-white border-green-600">Erfolgreich</Badge>;
      case "fehlgeschlagen":
        return <Badge variant="destructive">Fehlgeschlagen</Badge>;
      default:
        return <Badge variant="outline">Neu</Badge>;
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Bewerbungsgespräche</h2>
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
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
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
                    <TableHead>Name</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Branding</TableHead>
                    <TableHead>Anstellungsart</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aktionen</TableHead>
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
                        {item.applications?.first_name} {item.applications?.last_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.applications?.phone || "–"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.applications?.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.applications?.brandings?.company_name || "–"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.applications?.employment_type || "–"}
                      </TableCell>
                      <TableCell>{statusBadge(item.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {item.status !== "erfolgreich" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleStatusUpdate(item, "erfolgreich")}
                              title="Als erfolgreich markieren"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50"
                            onClick={() => handleStatusUpdate(item, "fehlgeschlagen")}
                            title="Als fehlgeschlagen markieren"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
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
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Zurück
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Weiter
                    <ChevronRight className="h-4 w-4 ml-1" />
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
