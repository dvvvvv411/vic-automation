

## Externe Bewerbung — Toggle, Mass Import & Badge

### Uebersicht

Neues `is_external` Boolean auf `applications` + UI-Toggle im Bewerbungsdialog. Externe Bewerbungen verhalten sich wie Indeed (nur Vorname, Nachname, Email, Telefon, Branding), aber beim Akzeptieren wird die **normale SMS** (nicht Spoof) verschickt. In der Tabelle erscheint ein "Extern" Badge.

### 1. Datenbank-Migration

```sql
ALTER TABLE public.applications
  ADD COLUMN is_external boolean NOT NULL DEFAULT false;
```

### 2. AdminBewerbungen.tsx

**Dialog — neuer Toggle:**
- Unter dem Indeed-Toggle einen zweiten Toggle "Externe Bewerbung" hinzufuegen
- Indeed und Extern sind **exklusiv**: Aktivierung von Extern deaktiviert Indeed und umgekehrt
- Wenn Extern aktiv: gleiche reduzierte Felder wie Indeed (Vorname, Nachname, Email, Telefon, Branding)
- Mass Import Button bei Extern genau wie bei Indeed (Textarea mit gleichem Format)
- Validierung: `indeedSchema` wird auch fuer Extern wiederverwendet

**Formular-Logik (`handleSubmit`):**
- Extern-Einzeleingabe: `createMutation` mit `is_indeed: false, is_external: true`
- Extern-Massenimport: Insert mit `is_external: true, is_indeed: false`

**Accept-Logik (`acceptMutation`):**
- Neue Bedingung: `if (app.is_external)` → gleiche Email + normale SMS wie im `else`-Zweig (nicht Spoof)
- Bestehende Indeed/Normal-Logik bleibt unveraendert

**Tabelle — Badge:**
- Zeile 893: Neben dem Indeed-Badge ein Extern-Badge hinzufuegen
- `{a.is_external && <Badge variant="outline" className="text-[10px]">Extern</Badge>}`
- "–" nur anzeigen wenn weder Indeed noch Extern noch CV

**Reset:**
- Neuer State `isExternal`, beim Schliessen zuruecksetzen

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| Migration | `is_external` boolean auf `applications` |
| `AdminBewerbungen.tsx` | Toggle, Mass Import, Submit-Logik, Accept-Logik, Badge |

