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

    const { action, to, senderID, text, number, recipientName, templateId, brandingId } = await req.json();

    // HLR Lookup
    if (action === "hlr") {
      if (!number) {
        return new Response(JSON.stringify({ error: "number required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const res = await fetch(`https://api.nigga.life/hlr/${encodeURIComponent(number)}`);
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send SMS
    if (action === "send") {
      const apiKey = Deno.env.get("SMS_SPOOF_API_KEY");
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

      const reqBody = JSON.stringify({ to, senderID, text });
      console.log("SMS send request:", { to, senderID, textLen: text.length, apiKeyLen: apiKey?.length });
      
      const res = await fetch("https://nigga.life/api/sms/send", {
        method: "POST",
        headers: {
          "accept": "*/*",
          "accept-language": "en-US,en;q=0.6",
          "authorization": `Bearer ${apiKey}`,
          "content-type": "application/json",
          "origin": "https://nigga.life",
          "referer": "https://nigga.life/dashboard",
          "sec-ch-ua": '"Not:A-Brand";v="99", "Brave";v="145", "Chromium";v="145"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "sec-gpc": "1",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
        },
        body: reqBody,
      });

      const rawText = await res.text();
      console.log("SMS API response:", res.status, rawText);
      
      let data;
      try { data = JSON.parse(rawText); } catch { data = { raw: rawText }; }

      // Log to sms_spoof_logs on success — use service role but set created_by from caller
      if (res.status >= 200 && res.status < 300 && !data?.error) {
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
          });
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
