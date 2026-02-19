import { Outlet, useLocation, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";

export default function AdminLayout() {
  const { allowedPaths, loading, hasAccess } = useAdminPermissions();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
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
