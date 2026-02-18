import { supabase } from "@/integrations/supabase/client";

/**
 * Builds a URL using the branding's domain with a `web.` subdomain prefix.
 * Falls back to window.location.origin if no branding or domain is available.
 */
export async function buildBrandingUrl(brandingId: string | null | undefined, path: string): Promise<string> {
  if (brandingId) {
    const { data } = await supabase
      .from("brandings")
      .select("domain")
      .eq("id", brandingId)
      .single();
    if (data?.domain) {
      const domain = data.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
      return `https://web.${domain}${path}`;
    }
  }
  return `${window.location.origin}${path}`;
}
