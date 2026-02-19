

# Umlaute korrigieren und Branding-Domain-Links sicherstellen

## Problem 1: Umlaute als ae/oe/ue geschrieben

In vielen E-Mail-Texten werden deutsche Umlaute als Umschreibung geschrieben (ae, oe, ue, ss) statt als echte Zeichen (ae, oe, ue, ss). Das betrifft sowohl Client-seitige Dateien als auch Edge Functions.

## Problem 2: Links nutzen `window.location.origin` oder Lovable-URLs

Mehrere Stellen generieren Links mit `window.location.origin` (zeigt auf die Lovable-Preview-Domain) statt `buildBrandingUrl()` zu verwenden. Eine Edge Function hat sogar einen Fallback auf `.lovable.app`.

---

## Alle betroffenen Stellen

### Datei 1: `src/pages/admin/AdminBewerbungen.tsx`

**Umlaute (Zeilen 208-261):**
- Zeile 211: "fuer Ihr Bewerbungsgespraech ueber" -> "für Ihr Bewerbungsgespräch über"
- Zeile 256: "Rueckmeldung" -> "Rückmeldung"
- Zeile 259: "fuer Ihr Interesse" -> "für Ihr Interesse"
- Zeile 260: "muessen...fuer" -> "müssen...für"
- Zeile 261: "wuenschen...fuer" -> "wünschen...für"

**Links (Zeile 112, 343):**
- Zeile 112 (in `acceptMutation`): `interviewLink` wird bereits korrekt ueber `buildBrandingUrl` generiert -- OK
- Zeile 343 (`copyLink`): `window.location.origin` -> `buildBrandingUrl` verwenden. Da `buildBrandingUrl` async ist, muss `copyLink` async werden. Die App-ID des Bewerbers muss mitgegeben werden um die branding_id zu ermitteln.

### Datei 2: `src/pages/admin/AdminBewerbungsgespraeche.tsx`

**Umlaute (Zeilen 117-124):**
- "Ihr Bewerbungsgespraech war erfolgreich" -> "Ihr Bewerbungsgespräch war erfolgreich"
- "Bewerbungsgespraech erfolgreich" -> "Bewerbungsgespräch erfolgreich"
- "fuellen...ueber" -> "füllen...über"
- "Arbeitsvertrag ausfuellen" -> "Arbeitsvertrag ausfüllen"

**Links (Zeile 112):**
- `${window.location.origin}/arbeitsvertrag/${contract.id}` -> `await buildBrandingUrl(app.brandings?.id, ...)` verwenden

### Datei 3: `src/pages/admin/AdminBewertungen.tsx`

**Umlaute (Zeilen 169-241):**
- "fuer den Auftrag" -> "für den Auftrag" (2x, Zeile 169 und 240)
- "Praemie" -> "Prämie" (Zeile 170)
- "fuehren Sie die Bewertung erneut durch" -> "führen Sie die Bewertung erneut durch" (Zeile 241)

### Datei 4: `src/components/admin/AssignmentDialog.tsx`

**Umlaute (Zeile 137):**
- "Praemie" -> "Prämie"

### Datei 5: `src/pages/mitarbeiter/AuftragDetails.tsx`

**Umlaute (Zeilen 195-202):**
- "Auftragstermin bestaetigt" -> "Auftragstermin bestätigt"
- "fuer den Auftrag" -> "für den Auftrag"
- "durchgefuehrt" -> "durchgeführt"

### Datei 6: `supabase/functions/sign-contract/index.ts`

**Umlaute (Zeile 110):**
- "Vielen Dank fuer Ihre Unterschrift" -> "Vielen Dank für Ihre Unterschrift"

### Datei 7: `supabase/functions/submit-application/index.ts`

**Umlaute (Zeilen 169-172):**
- "Vielen Dank fuer Ihre Bewerbung" -> "Vielen Dank für Ihre Bewerbung"
- "sorgfaeltig pruefen" -> "sorgfältig prüfen"

### Datei 8: `supabase/functions/create-employee-account/index.ts`

**Links (Zeile 158):**
- Fallback-URL: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/auth` -> Besserer Fallback: Wenn kein Branding-Domain vorhanden, sollte trotzdem keine Lovable-URL generiert werden. Da in Edge Functions kein `window.location.origin` verfuegbar ist, wird der Fallback auf eine generische Nachricht ohne Link umgestellt, oder es wird die Supabase-URL als Basis genommen (die ist ohnehin nur ein Fallback).

Hier wird der Fallback geaendert: Wenn kein Branding-Domain existiert, wird die URL aus dem Supabase-URL abgeleitet, aber mit der korrekten Logik (nicht `.lovable.app`).

### Datei 9: `src/pages/admin/AdminArbeitsvertraege.tsx`

**Links (Zeile 186):**
- Copy-Link nutzt `window.location.origin` -> `buildBrandingUrl` verwenden (async, branding_id aus `item.applications?.branding_id`)

### Datei 10: `src/pages/admin/AdminEmails.tsx`

Die Template-Vorschau nutzt korrekte Umlaute -- keine Aenderung noetig.

---

## Zusammenfassung der Aenderungen

| Datei | Umlaute | Links |
|-------|---------|-------|
| `src/pages/admin/AdminBewerbungen.tsx` | 5 Stellen | copyLink -> buildBrandingUrl |
| `src/pages/admin/AdminBewerbungsgespraeche.tsx` | 4 Stellen | contractLink -> buildBrandingUrl |
| `src/pages/admin/AdminBewertungen.tsx` | 4 Stellen | -- |
| `src/components/admin/AssignmentDialog.tsx` | 1 Stelle | -- |
| `src/pages/mitarbeiter/AuftragDetails.tsx` | 3 Stellen | -- |
| `supabase/functions/sign-contract/index.ts` | 1 Stelle | -- |
| `supabase/functions/submit-application/index.ts` | 2 Stellen | -- |
| `supabase/functions/create-employee-account/index.ts` | -- | Lovable-URL Fallback entfernen |
| `src/pages/admin/AdminArbeitsvertraege.tsx` | -- | copyLink -> buildBrandingUrl |

Insgesamt: ~20 Umlaut-Korrekturen und 4 Link-Korrekturen ueber 9 Dateien.

