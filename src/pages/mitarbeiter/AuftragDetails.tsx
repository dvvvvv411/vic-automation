import { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Apple, Play, Target, HelpCircle, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

interface ContextType {
  contract: { id: string; first_name: string | null; application_id: string } | null;
  branding: { logo_url: string | null; company_name: string; brand_color: string | null } | null;
  loading: boolean;
}

interface Order {
  id: string;
  order_number: string;
  title: string;
  provider: string;
  reward: string;
  is_placeholder: boolean;
  appstore_url: string | null;
  playstore_url: string | null;
  project_goal: string | null;
  review_questions: unknown;
}

const AuftragDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { contract, loading: layoutLoading } = useOutletContext<ContextType>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contract || !id) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      // Verify assignment
      const { data: assignment } = await supabase
        .from("order_assignments")
        .select("id")
        .eq("order_id", id)
        .eq("contract_id", contract.id)
        .maybeSingle();

      if (!assignment) {
        setError("Dieser Auftrag ist dir nicht zugewiesen.");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (fetchError || !data) {
        setError("Auftrag konnte nicht geladen werden.");
      } else {
        setOrder(data);
      }
      setLoading(false);
    };

    fetchOrder();
  }, [contract, id]);

  const questions: string[] = (() => {
    if (!order?.review_questions) return [];
    try {
      const parsed = Array.isArray(order.review_questions)
        ? order.review_questions
        : JSON.parse(String(order.review_questions));
      return Array.isArray(parsed) ? parsed.filter((q): q is string => typeof q === "string") : [];
    } catch {
      return [];
    }
  })();

  if (layoutLoading || loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Zurück
        </Button>
        <Card className="border-destructive/40">
          <CardContent className="py-12 text-center">
            <p className="text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Zurück
        </Button>
        <Badge variant="secondary" className="text-xs font-medium px-3 py-1">
          #{order.order_number}
        </Badge>
      </motion.div>

      {/* Title & Meta */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <Card className="border border-border/60 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary/80 to-primary/40" />
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">
              {order.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Anbieter</span>
              <p className="font-medium text-foreground">{order.provider}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Prämie</span>
              <p className="font-semibold text-primary">{order.reward}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Project Goal */}
      {order.project_goal && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                <Target className="h-4 w-4 text-primary" />
                Projektziel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {order.project_goal}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Review Questions */}
      {questions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                <HelpCircle className="h-4 w-4 text-primary" />
                Bewertungsfragen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2">
                {questions.map((q, i) => (
                  <li key={i} className="text-sm text-muted-foreground leading-relaxed">
                    {q}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Downloads */}
      {(order.appstore_url || order.playstore_url) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                <Download className="h-4 w-4 text-primary" />
                Downloads
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {order.appstore_url && (
                <a
                  href={order.appstore_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="gap-2">
                    <Apple className="h-4 w-4" />
                    App Store
                  </Button>
                </a>
              )}
              {order.playstore_url && (
                <a
                  href={order.playstore_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="gap-2">
                    <Play className="h-4 w-4" />
                    Play Store
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default AuftragDetails;
