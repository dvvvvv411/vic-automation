

# Admin Bewerbungsgespraeche - Umfassende Ueberarbeitung

## Uebersicht

Die Seite `/admin/bewerbungsgespraeche` wird komplett ueberarbeitet: Standardansicht zeigt nur Termine von heute und morgen, vergangene Termine werden nach 1 Stunde ausgeblendet, und es gibt neue Buttons fuer vergangene/zukuenftige Termine. Dazu kommt eine Status- und Aktionsspalte.

## Aenderungen

### 1. Neue Datenbankspalte: `status` auf `interview_appointments`

Eine neue Spalte `status` (text, default `'neu'`) wird zur Tabelle `interview_appointments` hinzugefuegt. Moegliche Werte: `neu`, `erfolgreich`, `fehlgeschlagen`.

Zusaetzlich eine neue Database Function `update_interview_status`, um den Status sicher zu aendern (analog zu `update_application_status`).

### 2. Drei Ansichtsmodi mit Filterlogik

| Modus | Filter |
|---|---|
| **Standard** (default) | Termine von heute und morgen. Heutige Termine werden ausgeblendet, wenn ihr Zeitpunkt mehr als 1 Stunde zurueckliegt. |
| **Vergangene** | Alle Termine vor heute + heutige abgelaufene (>1h). Absteigend sortiert. |
| **Zukuenftige** | Alle Termine ab uebermorgen aufwaerts. Aufsteigend sortiert. |

Zwei Buttons oberhalb der Tabelle: "Vergangene Termine" und "Zukuenftige Termine". Ein aktiver Button kann erneut geklickt werden, um zurueck zur Standardansicht zu wechseln.

### 3. Tabellenspalten-Reihenfolge (neu)

Datum | Uhrzeit | Name | Telefon | E-Mail | Branding | Status | Aktionen

- **Telefon** und **E-Mail** werden getauscht
- **Status**: Badge mit Farben -- "Neu" (grau/outline), "Erfolgreich" (gruen), "Fehlgeschlagen" (rot/destructive)
- **Aktionen**: Zwei Icon-Buttons (CheckCircle fuer Erfolgreich, XCircle fuer Fehlgeschlagen), die den Status via RPC aendern

### 4. Pagination mit 20 Eintraegen

PAGE_SIZE wird von 10 auf 20 erhoert.

## Technische Details

### Migration SQL

```sql
ALTER TABLE public.interview_appointments
ADD COLUMN status text NOT NULL DEFAULT 'neu';

CREATE OR REPLACE FUNCTION public.update_interview_status(
  _appointment_id uuid, _status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.interview_appointments
  SET status = _status
  WHERE id = _appointment_id;
END;
$$;
```

### Filterlogik im Frontend (Pseudocode)

```text
today = format(new Date(), "yyyy-MM-dd")
tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd")
cutoffTime = format(subHours(new Date(), 1), "HH:mm:ss")

Standard-Modus:
  .gte("appointment_date", today)
  .lte("appointment_date", tomorrow)
  Dann clientseitig: heutige Termine nur anzeigen wenn
    appointment_time >= cutoffTime

Vergangene:
  .lt("appointment_date", today)
  ODER (appointment_date == today AND appointment_time < cutoffTime)
  Sortierung: absteigend

Zukuenftige:
  .gt("appointment_date", tomorrow)
  Sortierung: aufsteigend
```

### Geaenderte Dateien

| Datei | Aenderung |
|---|---|
| Migration SQL | Neue Spalte `status` + Funktion `update_interview_status` |
| `src/integrations/supabase/types.ts` | Wird automatisch aktualisiert |
| `src/pages/admin/AdminBewerbungsgespraeche.tsx` | Komplette Ueberarbeitung: View-Modus-State, Filterlogik, neue Spaltenreihenfolge, Status-Badge, Aktions-Buttons, PAGE_SIZE 20, Query-Invalidierung nach Status-Update |

