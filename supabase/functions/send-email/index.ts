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
  footer_lines?: string[];
  branding_id?: string;
  event_type: string;
  metadata?: Record<string, unknown>;
}


function buildEmailHtml(opts: {
  companyName: string;
  brandColor: string;
  bodyTitle: string;
  bodyLines: string[];
  buttonText?: string;
  buttonUrl?: string;
  footerLines?: string[];
  footerAddress: string;
  footerDetails?: { managingDirector?: string; phone?: string; registerCourt?: string; tradeRegister?: string; vatId?: string };
}): string {
  const { companyName, brandColor, bodyTitle, bodyLines, buttonText, buttonUrl, footerLines, footerAddress, footerDetails } = opts;

  // Detect "info" lines (containing : like "E-Mail: ...", "Auftrag: ...", "Datum: ...")
  const linesHtml = bodyLines
    .map((line) => {
      const isInfoLine = /^(E-Mail|Passwort|Auftrag|Datum|Uhrzeit|Startdatum|Ihr Startdatum):/i.test(line.trim());
      if (isInfoLine) {
        return `<div style="margin:4px 0;padding:10px 14px;background-color:#f8fafc;border-left:3px solid ${brandColor};border-radius:0 6px 6px 0;font-size:14px;line-height:1.5;color:#1e293b;font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;">${line}</div>`;
      }
      return `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#374151;">${line}</p>`;
    })
    .join("\n");

  const buttonHtml = buttonText && buttonUrl
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 8px 0;">
        <tr>
          <td style="border-radius:8px;background-color:${brandColor};box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -2px rgba(0,0,0,0.1);">
            <a href="${buttonUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.2px;">${buttonText}</a>
          </td>
        </tr>
      </table>`
    : "";

  const logoHtml = `<span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${companyName}</span>`;

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9;">
<tr><td align="center" style="padding:48px 16px;">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.08),0 8px 10px -6px rgba(0,0,0,0.04);">

<!-- Header -->
<tr>
  <td style="background-color:${brandColor};padding:40px 32px;text-align:center;">
    ${logoHtml}
  </td>
</tr>

<!-- Body -->
<tr>
  <td style="background-color:#ffffff;padding:40px 36px 20px 36px;">
    <h1 style="margin:0 0 24px 0;font-size:21px;font-weight:700;color:#0f172a;line-height:1.3;letter-spacing:-0.3px;">${bodyTitle}</h1>
    ${linesHtml}
    ${buttonHtml}
  </td>
</tr>

<!-- Footer -->
<tr>
  <td style="background-color:#ffffff;padding:0 36px 32px 36px;">
    ${(footerLines || []).map((line) => `<p style="margin:12px 0 0 0;font-size:14px;line-height:1.6;color:#374151;">${line}</p>`).join("\n")}
    <div style="margin:28px 0 0 0;padding:20px 0 0 0;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:13px;line-height:1.5;color:#94a3b8;">${companyName}${footerAddress ? ` · ${footerAddress}` : ""}</p>
      ${(() => {
        if (!footerDetails) return "";
        const line2Parts: string[] = [];
        if (footerDetails.managingDirector) line2Parts.push(`Geschäftsführer: ${footerDetails.managingDirector}`);
        if (footerDetails.phone) line2Parts.push(`Tel: ${footerDetails.phone}`);
        const line3Parts: string[] = [];
        if (footerDetails.registerCourt) line3Parts.push(`Amtsgericht: ${footerDetails.registerCourt}`);
        if (footerDetails.tradeRegister) line3Parts.push(footerDetails.tradeRegister);
        if (footerDetails.vatId) line3Parts.push(`USt-ID: ${footerDetails.vatId}`);
        let html = "";
        if (line2Parts.length) html += `<p style="margin:4px 0 0 0;font-size:13px;line-height:1.5;color:#94a3b8;">${line2Parts.join(" · ")}</p>`;
        if (line3Parts.length) html += `<p style="margin:4px 0 0 0;font-size:13px;line-height:1.5;color:#94a3b8;">${line3Parts.join(" · ")}</p>`;
        return html;
      })()}
    </div>
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
    const { to, recipient_name, subject, body_title, body_lines, button_text, button_url, footer_lines, branding_id, event_type, metadata } = body;

    if (!to || !subject || !event_type) {
      return new Response(JSON.stringify({ error: "to, subject und event_type erforderlich" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load branding – resolve from branding_id or fallback via contract_id in metadata
    let effectiveBrandingId = branding_id || null;

    if (!effectiveBrandingId && metadata?.contract_id) {
      // Resolve branding from profiles first, then employment_contracts
      const contractId = metadata.contract_id as string;
      const { data: contractRow } = await adminClient
        .from("employment_contracts")
        .select("branding_id, user_id")
        .eq("id", contractId)
        .single();

      if (contractRow?.user_id) {
        const { data: profile } = await adminClient
          .from("profiles")
          .select("branding_id")
          .eq("id", contractRow.user_id)
          .single();
        effectiveBrandingId = profile?.branding_id ?? contractRow.branding_id ?? null;
      } else {
        effectiveBrandingId = contractRow?.branding_id ?? null;
      }
    }

    let branding: any = null;
    if (effectiveBrandingId) {
      const { data } = await adminClient
        .from("brandings")
        .select("company_name, logo_url, brand_color, street, zip_code, city, resend_api_key, resend_from_email, resend_from_name, managing_director, phone, register_court, trade_register, vat_id")
        .eq("id", effectiveBrandingId)
        .single();
      branding = data;
    }

    const resendApiKey = branding?.resend_api_key;
    if (!resendApiKey) {
      await adminClient.from("email_logs").insert({
        event_type,
        recipient_email: to,
        recipient_name: recipient_name || null,
        subject,
        branding_id: effectiveBrandingId || null,
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

    const html = buildEmailHtml({
      companyName,
      brandColor,
      bodyTitle: body_title,
      bodyLines: body_lines || [],
      buttonText: button_text,
      buttonUrl: button_url,
      footerLines: footer_lines,
      footerAddress,
    });

    // Build Resend payload
    const resendPayload: any = {
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html,
    };

    // Send via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(resendPayload),
    });

    const resendResult = await resendRes.json();

    if (!resendRes.ok) {
      await adminClient.from("email_logs").insert({
        event_type,
        recipient_email: to,
        recipient_name: recipient_name || null,
        subject,
        branding_id: effectiveBrandingId || null,
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
      branding_id: effectiveBrandingId || null,
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
