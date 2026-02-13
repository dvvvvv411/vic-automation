import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Users, ChevronLeft, ChevronRight, Copy, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import AssignmentDialog from "@/components/admin/AssignmentDialog";

const PAGE_SIZE = 20;

export default function AdminMitarbeiter() {
  const [page, setPage] = useState(0);
  const [assignContract, setAssignContract] = useState<{ id: string; label: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["mitarbeiter", page],
    queryFn: async () => {
      const { data: contracts, error, count } = await supabase
        .from("employment_contracts")
        .select("id, first_name, last_name, email, phone, temp_password, user_id, application_id, applications(brandings(company_name))", { count: "exact" })
        .eq("status", "genehmigt")
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (error) throw error;
      return { items: contracts || [], total: count || 0 };
    },
  });

  // Load assignment counts per contract
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

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Mitarbeiter</h2>
        <p className="text-muted-foreground mt-1">Alle genehmigten Mitarbeiter mit Zugangsdaten.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laden...</div>
        ) : !data?.items.length ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Noch keine Mitarbeiter vorhanden.</p>
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
                    <TableHead>Aufträge</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item: any) => {
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
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            Nicht unterzeichnet
                          </Badge>
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
                <p className="text-sm text-muted-foreground">Seite {page + 1} von {totalPages} ({data.total} Einträge)</p>
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

      {/* Assignment Dialog */}
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
