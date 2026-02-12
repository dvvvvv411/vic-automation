

# Bewerbungsgespraech-Seite: Logo, Bewerber-Info und Footer ueberarbeiten

## 1. Logo zentriert UEBER dem Container

Das Logo wird aus der weissen Card herausgenommen und mittig oberhalb platziert. Es steht als eigenstaendiges Element ueber dem Hauptcontainer.

## 2. Bewerber-Informationen professionell gestalten

Statt einer einfachen Textzeile mit Name und Telefonnummer wird ein strukturierter Info-Bereich mit klaren Labels erstellt:

- **Name**: Vor- und Nachname mit einem User-Icon
- **Telefon**: Telefonnummer mit einem Phone-Icon
- **Anstellungsart**: Minijob/Teilzeit/Vollzeit mit einem Briefcase-Icon (aus `application.employment_type`)

Die drei Informationen werden in einer dezenten, horizontal angeordneten Zeile mit Icons und Labels dargestellt -- kompakt, uebersichtlich, professionell.

## 3. Footer: "Powered by UNTERNEHMENSNAME"

Unterhalb des Hauptcontainers wird ein dezenter Footer-Text angezeigt: "Powered by {companyName}" in kleiner, grauer Schrift, zentriert.

## 4. Gleiche Anpassungen auf der Bestaetigungsseite

Auch die Bestaetigungsansicht (nach erfolgreicher Buchung) bekommt das Logo zentriert darueber und den "Powered by"-Footer darunter.

## Technische Details

### Geaenderte Datei

| Datei | Aenderung |
|---|---|
| `src/pages/Bewerbungsgespraech.tsx` | Logo aus Card herausnehmen und zentriert darueber setzen. Bewerber-Info als strukturierte Zeile mit Icons (User, Phone, Briefcase) fuer Name, Telefon, Anstellungsart. Employment-Type-Labels (Minijob/Teilzeit/Vollzeit) mappen. "Powered by"-Footer unter dem Container. Aenderungen auch auf der Bestaetigungsansicht. |

### Mapping fuer Anstellungsart-Labels

```text
minijob   -> Minijob
teilzeit  -> Teilzeit
vollzeit  -> Vollzeit
```

### Keine neuen Dateien oder Abhaengigkeiten

Lucide-Icons `User` und `Briefcase` werden zusaetzlich importiert (sind bereits im Projekt verfuegbar).

