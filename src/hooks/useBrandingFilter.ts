import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Provides branding-based data isolation for admin/kunde pages.
 * - `brandingIds`: array of assigned branding UUIDs (for query keys)
 * - `activeBrandingId`: single branding ID for inserts (auto-selects if only one)
 * - `setActiveBrandingId`: manually select a branding for multi-branding users
 * - `ready`: true when the hook has loaded and user is authenticated
 *
 * RLS handles all server-side filtering — this hook is for query cache keys
 * and providing branding_id for inserts.
 */
export const useBrandingFilter = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { data: brandingIds = [], isLoading } = useQuery({
    queryKey: ["user-branding-ids", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kunde_brandings" as any)
        .select("branding_id")
        .eq("user_id", userId!);
      if (error) throw error;
      return ((data as any[]) ?? []).map((d: any) => d.branding_id as string);
    },
  });

  const ready = !!userId && !isLoading;

  // Auto-select first branding for inserts if only one assigned
  const activeBrandingId = brandingIds.length === 1 ? brandingIds[0] : null;

  return {
    userId,
    brandingIds,
    activeBrandingId,
    ready,
    isLoading,
  };
};
