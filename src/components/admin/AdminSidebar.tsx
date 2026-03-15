import { LayoutDashboard, Palette, FileText, Calendar, FileCheck, LogOut, Users, ClipboardList, MessageCircle, Star, CalendarClock, Mail, Smartphone, Send, Clock, Phone, MessageSquareText, UserPlus, History, Building2 } from "lucide-react";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { useUserRole } from "@/hooks/useUserRole";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

const KUNDE_HIDDEN_PATHS = [
  "/admin/brandings",
  "/admin/emails",
  "/admin/sms",
  "/admin/telegram",
  "/admin/kunden",
  "/admin/sms-history",
];

const navGroups = [
  {
    label: null,
    items: [
      { title: "Übersicht", url: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "Recruiting",
    items: [
      { title: "Bewerbungen", url: "/admin/bewerbungen", icon: FileText },
      { title: "Bewerbungsgespräche", url: "/admin/bewerbungsgespraeche", icon: Calendar },
      { title: "Probetage", url: "/admin/probetag", icon: Building2 },
      { title: "Arbeitsverträge", url: "/admin/arbeitsvertraege", icon: FileCheck },
    ],
  },
  {
    label: "Betrieb",
    items: [
      { title: "Mitarbeiter", url: "/admin/mitarbeiter", icon: Users },
      { title: "Aufträge", url: "/admin/auftraege", icon: ClipboardList },
      { title: "Auftragstermine", url: "/admin/auftragstermine", icon: CalendarClock },
      { title: "Livechat", url: "/admin/livechat", icon: MessageCircle },
      { title: "Bewertungen", url: "/admin/bewertungen", icon: Star },
      { title: "Telefonnummern", url: "/admin/telefonnummern", icon: Phone },
      { title: "SMS Spoof", url: "/admin/sms-spoof", icon: MessageSquareText },
    ],
  },
  {
    label: "Einstellungen",
    items: [
      { title: "Brandings", url: "/admin/brandings", icon: Palette },
      { title: "E-Mails", url: "/admin/emails", icon: Mail },
      { title: "SMS", url: "/admin/sms", icon: Smartphone },
      { title: "SMS History", url: "/admin/sms-history", icon: History },
      { title: "Telegram", url: "/admin/telegram", icon: Send },
      { title: "Zeitplan", url: "/admin/zeitplan", icon: Clock },
      { title: "Kunden", url: "/admin/kunden", icon: UserPlus },
    ],
  },
];

export function AdminSidebar() {
  const { user, signOut } = useAuth();
  const { hasAccess, loading: permissionsLoading } = useAdminPermissions();
  const { isKunde } = useUserRole();

  const { data: neuCount } = useQuery({
    queryKey: ["badge-bewerbungen-neu"],
    queryFn: async () => {
      const { count } = await supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "neu");
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
      const { count } = await supabase.from("interview_appointments").select("*", { count: "exact", head: true }).eq("appointment_date", today).gte("appointment_time", nowTime);
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  const { data: eingereichtCount } = useQuery({
    queryKey: ["badge-vertraege-eingereicht"],
    queryFn: async () => {
      const { count } = await supabase.from("employment_contracts").select("*", { count: "exact", head: true }).eq("status", "eingereicht");
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  const { data: chatUnreadCount } = useQuery({
    queryKey: ["badge-chat-unread"],
    queryFn: async () => {
      const { count } = await supabase.from("chat_messages").select("*", { count: "exact", head: true }).eq("sender_role", "user").eq("read", false);
      return count ?? 0;
    },
    refetchInterval: 10000,
  });

  const { data: inPruefungCount } = useQuery({
    queryKey: ["badge-bewertungen-pruefung"],
    queryFn: async () => {
      const { count } = await supabase.from("order_assignments").select("*", { count: "exact", head: true }).eq("status", "in_pruefung");
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  const { data: todayAppointmentsCount } = useQuery({
    queryKey: ["badge-auftragstermine-heute"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { count } = await supabase.from("order_appointments").select("*", { count: "exact", head: true }).eq("appointment_date", today);
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

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "AD";

  return (
    <Sidebar className="border-r-0">
      <SidebarContent className="bg-[hsl(var(--sidebar-background))] px-3 pt-2">
        {/* Brand */}
        <div className="px-3 py-5 mb-1">
          <h2 className="text-lg font-bold tracking-tight text-white">
            Vic <span className="text-[hsl(var(--sidebar-primary))]">{isKunde ? "Kunde" : "Admin"}</span>
          </h2>
          <p className="text-[11px] text-[hsl(var(--sidebar-foreground))] mt-0.5 opacity-60">Kontrollpanel</p>
        </div>

        {!permissionsLoading && navGroups.map((group, groupIndex) => {
          const visibleItems = group.items.filter((item) => {
            if (!hasAccess(item.url)) return false;
            if (isKunde && KUNDE_HIDDEN_PATHS.includes(item.url)) return false;
            return true;
          });
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label ?? "overview"}>
              {groupIndex > 0 && (
                <div className="mx-3 my-3 border-t border-[hsl(var(--sidebar-border))]" />
              )}
              <SidebarGroup>
                {group.label && (
                  <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--sidebar-foreground))] opacity-50 px-3 mb-1">
                    {group.label}
                  </SidebarGroupLabel>
                )}
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-muted))] transition-all duration-150"
                            activeClassName="!bg-[hsl(var(--sidebar-primary))] !text-white font-medium shadow-md shadow-[hsl(var(--sidebar-primary))]/25"
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="flex-1 truncate">{item.title}</span>
                            {badgeCounts[item.url] > 0 && (
                              <span className="ml-auto text-[10px] font-bold min-w-[1.25rem] h-5 flex items-center justify-center rounded-full bg-destructive text-white px-1.5">
                                {badgeCounts[item.url]}
                              </span>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </div>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="bg-[hsl(var(--sidebar-background))] border-t border-[hsl(var(--sidebar-border))] p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-[hsl(var(--sidebar-primary))] text-white text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <p className="text-xs text-[hsl(var(--sidebar-foreground))] truncate flex-1">{user?.email}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-muted))] hover:text-white bg-transparent"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Abmelden
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
