

# Plan: Telefonnummer-Management bei Idents verbessern & SMS-Anzeige fixen

## Zusammenfassung

4 Probleme werden behoben:
1. **Admin**: Telefonnummer wird erst bei "Speichern & Senden" gespeichert → Mitarbeiter sieht keine SMS
2. **Admin**: Keine aufgeloeste Telefonnummer sichtbar
3. **Mitarbeiter**: SMS werden nicht angezeigt (weil `phone_api_url` in DB null bleibt)  
4. **Mitarbeiter**: Countdown fehlt / aufgeloeste Telefonnummer nicht sichtbar

## Aenderungen

### 1. `AdminIdentDetail.tsx` – Telefonnummer-Card umbauen

**Telefonnummer separat speichern** (nicht mehr ueber "Speichern & Senden"):

- Neuen "Zuweisen"-Button in der Telefonnummer-Card hinzufuegen
- Beim Klick: `phone_api_url` sofort in DB schreiben (mit URL-Normalisierung)
- Dropdown-Auswahl (`onValueChange`) soll ebenfalls sofort speichern
- Aufgeloeste Telefonnummer als Badge/Info anzeigen (aus `phoneDisplayMap`)
- "Neue Nummer hinzufuegen"-Bereich: Input + Button der in `phone_numbers`-Tabelle mit `branding_id` einfuegt

**handleSave aendern**: `phone_api_url` aus dem Update entfernen – nur noch `test_data` und `status` speichern.

### 2. `AdminIdentDetail.tsx` – Aufgeloeste Nummer anzeigen

- Wenn `phoneUrl` gesetzt ist und in `phoneDisplayMap` aufgeloest wurde: Badge mit Telefonnummer anzeigen (z.B. "📞 +49 123 456789")
- Falls URL manuell eingegeben und noch nicht aufgeloest: nach Zuweisen einmalig anosim-proxy aufrufen und Nummer anzeigen

### 3. `AuftragDetails.tsx` (Mitarbeiter) – SMS-Anzeige & Countdown fixen

Durch das sofortige Speichern der `phone_api_url` (Punkt 1) bekommt der Mitarbeiter die URL via Realtime/Refetch → `hasPhone` wird `true` → SMS werden geladen.

Zusaetzlich:
- Aufgeloeste Telefonnummer anzeigen: `useEffect` der bei `identSession?.phone_api_url` anosim-proxy aufruft und Nummer in State speichert. Anzeige als Info-Box oberhalb der SMS-Liste.
- Countdown-Text: Bereits korrekt implementiert, funktioniert sobald `hasPhone` true ist.
- "Keine SMS-Nachrichten vorhanden" Text aendern zu "Warte auf Telefonnummer-Zuweisung..." wenn `!hasPhone`.

### Betroffene Dateien

| Datei | Aenderungen |
|---|---|
| `src/pages/admin/AdminIdentDetail.tsx` | Telefon-Card mit Zuweisen-Button, Auto-Save bei Dropdown, handleSave ohne phone_api_url, aufgeloeste Nummer anzeigen, neue Nummer hinzufuegen |
| `src/pages/mitarbeiter/AuftragDetails.tsx` | Aufgeloeste Telefonnummer anzeigen, "Warte auf Zuweisung"-Text |

Keine DB-Aenderungen noetig – alle benoetigten Tabellen und Spalten existieren bereits.

