
# E-Mail-Vorlagen Vorschau auf /admin/emails

## Uebersicht
Die Seite `/admin/emails` wird komplett umgebaut: Statt der versendeten E-Mail-Logs zeigt sie nun eine Vorschau aller 10 E-Mail-Templates mit Beispieldaten. Der Admin kann ein Branding auswaehlen und sieht sofort, wie die E-Mails im finalen Design aussehen werden -- bevor sie jemals versendet werden.

## Aufbau der neuen Seite

### Branding-Auswahl (oben)
- Dropdown mit allen verfuegbaren Brandings (aus `brandings`-Tabelle geladen)
- Beim Auswaehlen eines Brandings werden Logo, Farbe, Firmenname und Adresse fuer die Vorschau verwendet
- Wenn kein Branding gewaehlt: Standard-Fallback (blau, "Unternehmen")

### Template-Liste (links / Tabs)
Alle 10 Ereignisse als anklickbare Liste oder Tabs:

1. Bewerbung eingegangen
2. Bewerbung angenommen
3. Bewerbung abgelehnt
4. Bewerbungsgespraech erfolgreich
5. Arbeitsvertrag genehmigt
6. Arbeitsvertrag unterzeichnet
7. Neuer Auftrag zugewiesen
8. Auftragstermin gebucht
9. Bewertung genehmigt
10. Bewertung abgelehnt

### E-Mail-Vorschau (rechts / Hauptbereich)
- Zeigt das ausgewaehlte Template als gerenderten HTML-iframe (oder dangerouslySetInnerHTML in einem Container)
- Verwendet die gleiche `buildEmailHtml`-Logik wie die Edge Function, aber clientseitig nachgebaut
- Platzhalter-Daten fuer dynamische Felder (z.B. "Max Mustermann", "Auftrag #12345")
- Betreff wird oberhalb der Vorschau angezeigt
- Unter der Vorschau: Angabe welcher event_type verwendet wird

## Technische Umsetzung

### Datei: `src/pages/admin/AdminEmails.tsx` (komplett umgeschrieben)

**Neue Hilfsfunktion `buildEmailHtml`** (clientseitige Kopie der Edge Function Template-Logik):
- Nimmt `companyName`, `logoUrl`, `brandColor`, `bodyTitle`, `bodyLines`, `buttonText`, `buttonUrl`, `footerAddress` entgegen
- Gibt den gleichen HTML-String zurueck wie die Edge Function
- Logo wird als normale URL eingebettet (kein Base64 noetig fuer Vorschau)

**Template-Definitionen als Array:**
- Jedes Template hat: `eventType`, `label`, `subject`, `bodyTitle`, `bodyLines`, `buttonText?`, `buttonUrl?`
- Verwendet realistische Beispieldaten (z.B. "Max Mustermann", Firma aus Branding)

**State:**
- `selectedBrandingId` -- gewaehlt aus Dropdown
- `selectedTemplate` -- Index des aktiven Templates (default: 0)

**Daten:**
- Query auf `brandings` Tabelle fuer Dropdown (company_name, brand_color, logo_url, street, zip_code, city)
- Kein Zugriff auf email_logs noetig

**Rendering:**
- Vorschau in einem `<iframe srcDoc={html} />` fuer saubere Isolation
- Responsiver Aufbau: Links die Template-Liste, rechts die Vorschau

### Keine Aenderungen an anderen Dateien
- Edge Function bleibt unveraendert
- Keine Datenbank-Migration noetig
- E-Mail-Logs bleiben in der Datenbank, werden aber auf dieser Seite nicht mehr angezeigt
