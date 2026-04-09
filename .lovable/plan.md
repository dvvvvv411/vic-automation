

## Plan: Externe Bewerbung (META) mit SMS aus sms_templates

### Zusammenfassung
Neuer Bewerbungstyp "Externe Bewerbung (META)" mit eigenem SMS-Template aus der `sms_templates` Tabelle — kein hardcodierter Text. Genau wie bei "Extern (Allgemein)" wird das Template per `event_type` aus der DB geladen.

### Datenbank-Änderungen

**Migration: `applications` Tabelle**
```sql
ALTER TABLE applications ADD COLUMN is_meta boolean NOT NULL DEFAULT false;
```

**Insert: `sms_templates` Tabelle** (per Insert-Tool)
```sql
INSERT INTO sms_templates (event_type, label, message)
VALUES (
  'bewerbung_angenommen_extern_meta',
  'Bewerbung angenommen Extern META',
  'Hallo {name}, deine Bewerbung über Instagram/Facebook im Bereich Onlineprozess-Tests (Quality Assurance) wurde angenommen! Bitte buche deinen Kennenlerngesprächstermin über den Link in der E-Mail, die du erhalten hast.'
);
```

### Code-Änderungen

**`src/pages/admin/AdminBewerbungen.tsx`**

- Toggle "Externe Bewerbung" umbenennen zu **"Externe Bewerbung (Allgemein)"**
- Neuer Toggle **"Externe Bewerbung (META)"** → State `isMeta`, gegenseitig exklusiv mit Indeed und Extern
- Bei Insert: `is_meta: isMeta` mitgeben
- Badge in Tabelle: `is_meta` → "Extern (META)", `is_extern` → "Extern (Allg.)"
- **Accept-Logik**: Neuer `else if (app.is_meta)` Block — lädt SMS aus `sms_templates` mit `event_type = 'bewerbung_angenommen_extern_meta'`, ersetzt `{name}`, verschickt über `sendSms()` (seven.io). Gleiche Logik wie bei extern, nur anderer event_type
- Email: wie bei extern, aber mit Instagram/Facebook-Bezug im Text

**`src/pages/admin/AdminSmsTemplates.tsx`**

- `PLACEHOLDER_INFO` erweitern: `bewerbung_angenommen_extern_meta: ["{name}"]`

### Betroffene Dateien

| Resource | Änderung |
|---|---|
| DB: `applications` | Neue Spalte `is_meta` |
| DB: `sms_templates` | Neues Template einfügen |
| `src/pages/admin/AdminBewerbungen.tsx` | Toggle, State, Badge, Accept-Logik |
| `src/pages/admin/AdminSmsTemplates.tsx` | Placeholder-Info |

