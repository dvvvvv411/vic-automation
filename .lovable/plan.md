

## Stundenlohn-Untermodell fuer Festgehalt-Brandings

### Uebersicht

Wenn ein Branding auf "Festgehalt" steht, soll man zusaetzlich waehlen koennen: **Festgehalt** (wie bisher) oder **Stundenlohn**. Bei Stundenlohn wird ein Stundensatz pro Anstellungsart (Minijob/Teilzeit/Vollzeit) hinterlegt. Im Mitarbeiter-Panel wird dann anhand der `estimated_hours` aus erfolgreich abgeschlossenen Auftraegen berechnet, wie viel der Mitarbeiter verdient hat.

---

### 1. Datenbank-Migration

Neue Spalte auf `brandings`:

```sql
ALTER TABLE public.brandings
  ADD COLUMN hourly_rate_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN hourly_rate_minijob numeric,
  ADD COLUMN hourly_rate_teilzeit numeric,
  ADD COLUMN hourly_rate_vollzeit numeric;
```

Kein neues Vergütungsmodell noetig — `payment_model` bleibt `fixed_salary`, das Boolean `hourly_rate_enabled` steuert die Unterauswahl.

---

### 2. Admin Branding-Formular (`AdminBrandingForm.tsx`)

Wenn `payment_model === "fixed_salary"`:
- Neue RadioGroup: **Festgehalt** vs **Stundenlohn** (gesteuert durch `hourly_rate_enabled`)
- Bei Festgehalt: Minijob/Teilzeit/Vollzeit Felder (wie bisher)
- Bei Stundenlohn: Drei Felder fuer Stundensatz Minijob/Teilzeit/Vollzeit (€/Stunde)

Formular-Schema erweitern um `hourly_rate_enabled`, `hourly_rate_minijob`, `hourly_rate_teilzeit`, `hourly_rate_vollzeit`.

---

### 3. MitarbeiterLayout — Branding-Daten erweitern

In `MitarbeiterLayout.tsx` die Branding-Select-Query erweitern um die neuen Spalten: `hourly_rate_enabled`, `hourly_rate_minijob`, `hourly_rate_teilzeit`, `hourly_rate_vollzeit`.

Das BrandingData-Interface entsprechend erweitern und ueber den Outlet-Context an alle Mitarbeiter-Seiten durchreichen.

---

### 4. Mitarbeiter-Dashboard (`MitarbeiterDashboard.tsx`)

**Berechnung bei Stundenlohn:**
- Lade alle `order_assignments` mit Status `erfolgreich` fuer den Contract
- Lade die zugehoerigen `orders` inkl. `estimated_hours`
- Summiere `estimated_hours` aller erfolgreichen Auftraege
- Multipliziere mit dem Stundensatz des passenden Anstellungstyps

**Anzeige:**
- Stats-Card "Festgehalt" → zeigt stattdessen berechneten Stundenlohn-Verdienst
- Label aendert sich zu "Verdienst (Stundenlohn)"
- `DashboardPayoutSummary` erhaelt den berechneten Betrag statt des fixen Gehalts

Ein Auftrag zaehlt nur als "erfolgreich" wenn:
- Auftraege OHNE erforderliche Anhaenge: Bewertung genehmigt (Status = `erfolgreich`)
- Auftraege MIT erforderlichen Anhaengen: Bewertung + Anhaenge genehmigt (Status = `erfolgreich`)

→ Das ist bereits durch den bestehenden Status `erfolgreich` abgedeckt, da dieser erst gesetzt wird wenn beides genehmigt wurde.

---

### 5. Meine Daten (`MeineDaten.tsx`)

**Statistik-Card:**
- Bei Stundenlohn: Label "Verdienst" statt "Festgehalt", Wert = Summe (erfolgreich_hours × Stundensatz)

**Gehaltsauszahlung:**
- Bei Stundenlohn: "Voraussichtlicher Betrag" = berechnete Summe der erfolgreichen Auftraege dieses Monats

**Verdienst-Historie:**
- Aktuell bei `isFixedSalary` ausgeblendet
- Neue Bedingung: Einblenden wenn `hourly_rate_enabled === true`
- Tabelle zeigt pro erfolgreichem Auftrag: Titel, Stunden (`estimated_hours`), Betrag (Stunden × Stundensatz), Datum
- Spalten: Auftrag | Stunden | Verdienst | Datum

---

### 6. Auftraege-Seite (`MitarbeiterAuftraege.tsx`)

Bei Stundenlohn-Modell: Statt Praemie den berechneten Verdienst (estimated_hours × Stundensatz) anzeigen bei erfolgreich abgeschlossenen Auftraegen.

---

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| **Migration** | 4 neue Spalten auf `brandings` |
| `AdminBrandingForm.tsx` | Unterauswahl Festgehalt/Stundenlohn + Stundensatz-Felder |
| `MitarbeiterLayout.tsx` | Branding-Query + Interface erweitern |
| `MitarbeiterDashboard.tsx` | Stundenlohn-Berechnung fuer Stats + Payout |
| `MeineDaten.tsx` | Stundenlohn-Berechnung + Verdienst-Historie einblenden |
| `DashboardPayoutSummary.tsx` | Label-Anpassung fuer Stundenlohn |
| `MitarbeiterAuftraege.tsx` | Verdienst pro Auftrag anzeigen |

