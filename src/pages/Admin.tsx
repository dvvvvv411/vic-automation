import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Users, Play, CheckCircle, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  { label: "Aktive Tester", value: "24", icon: Users, change: "+3" },
  { label: "Laufende Tests", value: "12", icon: Play, change: "+5" },
  { label: "Abgeschlossen", value: "148", icon: CheckCircle, change: "+18" },
  { label: "Erfolgsrate", value: "94%", icon: BarChart3, change: "+2%" },
];

const Admin = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">
              Vic <span className="text-primary">Admin</span>
            </h1>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              Admin Panel
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
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
          <h2 className="text-3xl font-bold tracking-tight mb-2">
            Willkommen zurück
          </h2>
          <p className="text-muted-foreground mb-8">
            Übersicht aller App-Tests und Tester-Aktivitäten.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card className="bg-card/80 border-border/50 hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-primary mt-1">{stat.change} diese Woche</p>
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
          <Card className="bg-card/80 border-border/50 p-8 text-center">
            <p className="text-muted-foreground">
              Weitere Admin-Funktionen werden hier implementiert.
            </p>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Admin;
