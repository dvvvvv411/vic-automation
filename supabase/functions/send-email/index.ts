import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  to: string;
  recipient_name?: string;
  subject: string;
  body_title: string;
  body_lines: string[];
  button_text?: string;
  button_url?: string;
  branding_id?: string;
  event_type: string;
  metadata?: Record<string, unknown>;
}

async function fetchLogoAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const contentType = res.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

function buildEmailHtml(opts: {
  companyName: string;
  logoDataUri: string | null;
  brandColor: string;
  bodyTitle: string;
  bodyLines: string[];
  buttonText?: string;
  buttonUrl?: string;
  footerAddress: string;
}): string {
  const { companyName, logoDataUri, brandColor, bodyTitle, bodyLines, buttonText, buttonUrl, footerAddress } = opts;

  const linesHtml = bodyLines
    .map((line) => `<p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#374151;">${line}</p>`)
    .join("\n");

  const buttonHtml = buttonText && buttonUrl
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
        <tr>
          <td style="border-radius:6px;background-color:${brandColor};">
            <a href="${buttonUrl}" target="_blank" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">${buttonText}</a>
          </td>
        </tr>
      </table>`
    : "";

  const logoHtml = logoDataUri
    ? `<img src="${logoDataUri}" alt="${companyName}" style="max-height:48px;max-width:180px;" />`
    : `<span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${companyName}</span>`;

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f3f4f6;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;">

<!-- Header -->
<tr>
  <td style="background-color:${brandColor};padding:28px 32px;border-radius:8px 8px 0 0;" align="center">
    ${logoHtml}
  </td>
</tr>

<!-- Body -->
<tr>
  <td style="background-color:#ffffff;padding:36px 32px 28px 32px;">
    <h1 style="margin:0 0 20px 0;font-size:20px;font-weight:700;color:#111827;line-height:1.3;">${bodyTitle}</h1>
    ${linesHtml}
    ${buttonHtml}
  </td>
</tr>

<!-- Footer -->
<tr>
  <td style="background-color:#f9fafb;padding:20px 32px;border-radius:0 0 8px 8px;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">${companyName}</p>
    ${footerAddress ? `<p style="margin:4px 0 0 0;font-size:12px;color:#9ca3af;line-height:1.5;">${footerAddress}</p>` : ""}
  </td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body: EmailRequest = await req.json();
    const { to, recipient_name, subject, body_title, body_lines, button_text, button_url, branding_id, event_type, metadata } = body;

    if (!to || !subject || !event_type) {
      return new Response(JSON.stringify({ error: "to, subject und event_type erforderlich" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load branding
    let branding: any = null;
    if (branding_id) {
      const { data } = await adminClient
        .from("brandings")
        .select("company_name, logo_url, brand_color, street, zip_code, city, resend_api_key, resend_from_email, resend_from_name")
        .eq("id", branding_id)
        .single();
      branding = data;
    }

    const resendApiKey = branding?.resend_api_key;
    if (!resendApiKey) {
      // Log as failed and return
      await adminClient.from("email_logs").insert({
        event_type,
        recipient_email: to,
        recipient_name: recipient_name || null,
        subject,
        branding_id: branding_id || null,
        status: "failed",
        error_message: "Keine Resend API-Konfiguration fuer dieses Branding vorhanden",
        metadata: metadata || {},
      });
      return new Response(JSON.stringify({ error: "Keine Resend-Konfiguration vorhanden" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const companyName = branding?.company_name || "Unternehmen";
    const brandColor = branding?.brand_color || "#3B82F6";
    const fromEmail = branding?.resend_from_email || "noreply@example.com";
    const fromName = branding?.resend_from_name || companyName;
    const footerParts = [branding?.street, `${branding?.zip_code || ""} ${branding?.city || ""}`.trim()].filter(Boolean);
    const footerAddress = footerParts.join(", ");

    // Fetch logo as base64
    let logoDataUri: string | null = null;
    if (branding?.logo_url) {
      logoDataUri = await fetchLogoAsBase64(branding.logo_url);
    }

    const html = buildEmailHtml({
      companyName,
      logoDataUri,
      brandColor,
      bodyTitle: body_title,
      bodyLines: body_lines || [],
      buttonText: button_text,
      buttonUrl: button_url,
      footerAddress,
    });

    // Send via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        html,
      }),
    });

    const resendResult = await resendRes.json();

    if (!resendRes.ok) {
      await adminClient.from("email_logs").insert({
        event_type,
        recipient_email: to,
        recipient_name: recipient_name || null,
        subject,
        branding_id: branding_id || null,
        status: "failed",
        error_message: resendResult?.message || JSON.stringify(resendResult),
        metadata: metadata || {},
      });
      return new Response(JSON.stringify({ error: resendResult?.message || "Resend Fehler" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log success
    await adminClient.from("email_logs").insert({
      event_type,
      recipient_email: to,
      recipient_name: recipient_name || null,
      subject,
      branding_id: branding_id || null,
      status: "sent",
      metadata: metadata || {},
    });

    return new Response(JSON.stringify({ success: true, resend_id: resendResult.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-email error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
