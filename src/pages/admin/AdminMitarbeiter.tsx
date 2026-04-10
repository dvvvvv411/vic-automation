import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, ChevronLeft, ChevronRight, Copy, ClipboardList, Search, Lock, Unlock, Eye, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format, parseISO, isAfter, startOfToday } from "date-fns";
import { de } from "date-fns/locale";
import AssignmentDialog from "@/components/admin/AssignmentDialog";
import UpcomingStartDates from "@/components/admin/UpcomingStartDates";
import { useBrandingFilter } from "@/hooks/useBrandingFilter";

const PAGE_SIZE = 20;

function formatDate(dateStr: string | null) {
  if (!dateStr) return "–";
  try {
    return format(parseISO(dateStr), "dd. MMMM yyyy", { locale: de });
  } catch {
    return "–";
  }
}

export default function AdminMitarbeiter() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [assignContract, setAssignContract] = useState<{ id: string; label: string } | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<{ id: string; name: string; isSuspended: boolean } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { activeBrandingId, ready, brandings } = useBrandingFilter();
  const activeBrandingName = brandings.find(b => b.id === activeBrandingId)?.company_name ?? "–";

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const { data, isLoading } = useQuery({
    queryKey: ["mitarbeiter", page, activeBrandingId, debouncedSearch],
    enabled: ready,
    queryFn: async () => {
      let query = supabase
        .from("employment_contracts")
        .select("id, first_name, last_name, email, phone, temp_password, user_id, application_id, status, desired_start_date, is_suspended, branding_id", { count: "exact" })
        .eq("branding_id", activeBrandingId!)
        .in("status", ["offen", "eingereicht", "genehmigt", "unterzeichnet"])
        .not("first_name", "is", null);

      if (debouncedSearch) {
        query = query.or(
          `first_name.ilike.%${debouncedSearch}%,last_name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%,phone.ilike.%${debouncedSearch}%`
        );
      }

      const { data: contracts, error, count } = await query
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (error) throw error;
      return { items: contracts || [], total: count || 0 };
    },
  });

  const { data: assignmentCounts } = useQuery({
    queryKey: ["order_assignments", "counts_by_contract", activeBrandingId],
    enabled: ready,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_assignments")
        .select("contract_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((a) => {
        counts[a.contract_id] = (counts[a.contract_id] || 0) + 1;
      });
      return counts;
    },
  });

  const handleToggleSuspend = async () => {
    if (!suspendTarget) return;
    const newValue = !suspendTarget.isSuspended;
    const { error } = await supabase
      .from("employment_contracts")
      .update({ is_suspended: newValue })
      .eq("id", suspendTarget.id);

    if (error) {
      toast.error("Fehler beim Aktualisieren.");
    } else {
      toast.success(newValue ? "Benutzerkonto gesperrt." : "Benutzerkonto entsperrt.");
      queryClient.invalidateQueries({ queryKey: ["mitarbeiter"] });
    }
    setSuspendTarget(null);
  };

  const handleDeleteEmployee = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-employee", {
        body: { contractId: deleteTarget.id },
      });
      if (error || data?.error) {
        toast.error(data?.error || "Fehler beim Löschen.");
      } else {
        toast.success("Mitarbeiter und Benutzerkonto gelöscht.");
        queryClient.invalidateQueries({ queryKey: ["mitarbeiter"] });
      }
    } catch {
      toast.error("Fehler beim Löschen.");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const sortedItems = useMemo(() => {
    const items = data?.items ?? [];
    const today = startOfToday();

    return [...items].sort((a: any, b: any) => {
      const statusRank = (s: string) => s === "genehmigt" || s === "unterzeichnet" ? 0 : s === "eingereicht" ? 1 : 2;
      const rankA = statusRank(a.status);
      const rankB = statusRank(b.status);
      if (rankA !== rankB) return rankA - rankB;

      const dateA = a.desired_start_date ? parseISO(a.desired_start_date) : null;
      const dateB = b.desired_start_date ? parseISO(b.desired_start_date) : null;
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      const futureA = isAfter(dateA, today) || dateA.getTime() === today.getTime();
      const futureB = isAfter(dateB, today) || dateB.getTime() === today.getTime();

      if (futureA && futureB) return dateA.getTime() - dateB.getTime();
      if (!futureA && !futureB) return dateB.getTime() - dateA.getTime();
      return futureA ? -1 : 1;
    });
  }, [data?.items]);

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  return (
    <TooltipProvider>
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Mitarbeiter</h2>
        <p className="text-muted-foreground mt-1">Alle genehmigten Mitarbeiter mit Zugangsdaten.</p>
      </motion.div>

      <UpcomingStartDates />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Name, E-Mail, Telefon oder Branding suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laden...</div>
        ) : !sortedItems.length ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {search.trim() ? `Keine Ergebnisse für „${search}"` : "Noch keine Mitarbeiter vorhanden."}
            </p>
          </div>
        ) : (
          <>
            <div className="premium-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Passwort</TableHead>
                    <TableHead>Branding</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Startdatum</TableHead>
                    <TableHead>Aufträge</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((item: any) => {
                    const count = assignmentCounts?.[item.id] || 0;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <span className="cursor-pointer underline hover:text-primary transition-colors" onClick={(e) => { e.stopPropagation(); navigate(`/admin/mitarbeiter/${item.id}`); }}>
                            {item.first_name} {item.last_name}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.phone ? (
                            <span className="cursor-pointer hover:text-foreground transition-colors" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(item.phone); toast.success("Telefonnummer kopiert!"); }}>{item.phone}</span>
                          ) : "–"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.email ? (
                            <span className="cursor-pointer hover:text-foreground transition-colors" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(item.email); toast.success("E-Mail kopiert!"); }}>{item.email}</span>
                          ) : "–"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{item.temp_password || "–"}</code>
                            {item.temp_password && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  navigator.clipboard.writeText(item.temp_password);
                                  toast.success("Passwort kopiert!");
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {activeBrandingName}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {item.status === "genehmigt" ? (
                              <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                                Genehmigt
                              </Badge>
                            ) : item.status === "unterzeichnet" ? (
                              <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                                Unterzeichnet
                              </Badge>
                            ) : item.status === "eingereicht" ? (
                              <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
                                Eingereicht
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
                                Offen
                              </Badge>
                            )}
                            {item.is_suspended && (
                              <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">
                                Gesperrt
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(item.desired_start_date)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAssignContract({
                              id: item.id,
                              label: `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim(),
                            })}
                          >
                            <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                            {count > 0 ? `${count} Aufträge` : "Zuweisen"}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/mitarbeiter/${item.id}`)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Details</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={item.is_suspended ? "outline" : "destructive"}
                                  size="icon"
                                  onClick={() => setSuspendTarget({
                                    id: item.id,
                                    name: `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim(),
                                    isSuspended: !!item.is_suspended,
                                  })}
                                >
                                  {item.is_suspended ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{item.is_suspended ? "Entsperren" : "Sperren"}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive hover:bg-red-50"
                                  onClick={() => setDeleteTarget({
                                    id: item.id,
                                    name: `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim(),
                                  })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Löschen</TooltipContent>
                            </Tooltip>
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
                <p className="text-sm text-muted-foreground">Seite {page + 1} von {totalPages} ({data?.total} Einträge)</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Zurück
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                    Weiter <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {assignContract && (
        <AssignmentDialog
          open={!!assignContract}
          onOpenChange={(v) => { if (!v) setAssignContract(null); }}
          mode="contract"
          sourceId={assignContract.id}
          sourceLabel={assignContract.label}
          brandingId={activeBrandingId ?? undefined}
        />
      )}

      <AlertDialog open={!!suspendTarget} onOpenChange={(v) => { if (!v) setSuspendTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {suspendTarget?.isSuspended
                ? `Benutzerkonto von ${suspendTarget?.name} entsperren?`
                : `Benutzerkonto von ${suspendTarget?.name} sperren?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {suspendTarget?.isSuspended
                ? "Der Mitarbeiter erhält wieder Zugang zum Dashboard und allen Funktionen."
                : "Der Mitarbeiter wird sofort ausgesperrt und sieht nur noch eine Sperrseite. Er kann nicht mehr auf das Dashboard oder den Livechat zugreifen."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleToggleSuspend}
              className={suspendTarget?.isSuspended 
                ? "bg-green-600 hover:bg-green-700 shadow-sm hover:shadow-md transition-all" 
                : "bg-destructive hover:bg-destructive/90 shadow-sm hover:shadow-md transition-all"}
            >
              {suspendTarget?.isSuspended ? "Entsperren" : "Sperren"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mitarbeiter endgültig löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name} wird unwiderruflich gelöscht – inklusive Vertragsdaten, Aufträge und Benutzerkonto. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEmployee}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 shadow-sm hover:shadow-md transition-all"
            >
              {isDeleting ? "Lösche..." : "Endgültig löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
    </TooltipProvider>
  );
}
