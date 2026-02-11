import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const PAGE_SIZE = 10;

export default function AdminBewerbungsgespraeche() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["interview-appointments", page],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from("interview_appointments")
        .select("*, applications(first_name, last_name, email, phone, brandings(company_name))", { count: "exact" })
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (error) throw error;
      return { items: data || [], total: count || 0 };
    },
  });

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Bewerbungsgespräche</h2>
        <p className="text-muted-foreground mt-1">Alle gebuchten Termine im Überblick.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laden...</div>
        ) : !data?.items.length ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Noch keine Termine gebucht.</p>
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
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Branding</TableHead>
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
                        {item.applications?.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.applications?.phone || "–"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.applications?.brandings?.company_name || "–"}
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
