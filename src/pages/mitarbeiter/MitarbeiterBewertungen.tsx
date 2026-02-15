import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MessageSquare, FileText, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Review {
  id: string;
  question: string;
  rating: number;
  comment: string;
  created_at: string;
  order_id: string;
  order_title: string;
  order_number: string;
}

interface GroupedReviews {
  order_id: string;
  order_title: string;
  order_number: string;
  created_at: string;
  reviews: Review[];
  averageRating: number;
}

interface OutletContext {
  contract: { id: string } | null;
  loading: boolean;
}

export default function MitarbeiterBewertungen() {
  const { contract, loading: layoutLoading } = useOutletContext<OutletContext>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<GroupedReviews | null>(null);

  useEffect(() => {
    if (!contract?.id) return;

    const fetchReviews = async () => {
      const { data } = await supabase
        .from("order_reviews")
        .select("id, question, rating, comment, created_at, order_id, orders(title, order_number)")
        .eq("contract_id", contract.id)
        .order("created_at", { ascending: false });

      if (data) {
        const mapped = data.map((r: any) => ({
          id: r.id,
          question: r.question,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          order_id: r.order_id,
          order_title: r.orders?.title ?? "Unbekannt",
          order_number: r.orders?.order_number ?? "",
        }));
        setReviews(mapped);
      }
      setLoading(false);
    };

    fetchReviews();
  }, [contract?.id]);

  const grouped: GroupedReviews[] = [];
  const map = new Map<string, GroupedReviews>();
  for (const r of reviews) {
    if (!map.has(r.order_id)) {
      const g: GroupedReviews = {
        order_id: r.order_id,
        order_title: r.order_title,
        order_number: r.order_number,
        created_at: r.created_at,
        reviews: [],
        averageRating: 0,
      };
      map.set(r.order_id, g);
      grouped.push(g);
    }
    map.get(r.order_id)!.reviews.push(r);
  }
  for (const g of grouped) {
    g.averageRating = g.reviews.reduce((sum, r) => sum + r.rating, 0) / g.reviews.length;
  }

  if (layoutLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meine Bewertungen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Übersicht deiner abgegebenen Bewertungen
        </p>
      </div>

      {grouped.length === 0 ? (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">Noch keine Bewertungen abgegeben</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Bewertungen erscheinen hier, sobald du einen Auftrag bewertet hast.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {grouped.map((group, idx) => (
            <motion.div
              key={group.order_id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <Card className="border-border/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-1 bg-gradient-to-r from-primary/80 to-primary/20" />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-foreground">
                      {group.order_title}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground font-mono">
                      #{group.order_number}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Bewertet am{" "}
                    {format(new Date(group.created_at), "dd. MMMM yyyy", { locale: de })}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.round(group.averageRating)
                              ? "fill-primary text-primary"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {group.averageRating.toFixed(1)} / 5
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {group.reviews.length} {group.reviews.length === 1 ? "Bewertung" : "Bewertungen"}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedGroup(group)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Details ansehen
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedGroup} onOpenChange={(open) => !open && setSelectedGroup(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedGroup?.order_title}</DialogTitle>
            <DialogDescription>
              #{selectedGroup?.order_number} – Bewertet am{" "}
              {selectedGroup && format(new Date(selectedGroup.created_at), "dd. MMMM yyyy", { locale: de })}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-3">
              {selectedGroup?.reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-lg border border-border/40 bg-muted/30 p-4 space-y-2"
                >
                  <p className="text-sm font-medium text-foreground">{review.question}</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "fill-primary text-primary"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  {review.comment && (
                    <div className="flex items-start gap-2 mt-1">
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
