import { supabase } from "@/integrations/supabase/client";

export async function sendTelegram(eventType: string, message: string) {
  try {
    await supabase.functions.invoke("send-telegram", {
      body: { event_type: eventType, message },
    });
  } catch (e) {
    console.error("Telegram notification failed:", e);
  }
}
