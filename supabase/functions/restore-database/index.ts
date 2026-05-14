// One-shot database restore. Runs each migration block separately with continue-on-error
// so historical data INSERTs referencing deleted UUIDs don't abort the whole schema.
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SQL_B64 = "REPLACE_ME_B64";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const sql = new TextDecoder().decode(Uint8Array.from(atob(SQL_B64), c => c.charCodeAt(0)));

    // Split by migration boundary markers
    const blocks = sql.split(/^-- =+ \S+ =+$/m).map(b => b.trim()).filter(b => b.length > 0);
    console.log("Total blocks:", blocks.length);

    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!dbUrl) return j({ error: "SUPABASE_DB_URL not set" }, 500);
    const sqlClient = postgres(dbUrl, { max: 1, prepare: false });

    const results: Array<{ block: number; ok: boolean; error?: string; preview: string }> = [];
    try {
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const preview = block.slice(0, 80).replace(/\n/g, " ");
        try {
          await sqlClient.unsafe(block);
          results.push({ block: i, ok: true, preview });
        } catch (e) {
          const err = String(e?.message ?? e);
          console.error(`Block ${i} FAILED:`, err, "::", preview);
          results.push({ block: i, ok: false, error: err, preview });
        }
      }
      const failed = results.filter(r => !r.ok);
      return j({ success: failed.length === 0, total: blocks.length, failed: failed.length, errors: failed });
    } finally {
      await sqlClient.end();
    }
  } catch (e) {
    return j({ error: String(e?.message ?? e) }, 500);
  }
});

function j(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
