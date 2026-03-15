import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useBrandingFilter } from "@/hooks/useBrandingFilter";

const statusBadge = (status: string) => {
  switch (status) {
    case "genehmigt":
      return <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">Genehmigt</Badge>;
    case "abgelehnt":
      return <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">Abgelehnt</Badge>;
    default:
      return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">Eingereicht</Badge>;
  }
};

export default function AdminAnhaenge() {
  const queryClient = useQueryClient();
  const { activeBrandingId, ready } = useBrandingFilter();

  const { data: attachments, isLoading } = useQuery({
    queryKey: ["admin-order-attachments", activeBrandingId],
    enabled: ready,
    queryFn: async () => {
      // Get contract IDs for branding
      const { data: contracts } = await supabase
        .from("employment_contracts")
        .select("id, first_name, last_name")
        .eq("branding_id", activeBrandingId!);
      const contractIds = (contracts ?? []).map((c) => c.id);
      if (!contractIds.length) return [];

      const { data, error } = await supabase
        .from("order_attachments" as any)
        .select("*, orders(title)")
        .in("contract_id", contractIds)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Enrich with employee names
      const contractMap = Object.fromEntries((contracts ?? []).map((c) => [c.id, `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim()]));

      return (data ?? []).map((a: any) => ({
        ...a,
        employee_name: contractMap[a.contract_id] || "Unbekannt",
        order_title: a.orders?.title ?? "–",
      }));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("order_attachments" as any)
        .update({ status, reviewed_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-order-attachments"] });
      toast({ title: "Status aktualisiert" });
    },
    onError: (e: Error) => {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    },
  });

  // Get required attachment title from order
  const getAttachmentTitle = (attachment: any) => {
    // We'll show the file_name or fallback
    return attachment.file_name || `Anhang ${attachment.attachment_index + 1}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Anhänge</h2>
        <p className="text-muted-foreground mt-1">Eingereichte Dokumente prüfen und genehmigen.</p>
      </div>

      <div className="premium-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mitarbeiter</TableHead>
              <TableHead>Auftrag</TableHead>
              <TableHead>Datei</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Eingereicht am</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Laden...</TableCell>
              </TableRow>
            ) : !attachments?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Keine Anhänge vorhanden</TableCell>
              </TableRow>
            ) : (
              attachments.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.employee_name}</TableCell>
                  <TableCell>{a.order_title}</TableCell>
                  <TableCell>
                    <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm">
                      {getAttachmentTitle(a)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>
                  <TableCell>{statusBadge(a.status)}</TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(a.created_at), "dd.MM.yyyy HH:mm")}</TableCell>
                  <TableCell className="text-right space-x-1">
                    {a.status === "eingereicht" && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => updateMutation.mutate({ id: a.id, status: "genehmigt" })}>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Genehmigen</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => updateMutation.mutate({ id: a.id, status: "abgelehnt" })}>
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ablehnen</TooltipContent>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
