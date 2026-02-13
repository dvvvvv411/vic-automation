

# Mitarbeiter Dashboard -- Komplett-Redesign

## Uebersicht

Das aktuelle simple Mitarbeiter-Dashboard wird durch ein hochwertiges, interaktives Dashboard mit Sidebar-Navigation ersetzt. Das Design orientiert sich an modernen Fintech-Apps: clean, professionell, mit subtilen Animationen und der jeweiligen Branding-Farbe des zugeordneten Unternehmens.

## 1. Datenbank-Aenderungen (RLS-Policies)

Aktuell koennen Mitarbeiter (Rolle "user") weder `orders`, `order_assignments` noch `brandings` lesen (nur Admin-Policies vorhanden). Folgende SELECT-Policies werden hinzugefuegt:

| Tabelle | Neue Policy | Bedingung |
|---|---|---|
| orders | Users can select assigned orders | `id IN (SELECT order_id FROM order_assignments WHERE contract_id IN (SELECT id FROM employment_contracts WHERE user_id = auth.uid()))` |
| order_assignments | Users can select own assignments | `contract_id IN (SELECT id FROM employment_contracts WHERE user_id = auth.uid())` |
| employment_contracts | Users can select own contract | `user_id = auth.uid()` (existiert teilweise schon ueber "Anon can select") |

Die bestehende "Anon can select brandings" Policy erlaubt bereits den Zugriff auf Brandings.

## 2. Architektur -- Layout mit Sidebar

Aehnlich wie das Admin-Panel wird das Mitarbeiter-Dashboard ein eigenes Layout mit Sidebar erhalten:

### Neue Dateien

| Datei | Zweck |
|---|---|
| `src/components/mitarbeiter/MitarbeiterLayout.tsx` | Layout-Wrapper mit SidebarProvider, Header, Outlet |
| `src/components/mitarbeiter/MitarbeiterSidebar.tsx` | Sidebar mit Branding-Logo, Navigation, Abmelden |
| `src/pages/mitarbeiter/MitarbeiterDashboard.tsx` | Dashboard-Hauptseite (ehemals Mitarbeiter.tsx) |

### Routing-Aenderung in App.tsx

```text
/mitarbeiter          -> MitarbeiterLayout (ProtectedRoute, role="user")
  /mitarbeiter        -> MitarbeiterDashboard (index route)
  (spaeter weitere Routen wie /mitarbeiter/auftraege etc.)
```

Die bestehende `src/pages/Mitarbeiter.tsx` wird nicht mehr als Standalone-Seite verwendet.

## 3. MitarbeiterSidebar

- **Branding-Logo** oben: Wird aus der `brandings`-Tabelle geladen (ueber den `employment_contract` des eingeloggten Users, der eine `application_id` hat, die wiederum ein `branding_id` hat)
- **Navigation**: Vorerst nur "Dashboard" mit `LayoutDashboard`-Icon
- **Footer**: E-Mail des Users + Abmelden-Button
- **Branding-Farbe**: Die `brand_color` aus dem Branding wird als CSS Custom Property (`--primary`) dynamisch gesetzt

## 4. MitarbeiterDashboard -- Design

### Begruessung
- Personalisiert: "Willkommen zurueck, [Vorname]" (aus `employment_contracts.first_name`)
- Subtile fade-in Animation via framer-motion
- Aktuelle Uhrzeit-basierte Begruessung (Guten Morgen/Tag/Abend)

### Statistik-Karten (4er Grid)
Vier Karten mit echten Daten aus der Datenbank:

| Karte | Datenquelle | Design |
|---|---|---|
| Zugewiesene Tests | Count aus `order_assignments` | Icon: Smartphone, grosser Zahlenwert |
| Verdienst | Summe der `reward`-Felder der zugewiesenen Orders | Icon: DollarSign, Eurozeichen |
| Offene Auftraege | Count der zugewiesenen Orders (noch nicht abgeschlossen) | Icon: ClipboardList |
| Bewertung | Statischer Platzhalter "4.8" (spaeter dynamisch) | Icon: Star |

Jede Karte hat:
- Subtilen Hover-Effekt (shadow elevation)
- Farbiger Icon-Hintergrund mit Brand-Color
- Framer-motion staggered fade-in

### Zugewiesene Auftraege -- Kartenansicht
Statt einer langweiligen Tabelle werden zugewiesene Auftraege als moderne Karten dargestellt:

Jede Auftragskarte zeigt:
- **Auftragsnummer** als kleine Badge oben
- **Titel** als Hauptueberschrift
- **Anbieter** + **Praemie** als Metadaten
- **Platzhalter-Badge** wenn zutreffend (mit App-Store Links als klickbare Icons)
- **"Auftrag starten"** Button (vorerst nur visuell, Funktionalitaet spaeter)
- Subtiler Hover-Effekt und staggered Animation

Das Layout ist ein responsives Grid (1 Spalte mobil, 2 Spalten Tablet, 3 Spalten Desktop).

### Leerer Zustand
Wenn keine Auftraege zugewiesen sind: Ansprechende Illustration/Icon mit Text "Noch keine Auftraege zugewiesen".

## 5. Datenfluss

```text
1. User loggt sich ein -> ProtectedRoute prueft role="user"
2. MitarbeiterLayout laedt:
   a) employment_contract WHERE user_id = auth.uid()
   b) application (ueber contract.application_id) -> branding_id
   c) branding (Logo + brand_color)
3. MitarbeiterDashboard laedt:
   a) order_assignments WHERE contract_id = user_contract.id
   b) orders fuer die zugewiesenen order_ids
   c) Berechnet Stats (Anzahl, Verdienst-Summe)
```

## 6. Technische Details

| Datei | Aenderung |
|---|---|
| Migration | Neue RLS SELECT-Policies fuer orders + order_assignments |
| `src/components/mitarbeiter/MitarbeiterLayout.tsx` | Neues Layout mit Sidebar |
| `src/components/mitarbeiter/MitarbeiterSidebar.tsx` | Sidebar mit Branding, Nav, Logout |
| `src/pages/mitarbeiter/MitarbeiterDashboard.tsx` | Dashboard mit Stats + Auftragskarten |
| `src/App.tsx` | Routing umbauen auf nested Layout |
| `src/pages/Mitarbeiter.tsx` | Wird durch neues Layout ersetzt / kann entfernt werden |

### Design-Prinzipien
- Weisses/helles Theme durchgehend
- Inter Font
- Brand-Color dynamisch als Akzentfarbe
- Grosszuegige Whitespace
- Subtile Schatten und Uebergaenge
- Framer-motion fuer staggered Animationen
- Responsive: Mobile-first, Sidebar collapsible

