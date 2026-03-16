

## Plan: SMS-Templates aktualisieren und Template-Lookup ueberall einbauen

### Aktueller Stand

**DB-Templates (8 Eintraege):**
- `bewerbung_angenommen` — OK, wird per Template-Lookup genutzt
- `indeed_bewerbung_angenommen` — OK (wird via sms-spoof gesendet, nicht ueber regulaeres SMS)
- `vertrag_genehmigt` — **Veraltet**: spricht von "Zugangsdaten per Email" — muss aktualisiert werden
- `termin_gebucht` — **Obsolet**: wird nirgends genutzt, loeschen
- `auftrag_zugewiesen` — OK, wird per Template-Lookup genutzt
- `bewertung_genehmigt` — OK
- `bewertung_abgelehnt` — OK
- `gespraech_erinnerung` — OK

**Fehlende Templates:**
- `gespraech_bestaetigung` — Code sendet hardcoded SMS
- `probetag_bestaetigung` — Code sendet hardcoded SMS
- `vertrag_eingereicht` — Kein SMS an dieser Stelle
- `konto_erstellt` — Kein SMS an dieser Stelle

**Hardcoded SMS (muss Template-Lookup werden):**
- `Bewerbungsgespraech.tsx` Zeile 211: hardcoded Text
- `Probetag.tsx` Zeile 214: hardcoded Text

**SMS im Edge Function `create-employee-account`:**
- Sendet `vertrag_genehmigt` SMS mit undefinierter `loginUrl` Variable — muss entfernt werden (wird kuenftig von `AdminArbeitsvertraege.tsx` gesendet)

**Fehlende SMS-Trigger:**
- `AdminArbeitsvertraege.tsx` bei Genehmigung: sendet Email aber keine SMS
- `Arbeitsvertrag.tsx` / `MitarbeiterArbeitsvertrag.tsx` bei Einreichung: keine SMS
- `Auth.tsx` bei Registrierung: keine SMS

### Aenderungen

| # | Datei/Ort | Aenderung |
|---|-----------|-----------|
| 1 | **DB: sms_templates** | UPDATE `vertrag_genehmigt` Text; DELETE `termin_gebucht`; INSERT `gespraech_bestaetigung`, `probetag_bestaetigung`, `vertrag_eingereicht`, `konto_erstellt` |
| 2 | **`create-employee-account/index.ts`** | SMS-Block (Zeilen 176-220) komplett entfernen |
| 3 | **`AdminArbeitsvertraege.tsx`** | `sendSms` importieren; nach Email-Versand SMS mit Template-Lookup fuer `vertrag_genehmigt` senden |
| 4 | **`Bewerbungsgespraech.tsx`** | Hardcoded SMS ersetzen durch Template-Lookup aus DB (`gespraech_bestaetigung`) |
| 5 | **`Probetag.tsx`** | Hardcoded SMS ersetzen durch Template-Lookup aus DB (`probetag_bestaetigung`) |
| 6 | **`AdminSmsTemplates.tsx`** | `PLACEHOLDER_INFO` erweitern um `vertrag_eingereicht`, `konto_erstellt` |

### DB-Daten-Updates

```sql
-- 1. vertrag_genehmigt Text aktualisieren
UPDATE sms_templates 
SET message = 'Hallo {name}, herzlichen Glückwunsch! Ihr Arbeitsvertrag wurde genehmigt – Sie sind nun vollwertiger Mitarbeiter. Wir freuen uns auf die Zusammenarbeit!',
    updated_at = now()
WHERE event_type = 'vertrag_genehmigt';

-- 2. Obsoletes Template loeschen
DELETE FROM sms_templates WHERE event_type = 'termin_gebucht';

-- 3. Neue Templates einfuegen
INSERT INTO sms_templates (event_type, label, message) VALUES
  ('gespraech_bestaetigung', 'Bewerbungsgespräch Bestätigung', 'Hallo {name}, Ihr Bewerbungsgespräch ist bestätigt: {datum} um {uhrzeit} Uhr. Wir freuen uns auf Sie!'),
  ('probetag_bestaetigung', 'Probetag Bestätigung', 'Hallo {name}, Ihr Probetag ist bestätigt: {datum} um {uhrzeit} Uhr. Wir freuen uns auf Sie!'),
  ('konto_erstellt', 'Konto erstellt', 'Hallo {name}, Ihr Konto wurde erfolgreich erstellt. Bitte reichen Sie nun Ihre Vertragsdaten ein.'),
  ('vertrag_eingereicht', 'Vertrag eingereicht', 'Hallo {name}, Ihre Vertragsdaten wurden erfolgreich eingereicht. Wir prüfen diese zeitnah.')
ON CONFLICT DO NOTHING;
```

### Template-Lookup Pattern (alle Stellen)

```typescript
const { data: tpl } = await supabase
  .from("sms_templates").select("message")
  .eq("event_type", "gespraech_bestaetigung").single();
const smsText = tpl?.message
  ? (tpl.message as string).replace("{name}", name).replace("{datum}", date).replace("{uhrzeit}", time)
  : `Hallo ${name}, Ihr Termin: ${date} um ${time} Uhr.`;
```

### Hinweis

Die SMS-Trigger fuer `konto_erstellt` (Auth.tsx) und `vertrag_eingereicht` (Arbeitsvertrag.tsx / MitarbeiterArbeitsvertrag.tsx) werden NICHT implementiert, da diese Seiten keinen zuverlaessigen Zugriff auf die Telefonnummer des Nutzers haben (die Telefonnummer ist erst in der Application/Contract-Tabelle gespeichert, nicht im Auth-Kontext). Diese koennen bei Bedarf spaeter ergaenzt werden — die DB-Templates werden aber bereits angelegt.

