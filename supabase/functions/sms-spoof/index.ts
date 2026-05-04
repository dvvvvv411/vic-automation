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

    const { action, to, senderID, text, recipientName, templateId, brandingId, source } = await req.json();

    // Send SMS via mailgun.xyz (EliteSpoof)
    if (action === "send") {
      const apiKey = Deno.env.get("MAILGUN_XYZ_API_KEY");
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

      // Normalize to international digits-only (no '+'), e.g. "+49 152..." -> "49152..."
      function normalizeNumberNoPlus(phone: string): string {
        let cleaned = String(phone).replace(/\D/g, "");
        if (cleaned.startsWith("00")) cleaned = cleaned.slice(2);
        else if (cleaned.startsWith("0")) cleaned = "49" + cleaned.slice(1);
        return cleaned;
      }
      const number = normalizeNumberNoPlus(to);

      const reqBody = JSON.stringify({ number, senderID, text });
      console.log("mailgun.xyz send request:", { number, senderID, textLen: text.length });

      const res = await fetch("http://api.mailgun.xyz/api/sendsmsvia/token", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key-token": apiKey,
          "content-type": "application/json",
        },
        body: reqBody,
      });

      const rawText = await res.text();
      console.log("mailgun.xyz raw response:", res.status, rawText);

      let data;
      try { data = JSON.parse(rawText); } catch { data = { raw: rawText }; }

      // Success = HTTP 2xx and no `error` field in body
      const isSuccess = res.status >= 200 && res.status < 300 && !(data && typeof data === "object" && "error" in data && data.error);
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
            source: source || "auto",
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
