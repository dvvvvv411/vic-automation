import { Outlet, useLocation, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { useUserRole } from "@/hooks/useUserRole";

const KUNDE_BLOCKED_PATHS = [
  "/admin/brandings",
  "/admin/emails",
  "/admin/sms",
  "/admin/telegram",
  "/admin/kunden",
  "/admin/sms-history",
];

export default function AdminLayout() {
  const { allowedPaths, loading, hasAccess } = useAdminPermissions();
  const { isKunde, loading: roleLoading } = useUserRole();
  const location = useLocation();

  if (loading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Block kunde from accessing restricted paths
  if (isKunde && KUNDE_BLOCKED_PATHS.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"))) {
    return <Navigate to="/admin" replace />;
  }

  // For /admin index route: redirect to first allowed path if no dashboard access
  if (location.pathname === "/admin" && !hasAccess("/admin")) {
    const firstAllowed = allowedPaths?.[0];
    if (firstAllowed) {
      return <Navigate to={firstAllowed} replace />;
    }
  }

  // For sub-routes: check access
  if (location.pathname !== "/admin" && !hasAccess(location.pathname)) {
    const firstAllowed = allowedPaths?.[0] ?? "/admin";
    return <Navigate to={firstAllowed} replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="border-b border-border bg-card sticky top-0 z-50 shadow-sm h-14 flex items-center px-4">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
