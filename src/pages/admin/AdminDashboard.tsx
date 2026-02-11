import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Play, CheckCircle, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  { label: "Aktive Tester", value: "24", icon: Users, change: "+3 diese Woche" },
  { label: "Laufende Tests", value: "12", icon: Play, change: "+5 diese Woche" },
  { label: "Abgeschlossen", value: "148", icon: CheckCircle, change: "+18 diese Woche" },
  { label: "Erfolgsrate", value: "94%", icon: BarChart3, change: "+2% diese Woche" },
];

export default function AdminDashboard() {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-1">
          Willkommen zurück
        </h2>
        <p className="text-muted-foreground mb-8">
          Übersicht aller App-Tests und Tester-Aktivitäten.
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
    </>
  );
}
