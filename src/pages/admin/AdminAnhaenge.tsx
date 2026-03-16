import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useBrandingFilter } from "@/hooks/useBrandingFilter";
import { useNavigate } from "react-router-dom";

const groupStatus = (statuses: string[]) => {
  if (statuses.every((s) => s === "genehmigt"))
    return <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">Genehmigt</Badge>;
  if (statuses.some((s) => s === "abgelehnt"))
    return <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">Abgelehnt</Badge>;
  return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">Eingereicht</Badge>;
};

export default function AdminAnhaenge() {
  const navigate = useNavigate();
  const { activeBrandingId, ready } = useBrandingFilter();

  const { data: groups, isLoading } = useQuery({
    queryKey: ["admin-order-attachments-grouped", activeBrandingId],
    enabled: ready,
    queryFn: async () => {
      const { data: contracts } = await supabase
        .from("employment_contracts")
        .select("id, first_name, last_name")
        .eq("branding_id", activeBrandingId!);
      const contractIds = (contracts ?? []).map((c) => c.id);
      if (!contractIds.length) return [];

      const { data, error } = await supabase
        .from("order_attachments" as any)
        .select("*, orders(title, required_attachments)")
        .in("contract_id", contractIds)
        .neq("status", "entwurf")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const contractMap = Object.fromEntries(
        (contracts ?? []).map((c) => [c.id, `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim()])
      );

      // Group by contract_id + order_id
      const map = new Map<string, any>();
      for (const a of (data ?? []) as any[]) {
        const key = `${a.contract_id}__${a.order_id}`;
        if (!map.has(key)) {
          const reqAtt = a.orders?.required_attachments;
          const requiredCount = Array.isArray(reqAtt) ? reqAtt.length : 0;
          map.set(key, {
            contract_id: a.contract_id,
            order_id: a.order_id,
            employee_name: contractMap[a.contract_id] || "Unbekannt",
            order_title: a.orders?.title ?? "–",
            required_count: requiredCount,
            uploaded_count: 0,
            statuses: [] as string[],
            latest_created_at: a.created_at,
          });
        }
        const g = map.get(key)!;
        g.uploaded_count += 1;
        g.statuses.push(a.status);
        if (a.created_at > g.latest_created_at) g.latest_created_at = a.created_at;
      }

      return Array.from(map.values());
    },
  });

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
              <TableHead>Hochgeladen</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Eingereicht am</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Laden...</TableCell>
              </TableRow>
            ) : !groups?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Keine Anhänge vorhanden</TableCell>
              </TableRow>
            ) : (
              groups.map((g: any) => (
                <TableRow
                  key={`${g.contract_id}__${g.order_id}`}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/anhaenge/${g.contract_id}/${g.order_id}`)}
                >
                  <TableCell className="font-medium">{g.employee_name}</TableCell>
                  <TableCell>{g.order_title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {g.uploaded_count}/{g.required_count || g.uploaded_count}
                    </Badge>
                  </TableCell>
                  <TableCell>{groupStatus(g.statuses)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(g.latest_created_at), "dd.MM.yyyy HH:mm")}
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
