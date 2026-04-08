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
    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sbUrl = Deno.env.get("SUPABASE_URL")!;
    const sbAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(sbUrl, sbAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerUserId = claimsData.claims.sub;

    const { action, to, senderID, text, recipientName, templateId, brandingId } = await req.json();

    // Send SMS via LimitlessTXT
    if (action === "send") {
      const apiKey = Deno.env.get("LIMITLESSTXT_API_KEY");
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "API key not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!to || !senderID || !text) {
        return new Response(JSON.stringify({ error: "to, senderID, text required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const reqBody = JSON.stringify({
        numbers: [to],
        content: text,
        sender_id: senderID,
        route: 7,
      });
      console.log("SMS send request:", { to, senderID, textLen: text.length });

      const res = await fetch("https://api.limitlesstxt.com/v1/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: reqBody,
      });

      const rawText = await res.text();
      console.log("SMS API response:", res.status, rawText);

      let data;
      try { data = JSON.parse(rawText); } catch { data = { raw: rawText }; }

      // Log to sms_spoof_logs on success
      const isSuccess = res.status >= 200 && res.status < 300 && data?.success === true;
      if (isSuccess) {
        try {
          const sbServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const sb = createClient(sbUrl, sbServiceKey);
          await sb.from("sms_spoof_logs").insert({
            recipient_phone: to,
            recipient_name: recipientName || null,
            sender_name: senderID,
            message: text,
            template_id: templateId || null,
            created_by: callerUserId,
            branding_id: brandingId || null,
          });

          // Decrement spoof_credits atomically (only if spoof_credits IS NOT NULL)
          if (brandingId) {
            await sb.rpc("decrement_spoof_credits", { _branding_id: brandingId });
          }
        } catch (logErr) {
          console.error("Failed to log SMS:", logErr);
        }
      }

      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
