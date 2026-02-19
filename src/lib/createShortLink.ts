import { supabase } from "@/integrations/supabase/client";
import { buildBrandingUrl } from "@/lib/buildBrandingUrl";

function generateCode(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createShortLink(
  targetUrl: string,
  brandingId: string | null | undefined
): Promise<string> {
  const code = generateCode();
  const { error } = await supabase
    .from("short_links" as any)
    .insert({ code, target_url: targetUrl } as any);
  if (error) throw error;
  return buildBrandingUrl(brandingId, `/r/${code}`);
}
