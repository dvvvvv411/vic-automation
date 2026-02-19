import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AdminPermissions {
  allowedPaths: string[] | null;
  loading: boolean;
  hasAccess: (path: string) => boolean;
}

export const useAdminPermissions = (): AdminPermissions => {
  const { user } = useAuth();
  const [allowedPaths, setAllowedPaths] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAllowedPaths(null);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data, error } = await supabase
        .from("admin_permissions" as any)
        .select("allowed_path")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching admin permissions:", error);
        setAllowedPaths(null);
      } else if (!data || data.length === 0) {
        // No entries = full access
        setAllowedPaths(null);
      } else {
        setAllowedPaths((data as any[]).map((d) => d.allowed_path));
      }
      setLoading(false);
    };

    fetch();
  }, [user]);

  const hasAccess = (path: string): boolean => {
    if (loading) return false;
    if (allowedPaths === null) return true;
    return allowedPaths.includes(path);
  };

  return { allowedPaths, loading, hasAccess };
};
