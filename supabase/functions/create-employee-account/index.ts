import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GERMAN_MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
function formatDateDE(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()}. ${GERMAN_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function generatePassword(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Nicht autorisiert" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin using their token
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Nicht autorisiert" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleCheck } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .single();

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Nur Admins können Konten erstellen" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { contract_id } = await req.json();
    if (!contract_id) {
      return new Response(JSON.stringify({ error: "contract_id fehlt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get contract data
    const { data: contract, error: contractError } = await adminClient
      .from("employment_contracts")
      .select("*, applications(first_name, last_name, email, branding_id)")
      .eq("id", contract_id)
      .single();

    if (contractError || !contract) {
      return new Response(JSON.stringify({ error: "Vertrag nicht gefunden" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (contract.status === "genehmigt") {
      return new Response(JSON.stringify({ error: "Vertrag bereits genehmigt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = contract.email || (contract as any).applications?.email;
    const firstName = contract.first_name || (contract as any).applications?.first_name;
    const lastName = contract.last_name || (contract as any).applications?.last_name;

    if (!email) {
      return new Response(JSON.stringify({ error: "Keine E-Mail-Adresse vorhanden" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tempPassword = generatePassword(6);

    // Create auth user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: `${firstName} ${lastName}` },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: `Fehler beim Erstellen: ${createError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert user role
    await adminClient.from("user_roles").insert({
      user_id: newUser.user.id,
      role: "user",
    });

    // Update contract
    await adminClient.from("employment_contracts").update({
      status: "genehmigt",
      user_id: newUser.user.id,
      temp_password: tempPassword,
    }).eq("id", contract_id);

    // Generate contract PDF via Docmosis
    try {
      const generateUrl = `${supabaseUrl}/functions/v1/generate-contract`;
      const generateRes = await fetch(generateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          apikey: anonKey,
        },
        body: JSON.stringify({ contract_id }),
      });
      if (!generateRes.ok) {
        const errData = await generateRes.json();
        console.error("generate-contract error:", errData);
      }
    } catch (genErr) {
      console.error("generate-contract call failed:", genErr);
    }

    // Send email with credentials
    try {
      const brandingId = (contract as any).applications?.branding_id;
      let loginUrl = "";
      if (brandingId) {
        const { data: brandingData } = await adminClient.from("brandings").select("domain").eq("id", brandingId).single();
        if (brandingData?.domain) {
          const domain = (brandingData.domain as string).replace(/^https?:\/\//, "").replace(/\/$/, "");
          loginUrl = `https://web.${domain}/auth`;
        }
      }
      const sendEmailUrl = `${supabaseUrl}/functions/v1/send-email`;
      await fetch(sendEmailUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRoleKey}` },
        body: JSON.stringify({
          to: email,
          recipient_name: `${firstName} ${lastName}`,
          subject: "Ihre Zugangsdaten und Arbeitsvertrag",
          body_title: "Ihr Mitarbeiterkonto wurde erstellt",
          body_lines: [
            `Sehr geehrte/r ${firstName} ${lastName},`,
            "Ihre eingereichten Daten für den Arbeitsvertrag wurden genehmigt und Ihr Mitarbeiterkonto wurde erfolgreich eingerichtet.",
            `E-Mail: ${email}`,
            `Passwort: ${tempPassword}`,
            "Bitte loggen Sie sich ein und unterzeichnen Sie Ihren Arbeitsvertrag.",
            ...(contract.desired_start_date
              ? [
                  `Ihr Startdatum ist der ${formatDateDE(contract.desired_start_date)}.`,
                  "Am Morgen Ihres Startdatums finden Sie Ihren ersten Auftrag in Ihrem Dashboard.",
                ]
              : []),
          ],
          button_text: "Jetzt einloggen",
          button_url: loginUrl,
          branding_id: brandingId || null,
          event_type: "vertrag_genehmigt",
          metadata: { contract_id },
        }),
      });
    } catch (emailErr) {
      console.error("send-email call failed:", emailErr);
    }

    // Send SMS
    const phone = contract.phone || (contract as any).applications?.phone;
    if (phone) {
      try {
        // Load SMS template
        const { data: tpl } = await adminClient
          .from("sms_templates")
          .select("message")
          .eq("event_type", "vertrag_genehmigt")
          .single();

        // Load branding sms_sender_name
        const brandingId = (contract as any).applications?.branding_id;
        let smsSender = "Vic";
        if (brandingId) {
          const { data: branding } = await adminClient
            .from("brandings")
            .select("sms_sender_name")
            .eq("id", brandingId)
            .single();
          if (branding?.sms_sender_name) smsSender = branding.sms_sender_name;
        }

        // loginUrl already uses branding domain from above
        const name = `${firstName} ${lastName}`;
        const smsText = tpl?.message
          ? (tpl.message as string).replace("{name}", name).replace("{link}", loginUrl)
          : `Hallo ${name}, Ihr Arbeitsvertrag wurde genehmigt. Loggen Sie sich ein: ${loginUrl}`;

        const sendSmsUrl = `${supabaseUrl}/functions/v1/send-sms`;
        await fetch(sendSmsUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRoleKey}` },
          body: JSON.stringify({
            to: phone,
            text: smsText,
            event_type: "vertrag_genehmigt",
            recipient_name: name,
            from: smsSender,
          }),
        });
      } catch (smsErr) {
        console.error("send-sms call failed:", smsErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, temp_password: tempPassword, user_id: newUser.user.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
