

## Plan: SMS-Templates und -Versand an neuen Workflow anpassen

### Probleme identifiziert

1. **DB-Template `vertrag_genehmigt`** spricht noch von Zugangsdaten — muss auf Gratulations-Text geaendert werden
2. **DB-Template `termin_gebucht`** existiert noch — wird nicht mehr genutzt, entfernen
3. **Fehlende DB-Templates**: `gespraech_bestaetigung`, `probetag_bestaetigung`, `konto_erstellt`, `vertrag_eingereicht`, `auftrag_erfolgreich`
4. **`create-employee-account/index.ts`** sendet noch `vertrag_genehmigt` SMS mit undefinierter `loginUrl` Variable — gesamten SMS-Block entfernen (SMS wird jetzt von `AdminArbeitsvertraege.tsx` gesendet)
5. **`AdminArbeitsvertraege.tsx`** sendet Email bei Genehmigung aber keine SMS — SMS hinzufuegen
6. **`Bewerbungsgespraech.tsx` und `Probetag.tsx`** senden hardcoded SMS-Text statt DB-Templates zu nutzen — Template-Lookup einbauen
7. Fehlende SMS bei `konto_erstellt` (Auth.tsx), `vertrag_eingereicht` (Arbeitsvertrag.tsx, MitarbeiterArbeitsvertrag.tsx), `auftrag_erfolgreich` (AdminBewertungen.tsx, AdminMitarbeiterDetail.tsx)

### Aenderungen

| Datei | Aenderung |
|-------|-----------|
| **DB Migration** | `vertrag_genehmigt` Template-Text updaten; `termin_gebucht` loeschen; neue Templates einfuegen fuer `gespraech_bestaetigung`, `probetag_bestaetigung`, `konto_erstellt`, `vertrag_eingereicht`, `auftrag_erfolgreich` |
| **`supabase/functions/create-employee-account/index.ts`** | SMS-Block (Zeilen 175-219) komplett entfernen |
| **`src/pages/admin/AdminArbeitsvertraege.tsx`** | `sendSms` importieren; nach Email-Versand: SMS mit Template-Lookup senden (`vertrag_genehmigt`) |
| **`src/pages/Bewerbungsgespraech.tsx`** | Hardcoded SMS-Text ersetzen durch Template-Lookup aus `sms_templates` Tabelle |
| **`src/pages/Probetag.tsx`** | Analog: Template-Lookup statt hardcoded Text |
| **`src/pages/Auth.tsx`** | SMS `konto_erstellt` nach Registrierung senden |
| **`src/pages/Arbeitsvertrag.tsx`** | SMS `vertrag_eingereicht` nach Einreichung senden |
| **`src/pages/mitarbeiter/MitarbeiterArbeitsvertrag.tsx`** | SMS `vertrag_eingereicht` nach Einreichung senden |
| **`src/pages/admin/AdminBewertungen.tsx`** | Zusaetzlich `auftrag_erfolgreich` SMS senden (bereits `bewertung_genehmigt` SMS vorhanden — Event-Type anpassen) |
| **`src/pages/admin/AdminMitarbeiterDetail.tsx`** | Analog: `auftrag_erfolgreich` SMS Event-Type |
| **`src/pages/admin/AdminSmsTemplates.tsx`** | `PLACEHOLDER_INFO` um neue Events erweitern: `konto_erstellt`, `vertrag_eingereicht`, `auftrag_erfolgreich` |

### DB Migration (SQL)

```sql
-- Update vertrag_genehmigt text
UPDATE sms_templates 
SET message = 'Hallo {name}, herzlichen Glückwunsch! Ihr Arbeitsvertrag wurde genehmigt – Sie sind nun vollwertiger Mitarbeiter. Wir freuen uns auf die Zusammenarbeit!',
    updated_at = now()
WHERE event_type = 'vertrag_genehmigt';

-- Delete obsolete termin_gebucht
DELETE FROM sms_templates WHERE event_type = 'termin_gebucht';

-- Insert new templates
INSERT INTO sms_templates (event_type, label, message) VALUES
  ('gespraech_bestaetigung', 'Bewerbungsgespräch Bestätigung', 'Hallo {name}, Ihr Bewerbungsgespräch ist bestätigt: {datum} um {uhrzeit} Uhr. Wir freuen uns auf Sie!'),
  ('probetag_bestaetigung', 'Probetag Bestätigung', 'Hallo {name}, Ihr Probetag ist bestätigt: {datum} um {uhrzeit} Uhr. Wir freuen uns auf Sie!'),
  ('konto_erstellt', 'Konto erstellt', 'Hallo {name}, Ihr Konto wurde erfolgreich erstellt. Loggen Sie sich ein und reichen Sie Ihren Arbeitsvertrag ein.'),
  ('vertrag_eingereicht', 'Vertrag eingereicht', 'Hallo {name}, Ihre Vertragsdaten wurden erfolgreich eingereicht. Wir prüfen diese zeitnah.'),
  ('auftrag_erfolgreich', 'Auftrag erfolgreich', 'Hallo {name}, Ihr Auftrag "{auftrag}" wurde erfolgreich abgeschlossen. Vielen Dank!')
ON CONFLICT DO NOTHING;
```

### SMS-Template-Lookup Pattern

Alle SMS-Versand-Stellen laden das Template aus der DB und ersetzen Platzhalter, mit Hardcoded-Fallback:

```typescript
const { data: tpl } = await supabase
  .from("sms_templates").select("message")
  .eq("event_type", "gespraech_bestaetigung").single();
const smsText = tpl?.message
  ? tpl.message.replace("{name}", name).replace("{datum}", date).replace("{uhrzeit}", time)
  : `Hallo ${name}, Ihr Termin: ${date} um ${time} Uhr.`;
```

