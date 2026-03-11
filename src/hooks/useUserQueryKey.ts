import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns the current user's ID for use in React Query cache keys.
 * Including userId in query keys ensures per-user cache isolation,
 * preventing data flicker when switching accounts.
 */
export const useUserQueryKey = () => {
  const { user } = useAuth();
  return user?.id ?? null;
};
