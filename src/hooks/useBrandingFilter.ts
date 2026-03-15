import { useBranding } from "@/contexts/BrandingContext";

/**
 * Convenience hook that exposes the active branding context.
 * All admin pages should use `activeBrandingId` for query keys and filters.
 */
export const useBrandingFilter = () => {
  const { activeBrandingId, ready, isLoading, brandings } = useBranding();
  return {
    activeBrandingId,
    ready,
    isLoading,
    brandings,
  };
};
