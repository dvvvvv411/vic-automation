

# Neuer Reiter "Meine Daten" im Mitarbeiter-Panel

## Uebersicht

Neue Seite `/mitarbeiter/meine-daten` als reiner Read-Only-Bereich, in dem der Mitarbeiter seine persoenlichen Daten, Statistiken und Bankdaten einsehen kann.

## Aufbau der Seite

### Sektion 1: Persoenliche Informationen (Card)
- Vor- und Nachname
- E-Mail, Telefonnummer
- Strasse, PLZ, Ort

### Sektion 2: Statistiken (Card)
- Anzahl bewerteter Auftraege (aus `order_reviews` gruppiert nach `order_id`)
- Durchschnittliche Bewertung (Sterne in Gold)
- Gesamtverdienst / Kontostand (`balance` aus `employment_contracts`)

### Sektion 3: Bankkarte (visuell gestaltete Card)
- Visualisierung als Kreditkarten-Design mit Gradient-Hintergrund
- Zeigt: Kontoinhaber (Name), IBAN, BIC, Bankname
- Rein dekorativ, keine Interaktion

## Technische Umsetzung

| Datei | Aenderung |
|---|---|
| `src/pages/mitarbeiter/MeineDaten.tsx` | Neue Seite erstellen |
| `src/components/mitarbeiter/MitarbeiterSidebar.tsx` | Nav-Item "Meine Daten" mit `User`-Icon hinzufuegen |
| `src/App.tsx` | Route `meine-daten` registrieren |

### Datenquellen
- **Persoenliche Daten + Bankdaten + Balance**: `employment_contracts` (bereits per RLS fuer den Mitarbeiter lesbar ueber die bestehende Anon-Policy)
- **Statistiken**: `order_reviews` (eigene Reviews per RLS lesbar) + `order_assignments` (eigene Zuweisungen per RLS lesbar)

### Bankkarten-Design

```text
+--------------------------------------+
|                                      |
|  IBAN                                |
|  DE89 3704 0044 0532 0130 00         |
|                                      |
|  BIC: COBADEFFXXX                    |
|  Sparkasse Musterstadt              |
|                                      |
|  Max Mustermann                      |
+--------------------------------------+
```

Gradient-Hintergrund (z.B. `from-slate-800 to-slate-600`), weisse Schrift, abgerundete Ecken, leichter Schatten -- aehnlich einer echten Bankkarte.

### Sidebar-Eintrag
Neues Item in `navItems` Array:
```
{ title: "Meine Daten", url: "/mitarbeiter/meine-daten", icon: User }
```

### Patterns
- Gleicher `useOutletContext` Pattern wie alle anderen Mitarbeiter-Seiten
- Daten werden per `supabase.from("employment_contracts")` geladen (Contract-ID aus Context)
- Statistiken per separatem Query auf `order_reviews` und `order_assignments`
- `framer-motion` Animationen wie auf den anderen Seiten
- Gleicher Card-Stil (border-border/60, shadow-sm)

