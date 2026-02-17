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

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response(
        JSON.stringify({ error: "Content-Type must be multipart/form-data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formData = await req.formData();

    const first_name = (formData.get("first_name") as string)?.trim();
    const last_name = (formData.get("last_name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim() || null;
    const street = (formData.get("street") as string)?.trim() || null;
    const zip_code = (formData.get("zip_code") as string)?.trim() || null;
    const city = (formData.get("city") as string)?.trim() || null;
    const employment_type = (formData.get("employment_type") as string)?.trim();
    const branding_id = (formData.get("branding_id") as string)?.trim() || null;
    const resume = formData.get("resume") as File | null;

    // Validate required fields
    const missing: string[] = [];
    if (!first_name) missing.push("first_name");
    if (!last_name) missing.push("last_name");
    if (!email) missing.push("email");
    if (!employment_type) missing.push("employment_type");

    if (missing.length > 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields", fields: missing }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate employment_type
    const validTypes = ["minijob", "teilzeit", "vollzeit"];
    if (!validTypes.includes(employment_type!)) {
      return new Response(
        JSON.stringify({ error: "Invalid employment_type. Must be: minijob, teilzeit, or vollzeit" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validate branding_id if provided
    if (branding_id) {
      const { data: branding, error: brandingError } = await supabase
        .from("brandings")
        .select("id")
        .eq("id", branding_id)
        .maybeSingle();

      if (brandingError || !branding) {
        return new Response(
          JSON.stringify({ error: "Invalid branding_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Upload resume if provided
    let resume_url: string | null = null;

    if (resume && resume.size > 0) {
      // Validate file type
      if (resume.type !== "application/pdf") {
        return new Response(
          JSON.stringify({ error: "Resume must be a PDF file" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Max 10MB
      if (resume.size > 10 * 1024 * 1024) {
        return new Response(
          JSON.stringify({ error: "Resume file too large (max 10MB)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const fileExt = "pdf";
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("application-documents")
        .upload(filePath, resume, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return new Response(
          JSON.stringify({ error: "Failed to upload resume" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from("application-documents")
        .getPublicUrl(filePath);

      resume_url = publicUrlData.publicUrl;
    }

    // Insert application
    const { data: application, error: insertError } = await supabase
      .from("applications")
      .insert({
        first_name: first_name!,
        last_name: last_name!,
        email: email!,
        phone,
        street,
        zip_code,
        city,
        employment_type: employment_type!,
        branding_id: branding_id || null,
        resume_url,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create application" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, application_id: application.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
