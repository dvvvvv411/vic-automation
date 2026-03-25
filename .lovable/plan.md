

## Plan: Workflow-Aenderungen fuer Probetag, Arbeitsvertrag & Bewerbungsgespraeche

### Uebersicht

Drei zusammenhaengende Aenderungen:

1. **Probetag "erfolgreich"**: Nur Status aendern, keinen 1. Arbeitstag-Link mehr erstellen, keine E-Mail mit Login-Link mehr senden. Der Copy-Button fuer 1. Arbeitstag wird entfernt.

2. **Arbeitsvertrag genehmigen**: Nach Genehmigung wird der 1. Arbeitstag-Buchungslink generiert. Die "Willkommen im Team"-E-Mail erhaelt zusaetzlichen Text + Button. Im Detail-Popup wird der Link zum Kopieren angezeigt (bei genehmigten Vertraegen).

3. **Bewerbungsgespraeche-Tabelle**: Neue Spalte "Probetag" die anzeigt ob/wann ein Probetag-Termin gebucht wurde. Plus ein Button zum erneuten Senden der Probetag-Einladung (selbe Logik wie "erfolgreich markieren"), mit rotem Badge-Zaehler und Timestamp-Popover.

---

### Aenderungen

#### 1. `AdminProbetag.tsx`

- `handleStatusUpdate`: Den gesamten E-Mail-Block bei `erfolgreich` entfernen (Zeilen 86-109). Nur noch Status-Update.
- `handleCopyFirstWorkdayLink` Funktion entfernen
- Copy-Button bei `status === "erfolgreich"` entfernen (Zeilen 216-219)

#### 2. `AdminArbeitsvertraege.tsx`

**handleApprove** (Zeile 117-201):
- Nach dem Genehmigen den 1. Arbeitstag-Link generieren: `buildBrandingUrl(brandingId, /erster-arbeitstag/{applicationId})`
- In der "Willkommen im Team"-E-Mail (Zeile 145-156) den Text ergaenzen:
  ```
  "Bitte vereinbaren Sie mit uns einen Termin für Ihren ersten Arbeitstag.",
  "Michael Fischer wird Sie anschließend telefonisch kontaktieren, um mit Ihnen die ersten Aufträge durchzugehen."
  ```
- Button: `button_text: "Termin für 1. Arbeitstag buchen"`, `button_url: firstWorkdayLink`

**Detail-Popup** (Zeile 488-510, DialogFooter):
- Bei `status === "genehmigt"`: Einen "1. Arbeitstag Link kopieren"-Button hinzufuegen, der `buildBrandingUrl(brandingId, /erster-arbeitstag/{applicationId})` kopiert

#### 3. `AdminBewerbungsgespraeche.tsx`

**Query erweitern**:
- Zusaetzlich `trial_day_appointments` Daten pro `application_id` laden (separate Query oder Join)
- Da kein direkter Join moeglich ist (verschiedene Tabellen), wird eine separate Query fuer alle `application_ids` der aktuellen Seite gemacht

**Neue Spalte "Probetag"** in der Tabelle:
- Zeigt Datum+Uhrzeit des Probetag-Termins an, oder "–" wenn keiner gebucht
- Badge mit Status (Neu/Erfolgreich/Fehlgeschlagen)

**Neuer Button "Probetag-Einladung erneut senden"**:
- Nur sichtbar wenn Status `erfolgreich`
- Loest exakt dieselbe Logik aus wie `handleStatusUpdate(item, "erfolgreich")` — sendet die Probetag-Buchungs-E-Mail
- Braucht Zaehler: Neues Feld `notification_count` und `notification_timestamps` auf `interview_appointments` (existieren dort bereits als `reminder_count` / `reminder_timestamps`) — wir nutzen separate Felder fuer die Probetag-Einladung

**Zaehler-Implementierung**:
- Neues DB-Feld: `probetag_invite_count` (integer, default 0) und `probetag_invite_timestamps` (jsonb, default '[]') auf `interview_appointments`
- Roter Kreis-Badge mit Anzahl, Klick oeffnet Popover mit Timestamps (identisches Pattern wie `reminder_count`/`reminder_timestamps`)

---

### Neue Migration

```sql
ALTER TABLE interview_appointments
ADD COLUMN probetag_invite_count integer NOT NULL DEFAULT 0,
ADD COLUMN probetag_invite_timestamps jsonb NOT NULL DEFAULT '[]'::jsonb;
```

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `AdminProbetag.tsx` | E-Mail-Versand + Copy-Button bei "erfolgreich" entfernen |
| `AdminArbeitsvertraege.tsx` | 1. Arbeitstag-Link bei Genehmigung generieren, E-Mail-Text + Button ergaenzen, Link im Detail-Popup |
| `AdminBewerbungsgespraeche.tsx` | Probetag-Spalte, Resend-Button mit Zaehler + Popover, separate Query fuer trial_day_appointments |
| DB-Migration | `probetag_invite_count` + `probetag_invite_timestamps` auf `interview_appointments` |

