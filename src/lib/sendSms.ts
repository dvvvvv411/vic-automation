import { supabase } from "@/integrations/supabase/client";

interface SendSmsParams {
  to: string;
  text: string;
  event_type?: string;
  recipient_name?: string;
  from?: string;
}

export async function sendSms(params: SendSmsParams): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke("send-sms", {
      body: params,
    });
    if (error) {
      console.error("send-sms error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("send-sms call failed:", err);
    return false;
  }
}
