import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

interface BrandingOption {
  id: string;
  company_name: string;
  logo_url: string | null;
}

interface BrandingContextType {
  brandings: BrandingOption[];
  activeBrandingId: string | null;
  setActiveBrandingId: (id: string) => void;
  ready: boolean;
  isLoading: boolean;
}

const BrandingContext = createContext<BrandingContextType>({
  brandings: [],
  activeBrandingId: null,
  setActiveBrandingId: () => {},
  ready: false,
  isLoading: true,
});

export const useBranding = () => useContext(BrandingContext);

const STORAGE_KEY = "vic-active-branding-id";

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isAdmin, isKunde, isCaller, loading: roleLoading } = useUserRole();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const [activeBrandingId, setActiveBrandingIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );

  const { data: brandings = [], isLoading } = useQuery({
    queryKey: ["available-brandings", userId, isAdmin, isKunde],
    enabled: !!userId && !roleLoading,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (isAdmin) {
        // Admin sees ALL brandings
        const { data, error } = await supabase
          .from("brandings")
          .select("id, company_name, logo_url")
          .order("company_name");
        if (error) throw error;
        return data ?? [];
      }
      // Kunde: only assigned brandings
      const { data: assignments, error: aErr } = await supabase
        .from("kunde_brandings")
        .select("branding_id")
        .eq("user_id", userId!);
      if (aErr) throw aErr;
      const ids = (assignments ?? []).map((a) => a.branding_id);
      if (!ids.length) return [];
      const { data, error } = await supabase
        .from("brandings")
        .select("id, company_name, logo_url")
        .in("id", ids)
        .order("company_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Auto-select first branding if stored one is invalid
  useEffect(() => {
    if (isLoading || !brandings.length) return;
    const valid = brandings.some((b) => b.id === activeBrandingId);
    if (!valid) {
      const first = brandings[0].id;
      setActiveBrandingIdState(first);
      localStorage.setItem(STORAGE_KEY, first);
    }
  }, [brandings, activeBrandingId, isLoading]);

  const setActiveBrandingId = useCallback(
    (id: string) => {
      setActiveBrandingIdState(id);
      localStorage.setItem(STORAGE_KEY, id);
      // Invalidate all queries to refetch with new branding
      queryClient.invalidateQueries();
    },
    [queryClient]
  );

  const ready = !!userId && !isLoading && !roleLoading && !!activeBrandingId;

  return (
    <BrandingContext.Provider
      value={{ brandings, activeBrandingId, setActiveBrandingId, ready, isLoading }}
    >
      {children}
    </BrandingContext.Provider>
  );
}
