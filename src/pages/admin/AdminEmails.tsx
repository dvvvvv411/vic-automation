import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Mail } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const eventLabels: Record<string, string> = {
  bewerbung_eingegangen: "Bewerbung eingegangen",
  bewerbung_angenommen: "Bewerbung angenommen",
  bewerbung_abgelehnt: "Bewerbung abgelehnt",
  gespraech_erfolgreich: "Gespraech erfolgreich",
  vertrag_genehmigt: "Vertrag genehmigt",
  vertrag_unterzeichnet: "Vertrag unterzeichnet",
  auftrag_zugewiesen: "Auftrag zugewiesen",
  termin_gebucht: "Termin gebucht",
  bewertung_genehmigt: "Bewertung genehmigt",
  bewertung_abgelehnt: "Bewertung abgelehnt",
};

export default function AdminEmails() {
  const [filter, setFilter] = useState<string>("all");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["email-logs", filter],
    queryFn: async () => {
      let query = supabase
        .from("email_logs")
        .select("*, brandings(company_name)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filter !== "all") {
        query = query.eq("event_type", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">E-Mails</h2>
          <p className="text-muted-foreground mt-1">Alle versendeten E-Mail-Benachrichtigungen im Ueberblick.</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Alle Ereignisse" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Ereignisse</SelectItem>
            {Object.entries(eventLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laden...</div>
        ) : !logs?.length ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Noch keine E-Mails versendet.</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Ereignis</TableHead>
                  <TableHead>Empfaenger</TableHead>
                  <TableHead>Betreff</TableHead>
                  <TableHead>Branding</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), "dd.MM.yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {eventLabels[log.event_type] || log.event_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{log.recipient_name || "–"}</div>
                      <div className="text-xs text-muted-foreground">{log.recipient_email}</div>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{log.subject}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(log as any).brandings?.company_name || "–"}
                    </TableCell>
                    <TableCell>
                      {log.status === "sent" ? (
                        <Badge variant="outline" className="text-xs border-green-300 text-green-600 bg-green-50">
                          Gesendet
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Fehlgeschlagen
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>
    </>
  );
}
