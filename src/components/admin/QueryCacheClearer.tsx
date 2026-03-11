import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Clears the React Query cache whenever the authenticated user changes.
 * This prevents stale data from a previous user session from being shown
 * briefly (flicker) when a new user logs in.
 */
export default function QueryCacheClearer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const prevUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const currentId = user?.id ?? null;
    // On first mount, just record the user id
    if (prevUserId.current === undefined) {
      prevUserId.current = currentId;
      return;
    }
    // If user changed (login/logout/switch), clear all cached data
    if (prevUserId.current !== currentId) {
      queryClient.clear();
      prevUserId.current = currentId;
    }
  }, [user?.id, queryClient]);

  return null;
}
