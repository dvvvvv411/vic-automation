import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Smartphone, Euro, ClipboardList, Star, ExternalLink, Apple, Play, Package, Clock, CheckCircle, XCircle, RefreshCw, CalendarCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { de } from "date-fns/locale";

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
}

interface OrderWithStatus extends Order {
  assignment_status: string;
  appointment?: { appointment_date: string; appointment_time: string } | null;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Guten Morgen";
  if (hour < 18) return "Guten Tag";
  return "Guten Abend";
}

const StatusButton = ({ status, orderId, isPlaceholder, hasAppointment, navigate }: { 
  status: string; orderId: string; isPlaceholder: boolean; hasAppointment: boolean; navigate: (path: string) => void 
}) => {
  switch (status) {
    case "in_pruefung":
      return (
        <Button className="w-full mt-2 rounded-xl" size="sm" disabled variant="outline">
          <Clock className="h-3.5 w-3.5 mr-1.5 text-yellow-500" />
          In Überprüfung
        </Button>
      );
    case "erfolgreich":
      return (
        <Button className="w-full mt-2 rounded-xl" size="sm" disabled variant="outline">
          <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-green-500" />
          Erfolgreich
        </Button>
      );
    case "fehlgeschlagen":
      return (
        <Button
          className="w-full mt-2 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10"
          size="sm"
          variant="outline"
          onClick={() => navigate(`/mitarbeiter/auftragdetails/${orderId}`)}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Erneut bewerten
        </Button>
      );
    default:
      if (!isPlaceholder && !hasAppointment) {
        return (
          <Button
            className="w-full mt-2 rounded-xl"
            size="sm"
            variant="outline"
            onClick={() => navigate(`/mitarbeiter/auftragdetails/${orderId}`)}
          >
            <CalendarCheck className="h-3.5 w-3.5 mr-1.5" />
            Termin buchen
          </Button>
        );
      }
      return (
        <Button
          className="w-full mt-2 rounded-xl group/btn bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          size="sm"
          onClick={() => navigate(`/mitarbeiter/auftragdetails/${orderId}`)}
        >
          Auftrag starten
          <ExternalLink className="h-3.5 w-3.5 ml-1.5 opacity-60 group-hover/btn:opacity-100 transition-opacity" />
        </Button>
      );
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "in_pruefung":
      return <Badge variant="outline" className="text-[11px] text-yellow-600 border-yellow-300 bg-yellow-50">In Überprüfung</Badge>;
    case "erfolgreich":
      return <Badge variant="outline" className="text-[11px] text-green-600 border-green-300 bg-green-50">Erfolgreich</Badge>;
    case "fehlgeschlagen":
      return <Badge variant="outline" className="text-[11px] text-destructive border-destructive/30 bg-destructive/5">Fehlgeschlagen</Badge>;
    default:
      return null;
  }
};

const MitarbeiterDashboard = () => {
  const navigate = useNavigate();
  const { contract, loading: layoutLoading } = useOutletContext<ContextType>();
  const [orders, setOrders] = useState<OrderWithStatus[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!contract) {
      setDataLoading(false);
      return;
    }

    const fetchOrders = async () => {
      const { data: assignments } = await supabase
        .from("order_assignments")
        .select("order_id, status")
        .eq("contract_id", contract.id);

      if (!assignments?.length) {
        setDataLoading(false);
        return;
      }

      const orderIds = assignments.map((a) => a.order_id);
      const statusMap = Object.fromEntries(assignments.map((a) => [a.order_id, a.status ?? "offen"]));

      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .in("id", orderIds);

      // Load appointments
      const { data: appointments } = await supabase
        .from("order_appointments")
        .select("order_id, appointment_date, appointment_time")
        .eq("contract_id", contract.id);

      const apptMap = Object.fromEntries((appointments ?? []).map((a: any) => [a.order_id, a]));

      if (ordersData) {
        setOrders(ordersData.map((o) => ({ 
          ...o, 
          assignment_status: statusMap[o.id] ?? "offen",
          appointment: apptMap[o.id] || null,
        })));
      }
      setDataLoading(false);
    };

    fetchOrders();
  }, [contract]);

  const isLoading = layoutLoading || dataLoading;

  const totalEarnings = orders.reduce((sum, o) => {
    const num = parseFloat(o.reward.replace(/[^0-9.,]/g, "").replace(",", "."));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  const stats = [
    { label: "Zugewiesene Tests", value: orders.length.toString(), icon: Smartphone, detail: orders.length === 1 ? "1 Test" : `${orders.length} Tests` },
    { label: "Verdienst", value: `€${totalEarnings.toFixed(0)}`, icon: Euro, detail: "Gesamtprämie" },
    { label: "Offene Aufträge", value: orders.filter((o) => o.assignment_status === "offen" || o.assignment_status === "fehlgeschlagen").length.toString(), icon: ClipboardList, detail: "Handlungsbedarf" },
    { label: "Bewertung", value: "4.8", icon: Star, detail: "Top 10%" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
          {getGreeting()}, {contract?.first_name || "Tester"} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Hier ist deine aktuelle Übersicht.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 + i * 0.08, ease: "easeOut" }}
          >
            <Card className="group relative overflow-hidden border border-border/40 ring-1 ring-border/10 shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 bg-card/80 backdrop-blur-sm rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 group-hover:from-primary/25 group-hover:to-primary/10 transition-colors">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold tracking-tight text-foreground">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{stat.detail}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Orders Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        {(() => {
          const dashboardOrders = orders.filter(o => o.assignment_status === "offen" || o.assignment_status === "fehlgeschlagen" || o.assignment_status === "in_pruefung");
          return (
            <>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Deine Aufträge</h2>
                  <p className="text-sm text-muted-foreground">
                    {dashboardOrders.length
                      ? `${dashboardOrders.length} ${dashboardOrders.length === 1 ? "Auftrag" : "Aufträge"} mit Handlungsbedarf`
                      : "Keine offenen Aufträge"}
                  </p>
                </div>
              </div>

              {dashboardOrders.length === 0 ? (
                <Card className="border-dashed border-2 border-border/40 rounded-2xl">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center mb-4">
                      <Package className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-base font-medium text-foreground mb-1">
                      Noch keine Aufträge
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Sobald dir Aufträge zugewiesen werden, erscheinen sie hier. Du wirst benachrichtigt.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {dashboardOrders.map((order, i) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.55 + i * 0.08, ease: "easeOut" }}
                    >
                      <Card className="group relative overflow-hidden border border-border/40 ring-1 ring-border/10 shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full bg-card/80 backdrop-blur-sm rounded-2xl">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary/80 to-primary/30 rounded-t-2xl" />

                        <CardHeader className="pb-3 pt-5">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary" className="text-[11px] font-medium px-2.5 py-0.5 bg-muted rounded-full">
                              #{order.order_number}
                            </Badge>
                            <div className="flex items-center gap-1.5">
                              {order.is_placeholder && (
                                <Badge variant="outline" className="text-[11px] text-muted-foreground rounded-full">
                                  Platzhalter
                                </Badge>
                              )}
                              <StatusBadge status={order.assignment_status} />
                            </div>
                          </div>
                          <CardTitle className="text-base font-semibold leading-snug text-foreground line-clamp-2">
                            {order.title}
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col justify-between gap-4 pt-0">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm pb-3 border-b border-border/30">
                              <span className="text-muted-foreground">Anbieter</span>
                              <span className="font-medium text-foreground">{order.provider}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Prämie</span>
                              <span className="font-semibold text-primary bg-primary/10 rounded-full px-3 py-0.5">{order.reward}</span>
                            </div>

                            {(order.appstore_url || order.playstore_url) && (
                              <div className="flex items-center gap-2 pt-1">
                                {order.appstore_url && (
                                  <a
                                    href={order.appstore_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted/60 rounded-full px-3 py-1.5"
                                  >
                                    <Apple className="h-3.5 w-3.5" />
                                    App Store
                                  </a>
                                )}
                                {order.playstore_url && (
                                  <a
                                    href={order.playstore_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted/60 rounded-full px-3 py-1.5"
                                  >
                                    <Play className="h-3.5 w-3.5" />
                                    Play Store
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Appointment badge for non-placeholder with booked appointment */}
                            {!order.is_placeholder && order.appointment && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 mt-1">
                                <CalendarCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span>
                                  Termin: {format(new Date(order.appointment.appointment_date), "d. MMM yyyy", { locale: de })}, {order.appointment.appointment_time.slice(0, 5)} Uhr
                                </span>
                              </div>
                            )}
                          </div>

                          <StatusButton 
                            status={order.assignment_status} 
                            orderId={order.id} 
                            isPlaceholder={order.is_placeholder}
                            hasAppointment={!!order.appointment}
                            navigate={navigate} 
                          />
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          );
        })()}
      </motion.div>
    </div>
  );
};

export default MitarbeiterDashboard;
