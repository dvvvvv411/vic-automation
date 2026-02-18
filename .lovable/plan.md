

# SMS-Absendername aus Branding + Telefonnummer-Normalisierung

## Uebersicht

Drei Aenderungen:
1. Neues Feld `sms_sender_name` in der `brandings`-Tabelle (max. 11 Zeichen) -- wird im Branding-Dialog unter den Resend-Feldern angezeigt
2. Branding-Auswahl beim Test-SMS auf `/admin/sms`, damit der Absendername dynamisch gesetzt wird
3. Telefonnummer-Normalisierung in der Edge Function: deutsche Nummern mit `0` werden zu `+49`, Leerzeichen/Sonderzeichen werden entfernt

---

## 1. Datenbank: Neue Spalte `sms_sender_name`

Migration:
```sql
ALTER TABLE brandings ADD COLUMN sms_sender_name text;
```

Kein Default noetig -- Fallback bleibt "Vic" in der Edge Function.

## 2. AdminBrandings.tsx -- Neues Eingabefeld

- `sms_sender_name` zum `brandingSchema` hinzufuegen (max. 11 Zeichen)
- Neues Eingabefeld im Dialog nach den Resend-Feldern, unter einer Trennlinie "SMS-Konfiguration"
- Hinweis: "Max. 11 Zeichen (alphanumerisch)"
- Im `openEdit` und `initialForm` beruecksichtigen

## 3. send-sms Edge Function -- `from` + Telefonnummer-Normalisierung

**`from`-Parameter:**
- Neues optionales Feld `from` aus dem Request-Body lesen
- Fallback auf `"Vic"` wenn nicht angegeben
- Auf 11 Zeichen kuerzen

**Telefonnummer-Normalisierung** (vor dem Senden):
- Alle Nicht-Ziffern entfernen (ausser fuehrendes `+`)
- Wenn Nummer mit `0` beginnt: `0` durch `+49` ersetzen
- Beispiele: `0176 742 19 23` wird zu `+491767421923`, `+49176123` bleibt `+49176123`

## 4. sendSms Client-Helper -- `from` Parameter

`SendSmsParams` um optionales `from?: string` erweitern und an die Edge Function weiterleiten.

## 5. AdminSmsTemplates.tsx -- Branding-Dropdown beim Test-SMS

- Brandings per `useQuery` laden (`id`, `company_name`, `sms_sender_name`)
- Neues Select-Dropdown "Branding (Absender)" im Test-SMS-Bereich
- State `testBrandingId`
- Beim Senden: `sms_sender_name` des gewaehlten Brandings als `from`-Parameter mitgeben
- Validierung: Branding muss ausgewaehlt sein

## 6. Alle automatischen SMS-Aufrufe -- `from` mitgeben

An allen Stellen, wo `sendSms()` aufgerufen wird, das Branding laden und `sms_sender_name` als `from` uebergeben:

| Datei | Branding-Zugang |
|-------|-----------------|
| `AdminBewerbungen.tsx` | `branding_id` der Application -> Branding laden |
| `AssignmentDialog.tsx` | Branding ueber Application -> `branding_id` |
| `AdminBewertungen.tsx` | Branding ueber Contract -> Application -> `branding_id` |
| `AuftragDetails.tsx` | Branding ueber Contract -> Application -> `branding_id` |
| `AdminLivechat.tsx` | Branding ueber Contract -> Application -> `branding_id` |
| `create-employee-account/index.ts` | Branding bereits verfuegbar, `sms_sender_name` aus DB laden |

Falls kein `sms_sender_name` vorhanden: Fallback "Vic".

## Zusammenfassung der Dateiaenderungen

| Datei | Aenderung |
|-------|-----------|
| Migration | `ALTER TABLE brandings ADD COLUMN sms_sender_name text` |
| `src/pages/admin/AdminBrandings.tsx` | + Eingabefeld "SMS-Absendername" (max 11 Zeichen) |
| `supabase/functions/send-sms/index.ts` | + `from`-Parameter + Telefonnummer-Normalisierung |
| `src/lib/sendSms.ts` | + `from` in Interface |
| `src/pages/admin/AdminSmsTemplates.tsx` | + Branding-Dropdown beim Test-SMS |
| `src/pages/admin/AdminBewerbungen.tsx` | + `from` bei sendSms |
| `src/components/admin/AssignmentDialog.tsx` | + `from` bei sendSms |
| `src/pages/admin/AdminBewertungen.tsx` | + `from` bei sendSms |
| `src/pages/mitarbeiter/AuftragDetails.tsx` | + `from` bei sendSms |
| `src/pages/admin/AdminLivechat.tsx` | + `from` bei sendSms |
| `supabase/functions/create-employee-account/index.ts` | + `from` aus Branding bei SMS |

