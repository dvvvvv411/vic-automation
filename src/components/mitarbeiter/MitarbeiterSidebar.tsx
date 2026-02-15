import { LayoutDashboard, ClipboardList, Star, LogOut, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface MitarbeiterSidebarProps {
  branding: {
    logo_url: string | null;
    company_name: string;
    brand_color: string | null;
  } | null;
  brandingLoading: boolean;
}

const navItems = [
  { title: "Dashboard", url: "/mitarbeiter", icon: LayoutDashboard },
  { title: "Aufträge", url: "/mitarbeiter/auftraege", icon: ClipboardList },
  { title: "Bewertungen", url: "/mitarbeiter/bewertungen", icon: Star },
  { title: "Meine Daten", url: "/mitarbeiter/meine-daten", icon: User },
];

export function MitarbeiterSidebar({ branding, brandingLoading }: MitarbeiterSidebarProps) {
  const { user, signOut } = useAuth();

  const userInitial = user?.email?.charAt(0).toUpperCase() || "?";

  return (
    <Sidebar className="border-r border-border/40 bg-card">
      {/* Logo */}
      <div className="py-6 px-5 border-b border-border/40 flex justify-center items-center">
        {brandingLoading ? (
          <Skeleton className="h-10 w-32" />
        ) : branding?.logo_url ? (
          <img
            src={branding.logo_url}
            alt={branding.company_name}
            className="max-h-14 w-auto object-contain"
          />
        ) : (
          <span className="text-sm font-semibold text-foreground">
            {branding?.company_name || "Unbekannt"}
          </span>
        )}
      </div>

      {/* Navigation */}
      <SidebarContent className="pt-6 px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="relative flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all duration-200"
                      activeClassName="bg-primary/10 text-primary font-medium shadow-sm border-l-[3px] border-primary"
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-border/40 p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
              {userInitial}
            </div>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-200"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Abmelden
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
