
## Plan: 1.-Arbeitstag-Link beim Genehmigen wirklich erzeugen und exakt diesen in die Mail schicken

### Was gerade falsch läuft
Aktuell wird beim Genehmigen **nicht wirklich ein Link erzeugt**, sondern danach nur versucht, eine vorhandene `application_id` zu lesen:

- `selectedContract.applications?.id || selectedContract.application_id`
- wenn beides leer ist, gibt es **keinen Link**
- trotzdem wird die `vertrag_genehmigt`-Mail verschickt

Das ist genau der Bruch im aktuellen Flow.

### Ziel-Flow
Beim Klick auf **Genehmigen** muss der Ablauf so sein:

1. Vertrag-Daten prüfen
2. **Bewerber-ID sicher bereitstellen**
   - vorhandene `application_id` verwenden
   - falls keine existiert: **jetzt** eine passende `applications`-Zeile anlegen
3. diese `application_id` direkt auf `employment_contracts.application_id` speichern
4. daraus sofort den echten `/erster-arbeitstag/:applicationId`-Link bauen
5. **erst dann** den Vertrag genehmigen
6. **direkt danach** die `vertrag_genehmigt`-Mail mit genau diesem Link als Button senden

Damit ist der Button nicht “optional”, sondern Teil des Genehmigungsflows.

### Umsetzung

**`src/pages/admin/AdminArbeitsvertraege.tsx`**
- kleine zentrale Helper-Logik einbauen: `ensureFirstWorkdayApplicationId(contract)`
- Verhalten:
  - wenn `contract.application_id` vorhanden ist: zurückgeben
  - sonst neue `applications`-Zeile aus Vertragsdaten erzeugen
  - danach `employment_contracts.application_id` backfillen
- `handleApprove` umstellen:
  - zuerst ggf. Startdatum speichern
  - dann `applicationId` sicher erzeugen/holen
  - dann `firstWorkdayLink = buildBrandingUrl(brandingId, /erster-arbeitstag/{applicationId})`
  - wenn das nicht klappt: **Abbruch**, keine Genehmigung, keine Mail
  - danach `approve_employment_contract`
  - danach `sendEmail(... event_type: "vertrag_genehmigt", button_url: firstWorkdayLink, button_text: "Termin für 1. Arbeitstag buchen")`

### Warum das bulletproof ist
So hängt der Mail-Button nicht mehr davon ab, ob vorher zufällig schon eine `application_id` da war.

Stattdessen gilt:
- Genehmigung erzeugt/garantiert die Bewerber-ID
- daraus wird sofort der Link gebaut
- genau dieser Link geht in die Mail
- derselbe Link bleibt später auch im System gespeichert

### Eingeloggte User
Dafür ist keine neue Route nötig.

Wichtig ist nur:
- `employment_contracts.application_id` wird beim Genehmigen gesetzt
- damit ist der Link dauerhaft mit dem Mitarbeiter verknüpft
- eingeloggte User können denselben `/erster-arbeitstag/:id`-Link ebenfalls aufrufen und buchen

### Technische Details
- Kein Hardcode aus `/admin/emails`
- Kein “Template zeigt Button, echter Versand aber ohne URL”
- Wenn keine gültige Bewerber-ID erzeugt werden kann, wird **nicht genehmigt**
- Optional kann derselbe Helper auch für den bestehenden „1. Arbeitstag Link kopieren“-Button genutzt werden, damit Altverträge ebenfalls sauber funktionieren

### Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminArbeitsvertraege.tsx` | Genehmigungsflow umstellen: `application_id` sicher erzeugen/speichern, Link bauen, dann genehmigen, dann Mail senden |
