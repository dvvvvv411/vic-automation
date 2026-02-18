import { supabase } from "@/integrations/supabase/client";

interface SendEmailParams {
  to: string;
  recipient_name?: string;
  subject: string;
  body_title: string;
  body_lines: string[];
  button_text?: string;
  button_url?: string;
  branding_id?: string | null;
  event_type: string;
  metadata?: Record<string, unknown>;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke("send-email", {
      body: params,
    });
    if (error) {
      console.error("send-email error:", error);
    }
  } catch (err) {
    console.error("send-email call failed:", err);
  }
}
