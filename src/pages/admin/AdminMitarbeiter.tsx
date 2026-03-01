import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Users, ChevronLeft, ChevronRight, Copy, ClipboardList, Search } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format, parseISO, isAfter, startOfToday } from "date-fns";
import { de } from "date-fns/locale";
import AssignmentDialog from "@/components/admin/AssignmentDialog";
import UpcomingStartDates from "@/components/admin/UpcomingStartDates";

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
  const [assignContract, setAssignContract] = useState<{ id: string; label: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["mitarbeiter", page],
    queryFn: async () => {
      const { data: contracts, error, count } = await supabase
        .from("employment_contracts")
        .select("id, first_name, last_name, email, phone, temp_password, user_id, application_id, status, desired_start_date, applications(brandings(company_name))", { count: "exact" })
        .in("status", ["genehmigt", "unterzeichnet"])
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (error) throw error;
      return { items: contracts || [], total: count || 0 };
    },
  });

  const { data: assignmentCounts } = useQuery({
    queryKey: ["order_assignments", "counts_by_contract"],
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

  // Sort: unterzeichnet first, then by start date
  const sortedAndFiltered = useMemo(() => {
    const items = data?.items ?? [];
    const today = startOfToday();

    const sorted = [...items].sort((a: any, b: any) => {
      const rankA = a.status === "unterzeichnet" ? 0 : 1;
      const rankB = b.status === "unterzeichnet" ? 0 : 1;
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

    if (!search.trim()) return sorted;
    const term = search.toLowerCase().trim();
    return sorted.filter((item: any) => {
      const name = `${item.first_name ?? ""} ${item.last_name ?? ""}`.toLowerCase();
      const branding = ((item as any).applications?.brandings?.company_name ?? "").toLowerCase();
      return name.includes(term) || (item.email ?? "").toLowerCase().includes(term) || (item.phone ?? "").toLowerCase().includes(term) || branding.includes(term);
    });
  }, [data?.items, search]);

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Mitarbeiter</h2>
        <p className="text-muted-foreground mt-1">Alle genehmigten Mitarbeiter mit Zugangsdaten.</p>
      </motion.div>

      <UpcomingStartDates />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {/* Search */}
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
        ) : !sortedAndFiltered.length ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {search.trim() ? `Keine Ergebnisse für „${search}"` : "Noch keine Mitarbeiter vorhanden."}
            </p>
          </div>
        ) : (
          <>
            <div className="border border-border rounded-lg overflow-hidden">
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAndFiltered.map((item: any) => {
                    const count = assignmentCounts?.[item.id] || 0;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.first_name} {item.last_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.phone || "–"}</TableCell>
                        <TableCell className="text-muted-foreground">{item.email || "–"}</TableCell>
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
                          {(item as any).applications?.brandings?.company_name || "–"}
                        </TableCell>
                        <TableCell>
                          {item.status === "unterzeichnet" ? (
                            <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                              Unterzeichnet
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
                              Nicht unterzeichnet
                            </Badge>
                          )}
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
        />
      )}
    </>
  );
}
