import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface ReviewRow {
  order_id: string;
  contract_id: string;
  question: string;
  rating: number;
  comment: string;
  created_at: string;
  order_title: string;
  employee_name: string;
}

interface GroupedReview {
  order_id: string;
  contract_id: string;
  order_title: string;
  employee_name: string;
  avg_rating: number;
  date: string;
  details: { question: string; rating: number; comment: string }[];
}

const Stars = ({ count }: { count: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`h-4 w-4 ${s <= Math.round(count) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
      />
    ))}
  </div>
);

const AdminBewertungen = () => {
  const [selected, setSelected] = useState<GroupedReview | null>(null);

  const { data: grouped = [], isLoading } = useQuery({
    queryKey: ["admin-bewertungen"],
    queryFn: async () => {
      const { data: reviews, error } = await supabase
        .from("order_reviews")
        .select("order_id, contract_id, question, rating, comment, created_at");

      if (error || !reviews?.length) return [];

      const orderIds = [...new Set(reviews.map((r) => r.order_id))];
      const contractIds = [...new Set(reviews.map((r) => r.contract_id))];

      const [{ data: orders }, { data: contracts }] = await Promise.all([
        supabase.from("orders").select("id, title").in("id", orderIds),
        supabase.from("employment_contracts").select("id, first_name, last_name").in("id", contractIds),
      ]);

      const orderMap = Object.fromEntries((orders ?? []).map((o) => [o.id, o.title]));
      const contractMap = Object.fromEntries(
        (contracts ?? []).map((c) => [c.id, [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unbekannt"])
      );

      const enriched: ReviewRow[] = reviews.map((r) => ({
        ...r,
        order_title: orderMap[r.order_id] ?? "Unbekannt",
        employee_name: contractMap[r.contract_id] ?? "Unbekannt",
      }));

      const map = new Map<string, GroupedReview>();
      for (const r of enriched) {
        const key = `${r.order_id}_${r.contract_id}`;
        if (!map.has(key)) {
          map.set(key, {
            order_id: r.order_id,
            contract_id: r.contract_id,
            order_title: r.order_title,
            employee_name: r.employee_name,
            avg_rating: 0,
            date: r.created_at,
            details: [],
          });
        }
        map.get(key)!.details.push({ question: r.question, rating: r.rating, comment: r.comment });
      }

      for (const g of map.values()) {
        g.avg_rating = g.details.reduce((sum, d) => sum + d.rating, 0) / g.details.length;
      }

      return [...map.values()].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Bewertungen</h1>
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-md" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Bewertungen</h1>

      {grouped.length === 0 ? (
        <p className="text-muted-foreground text-sm">Noch keine Bewertungen vorhanden.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mitarbeiter</TableHead>
                <TableHead>Auftrag</TableHead>
                <TableHead>Durchschnitt</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead className="text-right">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grouped.map((g) => (
                <TableRow key={`${g.order_id}_${g.contract_id}`}>
                  <TableCell className="font-medium">{g.employee_name}</TableCell>
                  <TableCell>{g.order_title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Stars count={g.avg_rating} />
                      <span className="text-sm text-muted-foreground">
                        {g.avg_rating.toFixed(1)} / 5
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(g.date), "dd.MM.yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelected(g)}>
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Bewertung — {selected?.employee_name} → {selected?.order_title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {selected?.details.map((d, i) => (
              <div key={i} className="space-y-2">
                <p className="text-sm font-semibold text-foreground">{d.question}</p>
                <div className="flex items-center gap-2">
                  <Stars count={d.rating} />
                  <span className="text-sm text-muted-foreground">{d.rating}/5</span>
                </div>
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
                  {d.comment}
                </p>
                {i < (selected?.details.length ?? 0) - 1 && <Separator />}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBewertungen;
