import { Outlet, useLocation, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { Bell, Search, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const KUNDE_BLOCKED_PATHS = [
  "/admin/brandings",
  "/admin/emails",
  "/admin/sms",
  "/admin/telegram",
  "/admin/kunden",
  "/admin/sms-history",
  "/admin/caller",
];

export default function AdminLayout() {
  const { allowedPaths, loading, hasAccess } = useAdminPermissions();
  const { isKunde, loading: roleLoading } = useUserRole();
  const { user } = useAuth();
  const location = useLocation();

  if (loading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isKunde && KUNDE_BLOCKED_PATHS.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"))) {
    return <Navigate to="/admin" replace />;
  }

  if (location.pathname === "/admin" && !hasAccess("/admin")) {
    const firstAllowed = allowedPaths?.[0];
    if (firstAllowed) {
      return <Navigate to={firstAllowed} replace />;
    }
  }

  if (location.pathname !== "/admin" && !hasAccess(location.pathname)) {
    const firstAllowed = allowedPaths?.[0] ?? "/admin";
    return <Navigate to={firstAllowed} replace />;
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "AD";

  return (
    <BrandingProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AdminSidebar />
          <div className="flex-1 flex flex-col">
            <header className="border-b border-border bg-card sticky top-0 z-50 h-16 flex items-center px-6 gap-4"
              style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
              <SidebarTrigger />
              <div className="flex-1 max-w-md mx-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Suchen..."
                    className="w-full h-9 pl-9 pr-4 rounded-lg bg-muted/60 border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    readOnly
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                </button>
                <button className="p-2 rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors">
                  <Settings className="h-5 w-5" />
                </button>
                <Avatar className="h-8 w-8 ml-1">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </header>
            <main className="flex-1 p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </BrandingProvider>
  );
}
