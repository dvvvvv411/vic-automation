

## Probetag & 1. Arbeitstag: Gemeinsame Zeitplanung

### Ziel
Probetag- und 1. Arbeitstag-Termine sollen sich gegenseitig blockieren — ein gebuchter Probetag-Slot ist auch fuer 1. Arbeitstag nicht mehr verfuegbar und umgekehrt.

### Aenderungen

**1. `Probetag.tsx` — bookedSlots Query (Zeile 92-110)**
- Zusaetzlich `first_workday_appointments` fuer die gleichen Branding-Applications laden
- Beide Ergebnisse zusammenfuehren in ein gemeinsames Array

**2. `ErsterArbeitstag.tsx` — bookedSlots Query (Zeile 90-107)**
- Zusaetzlich `trial_day_appointments` fuer die gleichen Branding-Applications laden
- Beide Ergebnisse zusammenfuehren in ein gemeinsames Array

**3. `ErsterArbeitstag.tsx` — Schedule Settings (Zeile 76-88)**
- `schedule_type` von `"first_workday"` auf `"trial"` aendern, damit beide denselben Zeitplan nutzen

**4. `AdminZeitplan.tsx` — Tab "1. Arbeitstag" entfernen**
- Den separaten Tab fuer 1. Arbeitstag entfernen, da Probetag-Einstellungen jetzt fuer beide gelten
- TrialDayBlocker-Tab umbenennen zu "Probetag & 1. Arbeitstag"

**5. `ErsterArbeitstag.tsx` — blockedSlotsData Query (Zeile 109-120)**
- Zusaetzlich `trial_day_blocked_slots` laden und mit `first_workday_blocked_slots` zusammenfuehren

**6. `Probetag.tsx` — blockedSlotsData Query (Zeile 112-124)**
- Zusaetzlich `first_workday_blocked_slots` laden und mit `trial_day_blocked_slots` zusammenfuehren

### Kein DB-Aenderung noetig
Die bestehenden Tabellen bleiben unveraendert. Nur die Frontend-Logik wird angepasst, damit beide Buchungsseiten die Termine der jeweils anderen Tabelle als belegt betrachten.

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `Probetag.tsx` | Auch first_workday_appointments + blocked_slots laden |
| `ErsterArbeitstag.tsx` | Auch trial_day_appointments + blocked_slots laden, schedule_type "trial" nutzen |
| `AdminZeitplan.tsx` | 1. Arbeitstag-Tab entfernen, Probetag-Tab umbenennen |

