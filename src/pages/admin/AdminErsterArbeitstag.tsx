import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { Calendar, ChevronLeft, ChevronRight, History, ArrowRight, CheckCircle, XCircle, Search, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import BrandingNotes from "@/components/admin/BrandingNotes";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { format, addDays, subHours } from "date-fns";
import { toast } from "sonner";
import { useBrandingFilter } from "@/hooks/useBrandingFilter";

const PAGE_SIZE = 20;
type ViewMode = "default" | "past" | "future";

export default function AdminErsterArbeitstag() {
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("default");
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { activeBrandingId, ready } = useBrandingFilter();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [failTarget, setFailTarget] = useState<any>(null);
  const [failReason, setFailReason] = useState("");
  const [failSubmitting, setFailSubmitting] = useState(false);

  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const tomorrow = format(addDays(now, 1), "yyyy-MM-dd");
  const cutoffTime = format(subHours(now, 3), "HH:mm:ss");

  const { data, isLoading } = useQuery({
    queryKey: ["first-workday-appointments-admin", page, viewMode, activeBrandingId],
    enabled: ready,
    queryFn: async () => {
      let query = supabase
        .from("first_workday_appointments" as any)
        .select("*, employment_contracts:contract_id!inner(id, first_name, last_name, email, phone, employment_type, branding_id, brandings:branding_id(id, company_name))", { count: "exact" })
        .eq("employment_contracts.branding_id", activeBrandingId!);

      if (viewMode === "past") {
        query = query
          .or(`appointment_date.lt.${today},and(appointment_date.eq.${today},appointment_time.lt.${cutoffTime})`)
          .order("appointment_date", { ascending: false })
          .order("appointment_time", { ascending: false });
      } else if (viewMode === "future") {
        query = query.gt("appointment_date", tomorrow).order("appointment_date", { ascending: true }).order("appointment_time", { ascending: true });
      } else {
        query = query
          .or(`and(appointment_date.eq.${today},appointment_time.gte.${cutoffTime}),appointment_date.eq.${tomorrow}`)
          .order("appointment_date", { ascending: true })
          .order("appointment_time", { ascending: true });
      }

      const { data, error, count } = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (error) throw error;

      return { items: (data || []) as any[], total: count || 0 };
    },
  });

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  const handleStatusUpdate = async (item: any, newStatus: string) => {
    const { error } = await supabase.rpc("update_first_workday_status" as any, {
      _appointment_id: item.id,
      _status: newStatus,
    });
    if (error) {
      toast.error("Status konnte nicht aktualisiert werden.");
      return;
    }
    toast.success(`Status auf "${newStatus}" gesetzt.`);
    queryClient.invalidateQueries({ queryKey: ["first-workday-appointments-admin"] });
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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">1. Arbeitstag-Termine</h2>
        <p className="text-muted-foreground mt-1">
          {viewMode === "default" && "Termine von heute und morgen."}
          {viewMode === "past" && "Vergangene Termine."}
          {viewMode === "future" && "Zukünftige Termine."}
        </p>
      </motion.div>

      {activeBrandingId && <BrandingNotes brandingId={activeBrandingId} pageContext="erster-arbeitstag" />}

      <div className="flex gap-2 mb-4">
        <Button variant={viewMode === "past" ? "default" : "outline"} size="sm" onClick={() => toggleView("past")}>
          <History className="h-4 w-4 mr-1" /> Vergangene Termine
        </Button>
        <Button variant={viewMode === "future" ? "default" : "outline"} size="sm" onClick={() => toggleView("future")}>
          <ArrowRight className="h-4 w-4 mr-1" /> Zukünftige Termine
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Name suchen..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laden...</div>
        ) : (() => {
          const filteredItems = (data?.items ?? []).filter((item: any) => {
            if (!search.trim()) return true;
            const ec = item.employment_contracts;
            const name = `${ec?.first_name ?? ""} ${ec?.last_name ?? ""}`.toLowerCase();
            return name.includes(search.toLowerCase().trim());
          });
          return !filteredItems.length ? (
            <div className="text-center py-16 border border-dashed border-border rounded-lg">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Keine 1. Arbeitstag-Termine in dieser Ansicht.</p>
            </div>
          ) : (
            <>
              <div className="premium-card overflow-hidden">
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
                    {filteredItems.map((item: any) => {
                      const ec = item.employment_contracts;
                      return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {new Date(item.appointment_date).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}
                        </TableCell>
                        <TableCell><Badge variant="outline">{item.appointment_time?.slice(0, 5)} Uhr</Badge></TableCell>
                        <TableCell className="font-medium">{ec?.first_name} {ec?.last_name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {ec?.phone ? (
                            <span className="cursor-pointer hover:text-foreground transition-colors" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(ec.phone); toast.success("Telefonnummer kopiert!"); }}>{ec.phone}</span>
                          ) : "–"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{ec?.email}</TableCell>
                        <TableCell className="text-muted-foreground">{ec?.brandings?.company_name || "–"}</TableCell>
                        <TableCell className="text-muted-foreground">{ec?.employment_type || "–"}</TableCell>
                        <TableCell>{statusBadge(item.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {item.status !== "erfolgreich" && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleStatusUpdate(item, "erfolgreich")} title="Als erfolgreich markieren">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                              const ec = item.employment_contracts;
                              setFailTarget(item);
                              setFailReason("");
                            }} title="Als fehlgeschlagen markieren">
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50" onClick={() => setDeleteTarget({ id: item.id, name: `${ec?.first_name} ${ec?.last_name}` })} title="Termin löschen">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">Seite {page + 1} von {totalPages} ({data!.total} Termine)</p>
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
          );
        })()}
      </motion.div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Termin löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Der 1. Arbeitstag-Termin von {deleteTarget?.name} wird unwiderruflich gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={async () => {
                const { error } = await supabase.from("first_workday_appointments" as any).delete().eq("id", deleteTarget!.id);
                if (error) { toast.error("Fehler beim Löschen."); }
                else { toast.success("Termin gelöscht."); queryClient.invalidateQueries({ queryKey: ["first-workday-appointments-admin"] }); }
                setDeleteTarget(null);
              }}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
