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
    const { to, text, event_type, recipient_name, from, branding_id } = await req.json();

    if (!to || !text) {
      return new Response(
        JSON.stringify({ error: "to und text sind erforderlich" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize phone number
    function normalizePhone(phone: string): string {
      let cleaned = phone.replace(/(?!^\+)\D/g, "");
      if (cleaned.startsWith("0")) {
        cleaned = "+49" + cleaned.slice(1);
      }
      if (cleaned.startsWith("49") && !cleaned.startsWith("+")) {
        cleaned = "+" + cleaned;
      }
      return cleaned;
    }

    const normalizedTo = normalizePhone(to);

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

    // Extract user id from auth header
    let createdBy: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
      const { data: { user } } = await anonClient.auth.getUser(token);
      if (user) createdBy = user.id;
    }

    // Determine sender name (max 11 alphanumeric chars for seven.io)
    const sender = from ? from.substring(0, 11) : "Vic";

    // Send SMS via seven.io
    const smsResponse = await fetch("https://gateway.seven.io/api/sms", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: normalizedTo,
        text,
        from: sender,
      }),
    });

    const smsResult = await smsResponse.text();
    console.log("seven.io raw response:", smsResult);

    let success = false;
    try {
      const parsed = JSON.parse(smsResult);
      if (typeof parsed === "number") {
        success = parsed === 100;
      } else if (typeof parsed === "object" && parsed !== null) {
        success = parsed.success === "100" || parsed.success === 100
          || (parsed.messages && parsed.messages.length > 0);
      }
    } catch {
      success = smsResult.trim().startsWith("100");
    }

    // Log to sms_logs
    await adminClient.from("sms_logs").insert({
      recipient_phone: normalizedTo,
      recipient_name: recipient_name || null,
      message: text,
      event_type: event_type || "manuell",
      status: success ? "sent" : "failed",
      error_message: success ? null : smsResult,
      created_by: createdBy,
      branding_id: branding_id || null,
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
