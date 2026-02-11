import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Smartphone, DollarSign, ClipboardList, Star } from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  { label: "Meine Tests", value: "7", icon: Smartphone, change: "+2 diese Woche" },
  { label: "Verdienst", value: "€340", icon: DollarSign, change: "+€85 diese Woche" },
  { label: "Offene Aufgaben", value: "3", icon: ClipboardList, change: "3 neu" },
  { label: "Bewertung", value: "4.8", icon: Star, change: "Top 10%" },
];

const Mitarbeiter = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Vic <span className="text-primary">Tester</span>
            </h1>
            <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
              Mitarbeiter
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Abmelden
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-1">
            Willkommen zurück
          </h2>
          <p className="text-muted-foreground mb-8">
            Hier ist Ihre aktuelle Übersicht.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10"
        >
          <Card className="p-8 text-center shadow-sm">
            <p className="text-muted-foreground">
              Weitere Tester-Funktionen werden hier implementiert.
            </p>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Mitarbeiter;
