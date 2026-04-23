

## Plan: Pro-Branding Seven.io API Key

### Ziel
Jedes Branding bekommt ein eigenes Eingabefeld „Seven.io API Key" unter „SMS-Absendername" in `/admin/brandings` (Erstellen + Bearbeiten). Beim SMS-Versand wird der API Key des jeweiligen Brandings benutzt — nicht mehr der globale Supabase-Secret. Spoofing (LimitlessTXT via `sms-spoof`) bleibt komplett unverändert.

### 1. Datenbank — neue Spalte
Migration:
```sql
ALTER TABLE public.brandings
ADD COLUMN seven_api_key text;
```
Keine RLS-Änderung nötig (Spalte folgt bestehenden Branding-Policies — nur Admins/zugewiesene Kunden lesen/schreiben).

### 2. Admin-Form — `src/pages/admin/AdminBrandingForm.tsx`
- Zod-Schema: `seven_api_key: z.string().max(200).optional()` ergänzen.
- Default-State: `seven_api_key: ""`.
- Beim Laden eines bestehenden Brandings: `seven_api_key: branding.seven_api_key || ""`.
- Beim Speichern (insert + update): Feld mitsenden; leerer String → `null`.
- UI: Direkt **unter** dem „SMS-Absendername"-Block in der „SMS-Konfiguration"-Card ein neues `<Label>Seven.io API Key</Label>` + `<Input type="password">` mit Hilfetext „Wird als Absender-API für SMS dieses Brandings verwendet. Leer = globaler Fallback-Key."

### 3. Edge Function — `supabase/functions/send-sms/index.ts`
Logik anpassen, damit der Key brandingsabhängig geladen wird:

```ts
let apiKey: string | null = null;

if (branding_id) {
  const { data: brand } = await adminClient
    .from("brandings")
    .select("seven_api_key")
    .eq("id", branding_id)
    .maybeSingle();
  apiKey = brand?.seven_api_key?.trim() || null;
}

// Fallback auf globalen Secret, falls Branding keinen Key hat
if (!apiKey) {
  apiKey = Deno.env.get("SEVEN_API_KEY") ?? null;
}

if (!apiKey) {
  return new Response(
    JSON.stringify({ error: "Kein Seven.io API Key (Branding + globaler Secret leer)" }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```
- `adminClient` (service role) wird ohnehin schon für `sms_logs.insert` instanziiert → wir nutzen ihn auch für den Branding-Lookup (umgeht RLS, da der Aufrufer ggf. ein anonymer Public-Booking-Flow ist).
- `branding_id` kommt bereits aus `req.json()` und wird heute schon von allen Aufrufern übergeben (verifiziert in `AdminBewerbungen.tsx`, `AdminLivechat.tsx`, `AdminBewerbungsgespraeche.tsx`, `send-appointment-reminders` etc.) — keine Frontend-Änderung am Aufruf nötig.
- Rest der Funktion (Normalisierung, seven.io-Call, sms_logs-Insert, Erfolgs-Parsing) bleibt 1:1.

### 4. Was NICHT geändert wird
- **`sms-spoof` Edge Function** und alle Spoof-Aufrufer bleiben unverändert (LimitlessTXT-Pfad).
- `send-appointment-reminders`: ruft bereits `send-sms` mit `branding_id` auf → automatisch mitabgedeckt, keine Änderung.
- Keine UI-/Layout-Änderungen außerhalb des SMS-Konfig-Blocks.
- Keine Änderung an `sms_sender_name`, `sms_logs`-Schema, Templates, Telefonnummern-Logik.
- Globaler Secret `SEVEN_API_KEY` bleibt als **Fallback** bestehen — kann später entfernt werden, wenn alle Brandings einen eigenen Key haben.

### Geänderte/neue Dateien

| Datei | Änderung |
|---|---|
| Neue Migration | `ALTER TABLE brandings ADD COLUMN seven_api_key text` |
| `src/pages/admin/AdminBrandingForm.tsx` | Schema + State + Lade-/Speichern-Logik + neues Eingabefeld unter SMS-Absendername |
| `supabase/functions/send-sms/index.ts` | API Key per `branding_id` aus DB laden, globaler Secret als Fallback |

### Erwartetes Ergebnis
- In `/admin/brandings/neu` und `/admin/brandings/:id` erscheint unter „SMS-Absendername" ein Feld „Seven.io API Key" (Passwort-Input).
- Alle SMS (Bewerbungsannahme, Termin-Bestätigungen, Erinnerungen, manuelle Nachrichten aus Livechat, Probetag-/Erstarbeitstag-Flows, public Booking) gehen über den Branding-eigenen Key.
- Brandings ohne eigenen Key fallen sicher auf den globalen Secret zurück → keine Breaking Change.
- Spoof-SMS-Versand bleibt unverändert.

