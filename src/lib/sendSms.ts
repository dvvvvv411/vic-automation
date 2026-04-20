import { supabase } from "@/integrations/supabase/client";

interface SendSmsParams {
  to: string;
  text: string;
  event_type?: string;
  recipient_name?: string;
  from?: string;
  branding_id?: string | null;
}

export async function sendSms(params: SendSmsParams): Promise<boolean> {
  let data: any;
  let error: any;
  try {
    const res = await supabase.functions.invoke("send-sms", { body: params });
    data = res.data;
    error = res.error;
  } catch (err) {
    console.error("send-sms call failed:", err);
    throw new Error(`SMS-Versand fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (error) {
    console.error("send-sms error:", error);
    throw new Error(`SMS-Versand fehlgeschlagen: ${error.message || JSON.stringify(error)}`);
  }
  if (data && typeof data === "object" && "error" in data && data.error) {
    console.error("send-sms returned error:", data);
    throw new Error(`SMS-Versand fehlgeschlagen: ${data.error}`);
  }
  return true;
}
