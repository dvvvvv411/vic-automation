import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const db = createClient(supabaseUrl, serviceRoleKey);

    // Load templates
    const { data: templates } = await db
      .from("sms_templates")
      .select("event_type, message")
      .in("event_type", ["gespraech_erinnerung_auto", "probetag_erinnerung_auto"]);

    const templateMap: Record<string, string> = {};
    for (const t of templates ?? []) {
      templateMap[t.event_type] = t.message;
    }

    const now = new Date();
    const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Format as YYYY-MM-DD
    const formatDate = (d: Date) => d.toISOString().split("T")[0];
    const todayStr = formatDate(now);
    const tomorrowStr = formatDate(in25h);

    let sentCount = 0;

    // --- Interview appointments ---
    const { data: interviews } = await db
      .from("interview_appointments")
      .select("id, appointment_date, appointment_time, application_id, applications!inner(first_name, last_name, phone, branding_id)")
      .eq("reminder_sent", false)
      .eq("status", "neu")
      .gte("appointment_date", todayStr)
      .lte("appointment_date", tomorrowStr);

    for (const apt of interviews ?? []) {
      const aptDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
      if (aptDateTime <= now || aptDateTime > in25h) continue;

      const app = (apt as any).applications;
      if (!app?.phone) continue;

      const template = templateMap["gespraech_erinnerung_auto"];
      if (!template) continue;

      // Get branding sms_sender_name
      let senderName: string | undefined;
      if (app.branding_id) {
        const { data: branding } = await db
          .from("brandings")
          .select("sms_sender_name")
          .eq("id", app.branding_id)
          .single();
        senderName = branding?.sms_sender_name || undefined;
      }

      const name = `${app.first_name} ${app.last_name}`.trim();
      const uhrzeit = apt.appointment_time?.substring(0, 5) || "";
      const datum = apt.appointment_date || "";
      const text = template
        .replace(/{name}/g, name)
        .replace(/{uhrzeit}/g, uhrzeit)
        .replace(/{datum}/g, datum);

      // Call send-sms edge function
      const smsRes = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          to: app.phone,
          text,
          event_type: "gespraech_erinnerung_auto",
          recipient_name: name,
          from: senderName,
          branding_id: app.branding_id || null,
        }),
      });

      if (smsRes.ok) {
        await db
          .from("interview_appointments")
          .update({ reminder_sent: true } as any)
          .eq("id", apt.id);
        sentCount++;
        console.log(`Reminder sent for interview ${apt.id}`);
      } else {
        console.error(`Failed to send reminder for interview ${apt.id}:`, await smsRes.text());
      }
    }

    // --- Trial day appointments ---
    const { data: trials } = await db
      .from("trial_day_appointments")
      .select("id, appointment_date, appointment_time, application_id, applications!inner(first_name, last_name, phone, branding_id)")
      .eq("reminder_sent", false)
      .eq("status", "neu")
      .gte("appointment_date", todayStr)
      .lte("appointment_date", tomorrowStr);

    for (const apt of trials ?? []) {
      const aptDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
      if (aptDateTime <= now || aptDateTime > in25h) continue;

      const app = (apt as any).applications;
      if (!app?.phone) continue;

      const template = templateMap["probetag_erinnerung_auto"];
      if (!template) continue;

      let senderName: string | undefined;
      if (app.branding_id) {
        const { data: branding } = await db
          .from("brandings")
          .select("sms_sender_name")
          .eq("id", app.branding_id)
          .single();
        senderName = branding?.sms_sender_name || undefined;
      }

      const name = `${app.first_name} ${app.last_name}`.trim();
      const uhrzeit = apt.appointment_time?.substring(0, 5) || "";
      const datum = apt.appointment_date || "";
      const text = template
        .replace(/{name}/g, name)
        .replace(/{uhrzeit}/g, uhrzeit)
        .replace(/{datum}/g, datum);

      const smsRes = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          to: app.phone,
          text,
          event_type: "probetag_erinnerung_auto",
          recipient_name: name,
          from: senderName,
          branding_id: app.branding_id || null,
        }),
      });

      if (smsRes.ok) {
        await db
          .from("trial_day_appointments")
          .update({ reminder_sent: true } as any)
          .eq("id", apt.id);
        sentCount++;
        console.log(`Reminder sent for trial day ${apt.id}`);
      } else {
        console.error(`Failed to send reminder for trial day ${apt.id}:`, await smsRes.text());
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: sentCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-appointment-reminders error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
