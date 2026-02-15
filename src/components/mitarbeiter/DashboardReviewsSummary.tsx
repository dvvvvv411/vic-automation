import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ArrowRight, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface RecentReview {
  order_title: string;
  avg: number;
  date: string;
}

interface Props {
  recentReviews: RecentReview[];
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-3.5 w-3.5 ${i < Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
      />
    ))}
    <span className="text-xs font-medium text-muted-foreground ml-1.5">{rating.toFixed(1)}</span>
  </div>
);

const DashboardReviewsSummary = ({ recentReviews }: Props) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.7, ease: "easeOut" }}
    >
      <Card className="border border-border/40 ring-1 ring-border/10 shadow-sm bg-card/80 backdrop-blur-sm rounded-2xl h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground">Letzte Bewertungen</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/mitarbeiter/bewertungen")}
            >
              Alle ansehen
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {recentReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">Noch keine Bewertungen abgegeben</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReviews.map((review, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium text-foreground truncate">{review.order_title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(review.date), "d. MMM yyyy", { locale: de })}
                    </p>
                  </div>
                  <StarRating rating={review.avg} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DashboardReviewsSummary;
