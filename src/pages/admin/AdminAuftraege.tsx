import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useState } from "react";
import AssignmentDialog from "@/components/admin/AssignmentDialog";
import { useBrandingFilter } from "@/hooks/useBrandingFilter";

const typeLabel: Record<string, string> = {
  bankdrop: "Bankdrop",
  exchanger: "Exchanger",
  platzhalter: "Platzhalter",
  andere: "Andere",
};

export default function AdminAuftraege() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { activeBrandingId, ready } = useBrandingFilter();
  const [assignOrder, setAssignOrder] = useState<any>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", activeBrandingId],
    enabled: ready,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("branding_id", activeBrandingId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: assignmentCounts } = useQuery({
    queryKey: ["order_assignments", "counts_by_order", activeBrandingId],
    enabled: ready,
    queryFn: async () => {
      const { data, error } = await supabase.from("order_assignments").select("order_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((a) => { counts[a.order_id] = (counts[a.order_id] || 0) + 1; });
      return counts;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Auftrag gelöscht" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Aufträge</h2>
          <p className="text-muted-foreground mt-1">Alle Aufträge verwalten und Mitarbeiter zuweisen.</p>
        </div>
        <Button onClick={() => navigate("/admin/auftraege/neu")}>
          <Plus className="h-4 w-4 mr-2" /> Auftrag hinzufügen
        </Button>
      </div>

      <div className="premium-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titel</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Prämie</TableHead>
              <TableHead>Starter-Job</TableHead>
              <TableHead>Erstellt am</TableHead>
              <TableHead>Zuweisen</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Laden...</TableCell>
              </TableRow>
            ) : !orders?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Keine Aufträge vorhanden</TableCell>
              </TableRow>
            ) : (
              orders.map((o: any) => {
                const count = assignmentCounts?.[o.id] || 0;
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{typeLabel[o.order_type] || o.order_type}</Badge>
                    </TableCell>
                    <TableCell>{o.reward}</TableCell>
                    <TableCell>
                      {o.is_starter_job ? (
                        <Badge variant="default">Ja</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Nein</span>
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(o.created_at), "dd.MM.yyyy")}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setAssignOrder(o)}>
                        <Users className="h-3.5 w-3.5 mr-1.5" />
                        {count > 0 ? `${count} Mitarbeiter` : "Zuweisen"}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/auftraege/${o.id}/bearbeiten`)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Bearbeiten</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(o.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Löschen</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {assignOrder && (
        <AssignmentDialog
          open={!!assignOrder}
          onOpenChange={(v) => { if (!v) setAssignOrder(null); }}
          mode="order"
          sourceId={assignOrder.id}
          sourceLabel={assignOrder.title}
        />
      )}
    </div>
  );
}
