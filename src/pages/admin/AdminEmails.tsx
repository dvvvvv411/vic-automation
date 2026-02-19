import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Mail, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Client-side mirror of the Edge Function buildEmailHtml             */
/* ------------------------------------------------------------------ */

function buildEmailHtml(opts: {
  companyName: string;
  brandColor: string;
  bodyTitle: string;
  bodyLines: string[];
  buttonText?: string;
  buttonUrl?: string;
  footerAddress: string;
}): string {
  const { companyName, brandColor, bodyTitle, bodyLines, buttonText, buttonUrl, footerAddress } = opts;

  const linesHtml = bodyLines
    .map((line) => `<p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#374151;">${line}</p>`)
    .join("\n");

  const buttonHtml = buttonText && buttonUrl
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
        <tr>
          <td style="border-radius:6px;background-color:${brandColor};">
            <a href="${buttonUrl}" target="_blank" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">${buttonText}</a>
          </td>
        </tr>
      </table>`
    : "";

  const logoHtml = `<span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${companyName}</span>`;

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f3f4f6;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;">
<tr>
  <td style="background-color:${brandColor};padding:28px 32px;border-radius:8px 8px 0 0;" align="center">
    ${logoHtml}
  </td>
</tr>
<tr>
  <td style="background-color:#ffffff;padding:36px 32px 28px 32px;">
    <h1 style="margin:0 0 20px 0;font-size:20px;font-weight:700;color:#111827;line-height:1.3;">${bodyTitle}</h1>
    ${linesHtml}
    ${buttonHtml}
  </td>
</tr>
<tr>
  <td style="background-color:#f9fafb;padding:20px 32px;border-radius:0 0 8px 8px;border-top:1px solid #e5e7eb;">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="font-size:12px;color:#9ca3af;line-height:1.5;" align="left">${companyName}</td>
        ${footerAddress ? `<td style="font-size:12px;color:#9ca3af;line-height:1.5;" align="right">${footerAddress}</td>` : ""}
      </tr>
    </table>
  </td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/*  Template definitions with sample data                              */
/* ------------------------------------------------------------------ */

interface TemplateDefinition {
  eventType: string;
  label: string;
  subject: (company: string) => string;
  bodyTitle: string;
  bodyLines: (company: string) => string[];
  buttonText?: string;
  buttonUrl?: string;
}

const templates: TemplateDefinition[] = [
  {
    eventType: "bewerbung_eingegangen",
    label: "Bewerbung eingegangen",
    subject: (c) => `Ihre Bewerbung bei ${c}`,
    bodyTitle: "Vielen Dank für Ihre Bewerbung",
    bodyLines: (c) => [
      "Sehr geehrte/r Max Mustermann,",
      `wir haben Ihre Bewerbung als Vollzeit-Mitarbeiter bei ${c} erhalten und werden diese sorgfältig prüfen.`,
      "Wir melden uns in Kürze bei Ihnen.",
      "Mit freundlichen Grüßen",
    ],
  },
  {
    eventType: "bewerbung_angenommen",
    label: "Bewerbung angenommen",
    subject: (c) => `Ihre Bewerbung wurde angenommen – ${c}`,
    bodyTitle: "Ihre Bewerbung wurde angenommen",
    bodyLines: (c) => [
      "Sehr geehrte/r Max Mustermann,",
      `wir freuen uns, Ihnen mitteilen zu können, dass Ihre Bewerbung bei ${c} angenommen wurde.`,
      "Im nächsten Schritt bitten wir Sie, einen Termin für Ihr Bewerbungsgespräch zu vereinbaren.",
    ],
    buttonText: "Gesprächstermin buchen",
    buttonUrl: "https://example.com/bewerbungsgespraech/abc123",
  },
  {
    eventType: "bewerbung_abgelehnt",
    label: "Bewerbung abgelehnt",
    subject: (c) => `Ihre Bewerbung bei ${c}`,
    bodyTitle: "Rückmeldung zu Ihrer Bewerbung",
    bodyLines: (c) => [
      "Sehr geehrte/r Max Mustermann,",
      `vielen Dank für Ihr Interesse an einer Tätigkeit bei ${c}.`,
      "Nach sorgfältiger Prüfung müssen wir Ihnen leider mitteilen, dass wir uns für einen anderen Kandidaten entschieden haben.",
      "Wir wünschen Ihnen für Ihren weiteren Werdegang alles Gute.",
      "Mit freundlichen Grüßen",
    ],
  },
  {
    eventType: "gespraech_erfolgreich",
    label: "Gespräch erfolgreich",
    subject: (c) => `Nächster Schritt: Arbeitsvertrag – ${c}`,
    bodyTitle: "Ihr Bewerbungsgespräch war erfolgreich",
    bodyLines: (c) => [
      "Sehr geehrte/r Max Mustermann,",
      `wir freuen uns, Ihnen mitteilen zu können, dass Ihr Bewerbungsgespräch bei ${c} erfolgreich verlaufen ist.`,
      "Bitte füllen Sie im nächsten Schritt Ihren Arbeitsvertrag aus.",
    ],
    buttonText: "Arbeitsvertrag ausfüllen",
    buttonUrl: "https://example.com/arbeitsvertrag/abc123",
  },
  {
    eventType: "vertrag_genehmigt",
    label: "Vertrag genehmigt",
    subject: (c) => `Ihr Zugang bei ${c} – Arbeitsvertrag bereit`,
    bodyTitle: "Ihr Arbeitsvertrag steht zur Unterzeichnung bereit",
    bodyLines: (c) => [
      "Sehr geehrte/r Max Mustermann,",
      `Ihr Arbeitsvertrag bei ${c} wurde genehmigt. Sie können sich ab sofort mit folgenden Zugangsdaten einloggen:`,
      "E-Mail: max.mustermann@example.com",
      "Passwort: Temp1234!",
      "Ihr Arbeitsvertrag muss noch unterzeichnet werden.",
    ],
    buttonText: "Jetzt einloggen",
    buttonUrl: "https://example.com/auth",
  },
  {
    eventType: "vertrag_unterzeichnet",
    label: "Vertrag unterzeichnet",
    subject: (c) => `Arbeitsvertrag unterzeichnet – ${c}`,
    bodyTitle: "Ihr Arbeitsvertrag wurde erfolgreich unterzeichnet",
    bodyLines: (c) => [
      "Sehr geehrte/r Max Mustermann,",
      `vielen Dank. Ihr Arbeitsvertrag bei ${c} wurde erfolgreich unterzeichnet.`,
      "Sie finden den unterzeichneten Vertrag in Ihrem Mitarbeiterportal.",
      "Mit freundlichen Grüßen",
    ],
  },
  {
    eventType: "auftrag_zugewiesen",
    label: "Neuer Auftrag zugewiesen",
    subject: (c) => `Neuer Auftrag – ${c}`,
    bodyTitle: "Ihnen wurde ein neuer Auftrag zugewiesen",
    bodyLines: () => [
      "Sehr geehrte/r Max Mustermann,",
      "Ihnen wurde folgender Auftrag zugewiesen:",
      "Auftrag: #12345 – App-Bewertung Testprojekt",
      "Bitte loggen Sie sich ein, um die Details einzusehen und einen Termin zu buchen.",
    ],
    buttonText: "Auftrag ansehen",
    buttonUrl: "https://example.com/mitarbeiter/auftraege",
  },
  {
    eventType: "termin_gebucht",
    label: "Auftragstermin gebucht",
    subject: () => "Terminbestätigung",
    bodyTitle: "Ihr Auftragstermin wurde bestätigt",
    bodyLines: () => [
      "Sehr geehrte/r Max Mustermann,",
      "Ihr Termin für den Auftrag #12345 wurde erfolgreich gebucht:",
      "Datum: 15.03.2026",
      "Uhrzeit: 14:00 Uhr",
      "Bitte führen Sie den Auftrag zum vereinbarten Zeitpunkt durch.",
    ],
  },
  {
    eventType: "bewertung_genehmigt",
    label: "Bewertung genehmigt",
    subject: () => "Ihre Bewertung wurde genehmigt",
    bodyTitle: "Bewertung genehmigt",
    bodyLines: () => [
      "Sehr geehrte/r Max Mustermann,",
      "Ihre Bewertung für den Auftrag #12345 wurde geprüft und genehmigt.",
      "Die entsprechende Prämie wurde Ihrem Konto gutgeschrieben.",
      "Vielen Dank fuer Ihre Mitarbeit.",
    ],
  },
  {
    eventType: "bewertung_abgelehnt",
    label: "Bewertung abgelehnt",
    subject: () => "Ihre Bewertung wurde abgelehnt",
    bodyTitle: "Bewertung abgelehnt",
    bodyLines: () => [
      "Sehr geehrte/r Max Mustermann,",
      "Ihre Bewertung für den Auftrag #12345 wurde geprüft und leider abgelehnt.",
      "Bitte führen Sie die Bewertung erneut durch. Achten Sie dabei auf die Vorgaben des Auftrags.",
    ],
    buttonText: "Bewertung wiederholen",
    buttonUrl: "https://example.com/mitarbeiter/auftraege",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminEmails() {
  const [selectedBrandingId, setSelectedBrandingId] = useState<string>("none");
  const [selectedIdx, setSelectedIdx] = useState(0);

  const { data: brandings } = useQuery({
    queryKey: ["brandings-for-preview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brandings")
        .select("id, company_name, brand_color, logo_url, street, zip_code, city")
        .order("company_name");
      if (error) throw error;
      return data;
    },
  });

  const branding = brandings?.find((b) => b.id === selectedBrandingId);
  const companyName = branding?.company_name || "Unternehmen";
  const brandColor = branding?.brand_color || "#3B82F6";
  const footerParts = [branding?.street, `${branding?.zip_code || ""} ${branding?.city || ""}`.trim()].filter(Boolean);
  const footerAddress = footerParts.join(", ");

  const tpl = templates[selectedIdx];

  const html = useMemo(
    () =>
      buildEmailHtml({
        companyName,
        brandColor,
        bodyTitle: tpl.bodyTitle,
        bodyLines: tpl.bodyLines(companyName),
        buttonText: tpl.buttonText,
        buttonUrl: tpl.buttonUrl,
        footerAddress,
      }),
    [companyName, brandColor, tpl, footerAddress],
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">E-Mail-Vorlagen</h2>
          <p className="text-muted-foreground mt-1">Vorschau aller E-Mail-Benachrichtigungen mit Beispieldaten.</p>
        </div>
        <Select value={selectedBrandingId} onValueChange={setSelectedBrandingId}>
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="Branding waehlen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Standard (kein Branding)</SelectItem>
            {brandings?.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.company_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex gap-6">
        {/* Template list */}
        <div className="w-[280px] shrink-0 space-y-1">
          {templates.map((t, i) => (
            <button
              key={t.eventType}
              onClick={() => setSelectedIdx(i)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors",
                i === selectedIdx
                  ? "bg-primary text-primary-foreground font-medium"
                  : "hover:bg-muted text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="flex-1 min-w-0">
          <div className="border border-border rounded-lg overflow-hidden">
            {/* Meta bar */}
            <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Vorschau</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Betreff: <span className="font-medium text-foreground">{tpl.subject(companyName)}</span>
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                <Mail className="h-3 w-3 mr-1" />
                {tpl.eventType}
              </Badge>
            </div>

            {/* iframe */}
            <iframe
              srcDoc={html}
              title="E-Mail-Vorschau"
              className="w-full border-0"
              style={{ height: 620 }}
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </motion.div>
    </>
  );
}
