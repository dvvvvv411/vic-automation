import { supabase } from "@/integrations/supabase/client";

export async function sendTelegram(eventType: string, message: string, brandingId?: string | null) {
  try {
    await supabase.functions.invoke("send-telegram", {
      body: { event_type: eventType, message, branding_id: brandingId || undefined },
    });
  } catch (e) {
    console.error("Telegram notification failed:", e);
  }
}
