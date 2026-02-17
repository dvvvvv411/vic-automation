import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// 1x1 white PNG as placeholder for unsigned contract
const WHITE_IMAGE_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function todayFormatted(): string {
  return new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

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
    const docmosisKey = Deno.env.get("DOCMOSIS_API_KEY")!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { contract_id, signature_data } = await req.json();
    if (!contract_id) {
      return new Response(JSON.stringify({ error: "contract_id fehlt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load contract + application + branding
    const { data: contract, error: contractError } = await adminClient
      .from("employment_contracts")
      .select("*, applications(first_name, last_name, email, branding_id, employment_type)")
      .eq("id", contract_id)
      .single();

    if (contractError || !contract) {
      return new Response(JSON.stringify({ error: "Vertrag nicht gefunden" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get branding
    const brandingId = (contract as any).applications?.branding_id;
    let branding: any = null;
    if (brandingId) {
      const { data: b } = await adminClient
        .from("brandings")
        .select("company_name, street, zip_code, city, managing_director")
        .eq("id", brandingId)
        .single();
      branding = b;
    }

    // Select template based on employment_type
    const employmentType = contract.employment_type || (contract as any).applications?.employment_type || "minijob";
    const templateMap: Record<string, string> = {
      minijob: "Arbeitsvertrag_Vorlage_Minijob.docx",
      teilzeit: "Arbeitsvertrag_Vorlage_Teilzeit.docx",
      vollzeit: "Arbeitsvertrag_Vorlage_Vollzeit.docx",
    };
    const templateName = templateMap[employmentType] || templateMap.minijob;

    // Build VicUnterschrift
    const vicUnterschrift = signature_data
      ? `image:base64:${signature_data}`
      : `image:base64:${WHITE_IMAGE_BASE64}`;

    // Build Docmosis data
    const docmosisData = {
      Unternehmensname: branding?.company_name || "",
      Unternehmensadresse: branding?.street || "",
      Unternehmensplzstadt: `${branding?.zip_code || ""} ${branding?.city || ""}`.trim(),
      Vic_Vorname: contract.first_name || "",
      Vic_Nachname: contract.last_name || "",
      Vic_Geburtsdatum: formatDate(contract.birth_date),
      Vic_Geburtsort: contract.birth_place || "",
      Vic_Adresse: contract.street || "",
      Vic_PlzStadt: `${contract.zip_code || ""} ${contract.city || ""}`.trim(),
      Vic_Nationalitaet: contract.nationality || "",
      Vic_Sozialversicherungsnummer: contract.social_security_number || "",
      Vic_SteuerID: contract.tax_id || "",
      Vic_Familienstand: contract.marital_status || "",
      Startzeitpunkt: formatDate(contract.desired_start_date),
      Unternehmensstadt: branding?.city || "",
      heutiges_Datum: todayFormatted(),
      VicUnterschrift: vicUnterschrift,
      Geschaeftsfuehrer: branding?.managing_director || "",
    };

    const outputName = signature_data
      ? `signed_${contract_id}.pdf`
      : `Arbeitsvertrag_${contract_id}.pdf`;

    // Call Docmosis API
    const docmosisResponse = await fetch("https://eu1.dws4.docmosis.com/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessKey: docmosisKey,
        templateName,
        outputName,
        data: docmosisData,
      }),
    });

    if (!docmosisResponse.ok) {
      const errorText = await docmosisResponse.text();
      console.error("Docmosis error:", errorText);
      return new Response(JSON.stringify({ error: `Docmosis Fehler: ${errorText}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pdfBuffer = await docmosisResponse.arrayBuffer();
    const storagePath = `contracts/${outputName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await adminClient.storage
      .from("contract-documents")
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(JSON.stringify({ error: `Storage Fehler: ${uploadError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: urlData } = adminClient.storage
      .from("contract-documents")
      .getPublicUrl(storagePath);

    const pdfUrl = urlData.publicUrl;

    // Update DB
    if (signature_data) {
      await adminClient
        .from("employment_contracts")
        .update({
          signed_contract_pdf_url: pdfUrl,
          signature_data,
          status: "unterzeichnet",
        })
        .eq("id", contract_id);
    } else {
      await adminClient
        .from("employment_contracts")
        .update({ contract_pdf_url: pdfUrl })
        .eq("id", contract_id);
    }

    return new Response(
      JSON.stringify({ success: true, pdf_url: pdfUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
