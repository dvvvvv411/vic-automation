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

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleCheck } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Nur Admins" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all kunde user_ids
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "kunde");

    const userIds = (roles ?? []).map((r: any) => r.user_id);
    if (!userIds.length) {
      return new Response(JSON.stringify({ kunden: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch auth users (paginate to be safe)
    const emailMap: Record<string, string> = {};
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
      if (error) break;
      for (const u of data.users) {
        if (u.email) emailMap[u.id] = u.email;
      }
      if (data.users.length < perPage) break;
      page++;
      if (page > 20) break;
    }

    const kunden = userIds.map((uid) => ({
      id: uid,
      email: emailMap[uid] ?? null,
    }));

    return new Response(JSON.stringify({ kunden }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("list-kunden error:", err);
    return new Response(JSON.stringify({ error: "Interner Fehler" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
