import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar, FileCheck, CalendarClock, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const today = () => format(new Date(), "yyyy-MM-dd");

export default function AdminDashboard() {
  const navigate = useNavigate();

  // --- Stat queries ---
  const { data: neuCount, isLoading: l1 } = useQuery({
    queryKey: ["dash-bewerbungen-neu"],
    queryFn: async () => {
      const { count } = await supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "neu");
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  const { data: interviewTodayCount, isLoading: l2 } = useQuery({
    queryKey: ["dash-gespraeche-heute"],
    queryFn: async () => {
      const { count } = await supabase.from("interview_appointments").select("*", { count: "exact", head: true }).eq("appointment_date", today());
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  const { data: contractCount, isLoading: l3 } = useQuery({
    queryKey: ["dash-vertraege-eingereicht"],
    queryFn: async () => {
      const { count } = await supabase.from("employment_contracts").select("*", { count: "exact", head: true }).eq("status", "eingereicht");
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  const { data: appointmentTodayCount, isLoading: l4 } = useQuery({
    queryKey: ["dash-termine-heute"],
    queryFn: async () => {
      const { count } = await supabase.from("order_appointments").select("*", { count: "exact", head: true }).eq("appointment_date", today());
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  const { data: unreadChatCount, isLoading: l5 } = useQuery({
    queryKey: ["dash-chat-unread"],
    queryFn: async () => {
      const { count } = await supabase.from("chat_messages").select("*", { count: "exact", head: true }).eq("sender_role", "user").eq("read", false);
      return count ?? 0;
    },
    refetchInterval: 10000,
  });

  // --- Detail list queries ---
  const { data: recentApps } = useQuery({
    queryKey: ["dash-recent-apps"],
    queryFn: async () => {
      const { data } = await supabase.from("applications").select("id, first_name, last_name, status, created_at").order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    },
    refetchInterval: 30000,
  });

  const { data: todayInterviews } = useQuery({
    queryKey: ["dash-today-interviews"],
    queryFn: async () => {
      const { data } = await supabase.from("interview_appointments").select("id, appointment_time, status, application_id, applications(first_name, last_name)").eq("appointment_date", today()).order("appointment_time", { ascending: true });
      return data ?? [];
    },
    refetchInterval: 30000,
  });

  const { data: submittedContracts } = useQuery({
    queryKey: ["dash-submitted-contracts"],
    queryFn: async () => {
      const { data } = await supabase.from("employment_contracts").select("id, first_name, last_name, submitted_at").eq("status", "eingereicht").order("submitted_at", { ascending: false }).limit(5);
      return data ?? [];
    },
    refetchInterval: 30000,
  });

  const { data: todayOrderAppts } = useQuery({
    queryKey: ["dash-today-order-appts"],
    queryFn: async () => {
      const { data } = await supabase.from("order_appointments").select("id, appointment_time, contract_id, employment_contracts(first_name, last_name)").eq("appointment_date", today()).order("appointment_time", { ascending: true });
      return data ?? [];
    },
    refetchInterval: 30000,
  });

  const stats = [
    { label: "Neue Bewerbungen", value: neuCount, loading: l1, icon: FileText, link: "/admin/bewerbungen" },
    { label: "Gespräche heute", value: interviewTodayCount, loading: l2, icon: Calendar, link: "/admin/bewerbungsgespraeche" },
    { label: "Offene Verträge", value: contractCount, loading: l3, icon: FileCheck, link: "/admin/arbeitsvertraege" },
    { label: "Termine heute", value: appointmentTodayCount, loading: l4, icon: CalendarClock, link: "/admin/auftragstermine" },
    { label: "Ungelesene Chats", value: unreadChatCount, loading: l5, icon: MessageCircle, link: "/admin/livechat" },
  ];

  const statusMap: Record<string, string> = {
    neu: "Neu",
    eingeladen: "Eingeladen",
    erfolgreich: "Erfolgreich",
    abgelehnt: "Abgelehnt",
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-1">Willkommen zurück</h2>
        <p className="text-muted-foreground mb-8">Übersicht aller wichtigen Aktivitäten.</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.07 }}>
            <Card
              className="cursor-pointer shadow-sm hover:shadow-md transition-shadow"
              onClick={() => navigate(s.link)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                {s.loading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <div className="text-3xl font-bold text-foreground">{s.value}</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Detail Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Recent Applications */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Neueste Bewerbungen</CardTitle>
            </CardHeader>
            <CardContent>
              {!recentApps?.length ? (
                <p className="text-sm text-muted-foreground">Keine Bewerbungen vorhanden.</p>
              ) : (
                <div className="space-y-3">
                  {recentApps.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{a.first_name} {a.last_name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{statusMap[a.status] ?? a.status}</Badge>
                        <span className="text-muted-foreground text-xs">{format(new Date(a.created_at), "dd.MM.yy", { locale: de })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Interviews */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Heutige Gespräche</CardTitle>
            </CardHeader>
            <CardContent>
              {!todayInterviews?.length ? (
                <p className="text-sm text-muted-foreground">Keine Gespräche heute.</p>
              ) : (
                <div className="space-y-3">
                  {todayInterviews.map((iv: any) => (
                    <div key={iv.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">
                        {iv.applications?.first_name} {iv.applications?.last_name}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{statusMap[iv.status] ?? iv.status}</Badge>
                        <span className="text-muted-foreground text-xs">{iv.appointment_time?.slice(0, 5)} Uhr</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Submitted Contracts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Eingereichte Verträge</CardTitle>
            </CardHeader>
            <CardContent>
              {!submittedContracts?.length ? (
                <p className="text-sm text-muted-foreground">Keine eingereichten Verträge.</p>
              ) : (
                <div className="space-y-3">
                  {submittedContracts.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{c.first_name} {c.last_name}</span>
                      <span className="text-muted-foreground text-xs">
                        {c.submitted_at ? format(new Date(c.submitted_at), "dd.MM.yy", { locale: de }) : "–"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Order Appointments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Heutige Auftragstermine</CardTitle>
            </CardHeader>
            <CardContent>
              {!todayOrderAppts?.length ? (
                <p className="text-sm text-muted-foreground">Keine Auftragstermine heute.</p>
              ) : (
                <div className="space-y-3">
                  {todayOrderAppts.map((oa: any) => (
                    <div key={oa.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">
                        {oa.employment_contracts?.first_name} {oa.employment_contracts?.last_name}
                      </span>
                      <span className="text-muted-foreground text-xs">{oa.appointment_time?.slice(0, 5)} Uhr</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
