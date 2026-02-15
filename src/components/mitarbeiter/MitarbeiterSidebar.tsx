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

  return (
    <Sidebar className="border-r border-border bg-card">
      <div className="p-5 border-b border-border">
        {brandingLoading ? (
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-4 w-24" />
          </div>
        ) : branding?.logo_url ? (
          <div className="flex items-center gap-3">
            <img
              src={branding.logo_url}
              alt={branding.company_name}
              className="h-10 w-10 rounded-lg object-contain bg-muted p-1"
            />
            <span className="text-sm font-semibold text-foreground truncate">
              {branding.company_name}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: branding?.brand_color || "hsl(var(--primary))" }}
            >
              {branding?.company_name?.charAt(0) || "V"}
            </div>
            <span className="text-sm font-semibold text-foreground truncate">
              {branding?.company_name || "Vic Tester"}
            </span>
          </div>
        )}
      </div>

      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-[18px] w-[18px]" />
                      <span className="text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Abmelden
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
