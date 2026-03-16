import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

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

export default function AdminAnhaengeDetail() {
  const { contractId, orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-attachment-detail", contractId, orderId],
    enabled: !!contractId && !!orderId,
    queryFn: async () => {
      const [{ data: attachments, error }, { data: contract }, { data: order }] = await Promise.all([
        supabase
          .from("order_attachments" as any)
          .select("*")
          .eq("contract_id", contractId!)
          .eq("order_id", orderId!)
          .neq("status", "entwurf")
          .order("attachment_index", { ascending: true }),
        supabase
          .from("employment_contracts")
          .select("first_name, last_name")
          .eq("id", contractId!)
          .single(),
        supabase
          .from("orders")
          .select("title, required_attachments")
          .eq("id", orderId!)
          .single(),
      ]);
      if (error) throw error;
      const employeeName = `${(contract as any)?.first_name ?? ""} ${(contract as any)?.last_name ?? ""}`.trim() || "Unbekannt";
      return {
        attachments: (attachments ?? []) as any[],
        employeeName,
        orderTitle: (order as any)?.title ?? "–",
        requiredAttachments: (order as any)?.required_attachments ?? [],
      };
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        const { error } = await supabase
          .from("order_attachments" as any)
          .update({ status: "genehmigt", reviewed_at: new Date().toISOString() } as any)
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-attachment-detail"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-attachments-grouped"] });
      toast({ title: "Alle Anhänge genehmigt" });
    },
    onError: (e: Error) => {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
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
      queryClient.invalidateQueries({ queryKey: ["admin-attachment-detail"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-attachments-grouped"] });
      toast({ title: "Status aktualisiert" });
    },
    onError: (e: Error) => {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    },
  });

  const getAttachmentLabel = (index: number) => {
    const reqAtt = data?.requiredAttachments;
    if (Array.isArray(reqAtt) && reqAtt[index]) {
      const item = reqAtt[index];
      return typeof item === "string" ? item : (item as any)?.title ?? (item as any)?.label ?? `Anhang ${index + 1}`;
    }
    return `Anhang ${index + 1}`;
  };

  const isImage = (url: string) => /\.(png|jpe?g|gif|webp)$/i.test(url);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/anhaenge")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Anhänge — {data?.employeeName ?? "..."}
          </h2>
          <p className="text-muted-foreground text-sm">{data?.orderTitle}</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Laden...</p>
      ) : !data?.attachments.length ? (
        <p className="text-muted-foreground">Keine Anhänge vorhanden.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.attachments.map((a: any) => (
            <Card key={a.id} className="overflow-hidden">
              <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                {isImage(a.file_url) ? (
                  <img src={a.file_url} alt={a.file_name} className="w-full h-full object-cover" />
                ) : (
                  <a href={a.file_url} target="_blank" rel="noopener noreferrer"
                    className="text-primary hover:underline flex flex-col items-center gap-2 p-4 text-center">
                    <ExternalLink className="h-8 w-8" />
                    <span className="text-sm">{a.file_name || "Datei öffnen"}</span>
                  </a>
                )}
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{getAttachmentLabel(a.attachment_index)}</span>
                  {statusBadge(a.status)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(a.created_at), "dd.MM.yyyy HH:mm")}
                </p>
                {a.status === "eingereicht" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-green-600 border-green-300 hover:bg-green-50"
                      onClick={() => updateMutation.mutate({ id: a.id, status: "genehmigt" })}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Genehmigen
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/5"
                      onClick={() => updateMutation.mutate({ id: a.id, status: "abgelehnt" })}>
                      <XCircle className="h-4 w-4 mr-1" /> Ablehnen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
