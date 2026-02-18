import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, text, event_type, recipient_name } = await req.json();

    if (!to || !text) {
      return new Response(
        JSON.stringify({ error: "to und text sind erforderlich" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("SEVEN_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "SEVEN_API_KEY nicht konfiguriert" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Send SMS via seven.io
    const smsResponse = await fetch("https://gateway.seven.io/api/sms", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        text,
        from: "Vic",
      }),
    });

    const smsResult = await smsResponse.text();
    const success = smsResponse.ok;

    // Log to sms_logs
    await adminClient.from("sms_logs").insert({
      recipient_phone: to,
      recipient_name: recipient_name || null,
      message: text,
      event_type: event_type || "manuell",
      status: success ? "sent" : "failed",
      error_message: success ? null : smsResult,
    });

    if (!success) {
      console.error("seven.io error:", smsResult);
      return new Response(
        JSON.stringify({ error: "SMS-Versand fehlgeschlagen", details: smsResult }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-sms error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
