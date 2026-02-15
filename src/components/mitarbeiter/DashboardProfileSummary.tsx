import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, CreditCard, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProfileSummary {
  name: string;
  email: string;
  iban: string | null;
}

interface Props {
  profile: ProfileSummary | null;
  balance: number;
}

const maskIban = (iban: string | null): string => {
  if (!iban) return "—";
  if (iban.length <= 6) return iban;
  return iban.slice(0, 4) + " •••• •••• " + iban.slice(-4);
};

const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground truncate">{value}</p>
    </div>
  </div>
);

const DashboardProfileSummary = ({ profile, balance }: Props) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.78, ease: "easeOut" }}
    >
      <Card className="border border-border/40 ring-1 ring-border/10 shadow-sm bg-card/80 backdrop-blur-sm rounded-2xl h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground">Meine Daten</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/mitarbeiter/meine-daten")}
            >
              Details
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {!profile ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Keine Daten verfügbar</p>
          ) : (
            <div className="space-y-1">
              <InfoRow icon={User} label="Name" value={profile.name || "—"} />
              <InfoRow icon={Mail} label="E-Mail" value={profile.email || "—"} />
              <InfoRow icon={CreditCard} label="IBAN" value={maskIban(profile.iban)} />
              <div className="mt-3 pt-3 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Guthaben</span>
                  <span className="text-lg font-bold text-primary">{balance.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DashboardProfileSummary;
