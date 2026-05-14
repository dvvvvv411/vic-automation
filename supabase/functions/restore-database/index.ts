import postgres from "npm:postgres@3.4.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!dbUrl) throw new Error("SUPABASE_DB_URL not set");

    // Load embedded SQL (base64 to avoid escaping issues)
    const b64Url = new URL("./sql.b64.txt", import.meta.url);
    const b64 = await Deno.readTextFile(b64Url).then((s) => s.replace(/\s/g, ""));
    const sqlText = new TextDecoder().decode(
      Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    );

    // Split by migration header markers
    const parts = sqlText.split(/^-- =+ /m).filter((p) => p.trim().length > 0);

    const sql = postgres(dbUrl, { max: 1, prepare: false, ssl: "require" });

    const results: { name: string; ok: boolean; error?: string }[] = [];
    let okCount = 0, failCount = 0;

    for (const part of parts) {
      const firstLine = part.split("\n")[0].trim();
      const name = firstLine.replace(/=+$/, "").trim() || "preamble";
      const body = part.replace(/^[^\n]*\n/, "").trim();
      if (!body) continue;
      try {
        await sql.unsafe(body);
        results.push({ name, ok: true });
        okCount++;
      } catch (e) {
        results.push({ name, ok: false, error: String(e?.message || e).slice(0, 500) });
        failCount++;
      }
    }

    await sql.end();

    return new Response(
      JSON.stringify({ summary: { ok: okCount, fail: failCount, total: results.length }, results }, null, 2),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
