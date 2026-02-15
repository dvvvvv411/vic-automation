import { LayoutDashboard, Palette, FileText, Calendar, FileCheck, LogOut, Users, ClipboardList, MessageCircle, Star, CalendarClock } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Übersicht", url: "/admin", icon: LayoutDashboard },
  { title: "Brandings", url: "/admin/brandings", icon: Palette },
  { title: "Bewerbungen", url: "/admin/bewerbungen", icon: FileText },
  { title: "Bewerbungsgespräche", url: "/admin/bewerbungsgespraeche", icon: Calendar },
  { title: "Arbeitsverträge", url: "/admin/arbeitsvertraege", icon: FileCheck },
  { title: "Mitarbeiter", url: "/admin/mitarbeiter", icon: Users },
  { title: "Aufträge", url: "/admin/auftraege", icon: ClipboardList },
  { title: "Auftragstermine", url: "/admin/auftragstermine", icon: CalendarClock },
  { title: "Livechat", url: "/admin/livechat", icon: MessageCircle },
  { title: "Bewertungen", url: "/admin/bewertungen", icon: Star },
];

export function AdminSidebar() {
  const { user, signOut } = useAuth();

  const { data: neuCount } = useQuery({
    queryKey: ["badge-bewerbungen-neu"],
    queryFn: async () => {
      const { count } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "neu");
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  const { data: todayCount } = useQuery({
    queryKey: ["badge-gespraeche-heute"],
    queryFn: async () => {
      const now = new Date();
      const today = format(now, "yyyy-MM-dd");
      const nowTime = format(now, "HH:mm:ss");
      const { count } = await supabase
        .from("interview_appointments")
        .select("*", { count: "exact", head: true })
        .eq("appointment_date", today)
        .gte("appointment_time", nowTime);
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  const { data: eingereichtCount } = useQuery({
    queryKey: ["badge-vertraege-eingereicht"],
    queryFn: async () => {
      const { count } = await supabase
        .from("employment_contracts")
        .select("*", { count: "exact", head: true })
        .eq("status", "eingereicht");
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  const { data: chatUnreadCount } = useQuery({
    queryKey: ["badge-chat-unread"],
    queryFn: async () => {
      const { count } = await supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .eq("sender_role", "user")
        .eq("read", false);
      return count ?? 0;
    },
    refetchInterval: 10000,
  });

  const { data: inPruefungCount } = useQuery({
    queryKey: ["badge-bewertungen-pruefung"],
    queryFn: async () => {
      const { count } = await supabase
        .from("order_assignments")
        .select("*", { count: "exact", head: true })
        .eq("status", "in_pruefung");
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  const { data: todayAppointmentsCount } = useQuery({
    queryKey: ["badge-auftragstermine-heute"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { count } = await supabase
        .from("order_appointments")
        .select("*", { count: "exact", head: true })
        .eq("appointment_date", today);
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  const badgeCounts: Record<string, number> = {
    "/admin/bewerbungen": neuCount ?? 0,
    "/admin/bewerbungsgespraeche": todayCount ?? 0,
    "/admin/arbeitsvertraege": eingereichtCount ?? 0,
    "/admin/auftragstermine": todayAppointmentsCount ?? 0,
    "/admin/livechat": chatUnreadCount ?? 0,
    "/admin/bewertungen": inPruefungCount ?? 0,
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent>
        <div className="px-4 py-5">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Vic <span className="text-primary">Admin</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Kontrollpanel</p>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1">{item.title}</span>
                      {badgeCounts[item.url] > 0 && (
                        <Badge className="ml-auto text-xs px-1.5 py-0 min-w-[1.25rem] h-5 flex items-center justify-center">
                          {badgeCounts[item.url]}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground truncate mb-2">{user?.email}</p>
        <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Abmelden
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
