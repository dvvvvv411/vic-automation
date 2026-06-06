import { supabase } from "@/integrations/supabase/client";

/**
 * Builds a URL for branding-aware email/link contexts.
 * - If `custom_email_link_enabled` is true and `custom_email_link` is set,
 *   returns `https://{custom_email_link}{path}` (custom link wins, no prefix).
 * - Otherwise returns `https://{subdomain_prefix}.{domain}{path}`.
 * - Falls back to `window.location.origin` if no domain available.
 */
export async function buildBrandingUrl(brandingId: string | null | undefined, path: string): Promise<string> {
  if (brandingId) {
    const { data } = await supabase
      .from("brandings")
      .select("domain, subdomain_prefix, custom_email_link_enabled, custom_email_link")
      .eq("id", brandingId)
      .single();

    const customEnabled = (data as any)?.custom_email_link_enabled;
    const customLinkRaw = (data as any)?.custom_email_link as string | null | undefined;
    if (customEnabled && customLinkRaw && customLinkRaw.trim()) {
      const customLink = customLinkRaw.replace(/^https?:\/\//, "").replace(/\/$/, "").trim();
      return `https://${customLink}${path}`;
    }

    if (data?.domain) {
      const domain = data.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
      const prefix = data.subdomain_prefix || "web";
      return `https://${prefix}.${domain}${path}`;
    }
  }
  return `${window.location.origin}${path}`;
}
