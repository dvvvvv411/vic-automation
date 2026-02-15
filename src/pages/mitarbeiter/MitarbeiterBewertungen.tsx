import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MessageSquare, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
}

interface OutletContext {
  contract: { id: string } | null;
  loading: boolean;
}

export default function MitarbeiterBewertungen() {
  const { contract, loading: layoutLoading } = useOutletContext<OutletContext>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

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
      };
      map.set(r.order_id, g);
      grouped.push(g);
    }
    map.get(r.order_id)!.reviews.push(r);
  }

  if (layoutLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
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
        <div className="space-y-5">
          {grouped.map((group, idx) => (
            <motion.div
              key={group.order_id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <Card className="border-border/60 shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary/80 to-primary/20" />
                <CardHeader className="pb-3">
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
                <CardContent className="space-y-4">
                  {group.reviews.map((review) => (
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
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
