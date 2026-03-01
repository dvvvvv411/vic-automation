
# Sektion "Anstehende Startdaten" auf /admin/mitarbeiter

## Aenderung

**Datei: `src/pages/admin/AdminMitarbeiter.tsx`**

Oberhalb der bestehenden Mitarbeiter-Tabelle wird eine neue Sektion eingefuegt, die alle Mitarbeiter/Bewerber mit einem zukuenftigen `desired_start_date` (ab heute) als kompakte Karten-Liste anzeigt.

### 1. Neue Query fuer anstehende Startdaten

Eine separate `useQuery` laedt alle `employment_contracts` mit `desired_start_date >= heute`, unabhaengig vom Status (also auch "eingereicht", "offen" etc.). Die Abfrage holt Name, Status, Startdatum und Branding-Name und sortiert nach Datum aufsteigend (naechstes Datum zuerst).

### 2. UI-Sektion

Zwischen dem Header ("Mitarbeiter" / Beschreibungstext) und der Suche/Tabelle wird ein neuer Block eingefuegt:

- Ueberschrift: "Anstehende Startdaten" mit CalendarClock-Icon
- Darunter eine horizontale, scrollbare Karten-Liste (Cards)
- Jede Card zeigt: Name, Startdatum (formatiert), Status-Badge, Branding
- Falls keine anstehenden Startdaten vorhanden: dezenter Hinweistext
- Die Sektion wird mit einer motion-Animation eingeblendet

### 3. Beruecksichtigte Status-Werte

Die Query filtert nicht nach Status, sondern nur nach `desired_start_date >= today`. So werden auch Bewerber sichtbar, die noch nicht unterzeichnet haben aber ein Startdatum eingetragen haben. Status-Badges zeigen den aktuellen Stand (offen, eingereicht, genehmigt, unterzeichnet).

### Ergebnis

Admins sehen auf einen Blick, wer in den naechsten Tagen/Wochen starten soll -- unabhaengig davon, ob der Vertrag schon unterzeichnet ist oder nicht. Keine DB-Aenderungen noetig, nur eine Datei wird angepasst.
