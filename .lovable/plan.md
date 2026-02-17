

# Admin Dashboard ueberarbeiten - Echte Daten statt Platzhalter

## Uebersicht
Das aktuelle Dashboard zeigt nur hartcodierte Platzhalter-Statistiken. Es wird komplett ueberarbeitet mit echten Daten aus der Datenbank fuer die fuenf wichtigsten Bereiche.

## Layout

### Oberer Bereich: 5 Statistik-Cards (Grid)
Jede Card zeigt eine Zahl mit Icon und ist klickbar (navigiert zum jeweiligen Bereich):

| Card | Datenquelle | Anzeige | Link |
|------|------------|---------|------|
| Neue Bewerbungen | `applications` mit `status = 'neu'` | Anzahl neue Bewerbungen | `/admin/bewerbungen` |
| Gespraeche heute | `interview_appointments` mit `appointment_date = heute` | Anzahl heutiger Termine | `/admin/bewerbungsgespraeche` |
| Offene Vertraege | `employment_contracts` mit `status = 'eingereicht'` | Anzahl eingereichte Vertraege | `/admin/arbeitsvertraege` |
| Termine heute | `order_appointments` mit `appointment_date = heute` | Anzahl heutiger Auftragstermine | `/admin/auftragstermine` |
| Ungelesene Chats | `chat_messages` mit `sender_role = 'user'` und `read = false` | Anzahl ungelesener Nachrichten | `/admin/livechat` |

### Unterer Bereich: Detail-Listen (2-Spalten Grid)

**Linke Spalte:**
- **Neueste Bewerbungen**: Die letzten 5 Bewerbungen mit Name, Status und Datum (aus `applications`, sortiert nach `created_at desc`, Limit 5)
- **Heutige Gespraeche**: Alle Gespraeche fuer heute mit Name (ueber Join auf `applications`), Uhrzeit und Status

**Rechte Spalte:**
- **Eingereichte Vertraege**: Die letzten 5 eingereichten Vertraege mit Name und Eingangsdatum
- **Heutige Auftragstermine**: Alle Termine fuer heute mit Mitarbeitername und Uhrzeit
- **Ungelesene Chat-Nachrichten**: Anzahl ungelesener Nachrichten pro Konversation (gruppiert nach `contract_id`), die letzten 5

## Technische Details

### Datei: `src/pages/admin/AdminDashboard.tsx`
- Komplett neu geschrieben
- 5 `useQuery`-Hooks fuer die Statistik-Cards (aehnlich wie bereits in `AdminSidebar.tsx` fuer Badges)
- 5 weitere `useQuery`-Hooks fuer die Detail-Listen
- `useNavigate` aus react-router-dom fuer klickbare Cards
- `format` aus date-fns fuer Datumsformatierung
- Icons: `FileText`, `Calendar`, `FileCheck`, `CalendarClock`, `MessageCircle` (passend zur Sidebar)
- Jede Detail-Liste wird in einer eigenen Card dargestellt mit Tabelle oder einfacher Liste
- Loading-State mit Skeleton-Komponenten
- Responsive: 1 Spalte auf Mobile, 2 Spalten auf Desktop fuer die Listen

### Keine weiteren Dateien betroffen
Alles findet in `AdminDashboard.tsx` statt. Die Supabase-Queries nutzen die bestehenden Tabellen und benoetigen keine Schema-Aenderungen.

