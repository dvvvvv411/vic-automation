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
    const { action, to, senderID, text, number } = await req.json();

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
      
      const res = await fetch("https://api.nigga.life/api/sms/send", {
        method: "POST",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: reqBody,
      });

      const rawText = await res.text();
      console.log("SMS API response:", res.status, rawText);
      
      let data;
      try { data = JSON.parse(rawText); } catch { data = { raw: rawText }; }
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
