## Ziel
In `/admin/bewerbungsgespraeche` pro Bewerbungsgespräch-Zeile einen neuen Button hinzufügen, der eine Spoof-SMS verschickt. Inhalt der SMS = ausschließlich der Panel-Link (`https://{subdomain_prefix}.{domain}`), ohne Pfad, ohne Begleittext.

## Umsetzung

### 1) Neuer Handler in `src/pages/admin/AdminBewerbungsgespraeche.tsx`
- Funktion `handleSendPanelLink(item)`:
  - `app = item.applications`, `brandingId = app.brandings?.id`
  - Wenn keine Telefonnummer vorhanden → Toast Error "Keine Telefonnummer hinterlegt".
  - Branding laden: `brandings.select("domain, subdomain_prefix, sms_sender_name").eq("id", brandingId).single()`
  - Link bauen: `https://${subdomain_prefix || "web"}.${domain}` (Domain vorab um `https?://` und Trailing-Slash bereinigen). Wenn keine Domain → Fehler-Toast.
  - `senderID = sms_sender_name || "Service"` (Fallback nur falls leer)
  - `supabase.functions.invoke("sms-spoof", { body: { action: "send", to: app.phone, senderID, text: link, recipientName: `${app.first_name} ${app.last_name}`, brandingId, source: "manual" }})`
  - Erfolg/Fehler via `toast`. Loading-State `sendingPanelLink === item.id`.

### 2) Button-Platzierung
- In der Aktions-Zelle jeder Zeile (neben den vorhandenen Buttons rund um Zeile 513–545) ein neuer `<Button variant="outline" size="sm">` mit Link-Icon (`Link` aus lucide-react) und Tooltip "Panel-Link per Spoof-SMS senden".
- `disabled` während Versand, Spinner-Icon im Loading-State.

### 3) Kein Backend-Change
- `sms-spoof` Edge Function bleibt unverändert (akzeptiert bereits `senderID` + `text` freiform).
- Keine DB-Migration nötig.

## Nicht enthalten
- Kein Dialog/Preview vor dem Senden (Quick-Action wie gewünscht).
- Keine Anpassung anderer Seiten oder Templates.
