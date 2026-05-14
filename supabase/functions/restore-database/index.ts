// One-shot database restore function. Fetches /restore.sql from the Lovable preview
// and executes it against the database via direct postgres connection.
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const sqlUrl: string = body.sql_url;
    if (!sqlUrl) {
      return json({ error: "Missing sql_url in body" }, 400);
    }

    console.log("Fetching SQL from", sqlUrl);
    const res = await fetch(sqlUrl);
    if (!res.ok) {
      return json({ error: `Fetch failed: ${res.status}` }, 500);
    }
    const sql = await res.text();
    console.log("Fetched", sql.length, "chars of SQL");

    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!dbUrl) return json({ error: "SUPABASE_DB_URL not set" }, 500);

    const sqlClient = postgres(dbUrl, { max: 1, prepare: false });

    try {
      // Execute as a single multi-statement query. postgres.js .unsafe runs raw SQL.
      console.log("Executing SQL...");
      await sqlClient.unsafe(sql);
      console.log("Execution complete");
      return json({ success: true, chars: sql.length });
    } catch (e) {
      console.error("SQL execution error:", e);
      return json({ error: String(e?.message ?? e), stack: String(e?.stack ?? "") }, 500);
    } finally {
      await sqlClient.end();
    }
  } catch (e) {
    console.error("Handler error:", e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
