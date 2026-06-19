import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const brandingId = "a49c0302-65a5-4e87-b873-5a5757f41057";
  const all: any[] = [];
  let from = 0;
  const size = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("applications")
      .select("first_name,last_name,email,phone,created_at,interview_appointments(id)")
      .eq("branding_id", brandingId)
      .order("created_at", { ascending: false })
      .range(from, from + size - 1);
    if (error) return new Response(error.message, { status: 500 });
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < size) break;
    from += size;
  }

  const lines = all
    .filter((a: any) => !a.interview_appointments || a.interview_appointments.length === 0)
    .map((a: any) => `${a.first_name} ${a.last_name} ${a.email} ${a.phone}`)
    .join("\n");

  return new Response(lines, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
});
