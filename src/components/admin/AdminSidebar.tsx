import { LayoutDashboard, Palette, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
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
];

export function AdminSidebar() {
  const { user, signOut } = useAuth();

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
                      <span>{item.title}</span>
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
