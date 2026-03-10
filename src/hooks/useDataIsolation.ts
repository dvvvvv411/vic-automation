import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook that provides the current user's ID for data isolation.
 * All admin page queries should use addFilter() to scope data to the current user.
 * RLS handles the actual security — this is for explicit query filtering.
 */
export const useDataIsolation = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  /**
   * Adds .eq("created_by", userId) to a Supabase query builder.
   * Since RLS already enforces isolation, this is a safety net + performance optimization.
   */
  const addFilter = <T extends { eq: (col: string, val: string) => T }>(query: T): T => {
    if (!userId) return query;
    return query.eq("created_by", userId);
  };

  return { userId, addFilter };
};
