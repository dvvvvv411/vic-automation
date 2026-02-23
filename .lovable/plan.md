

# Unterzeichnete Vertraege einsehbar machen + Copy-Button

## Uebersicht

Zwei Aenderungen an der Seite `/admin/arbeitsvertraege`:

1. Der "Daten ansehen"-Button wird auch fuer Vertraege mit Status "unterzeichnet" angezeigt
2. Im Detail-Popup wird ein Copy-Button eingefuegt, der die wichtigsten Daten im gewuenschten Format in die Zwischenablage kopiert

## Aenderungen (nur `src/pages/admin/AdminArbeitsvertraege.tsx`)

### 1. Button auch bei "unterzeichnet" anzeigen

Zeile 204: Die Bedingung wird um `"unterzeichnet"` erweitert:

```typescript
// Vorher
item.contract?.status === "eingereicht" || item.contract?.status === "genehmigt"

// Nachher
item.contract?.status === "eingereicht" || item.contract?.status === "genehmigt" || item.contract?.status === "unterzeichnet"
```

### 2. Copy-Button im Popup

Im DialogFooter (vor dem Schliessen-Button) wird ein neuer Button eingefuegt, der folgende Daten in die Zwischenablage kopiert:

```
Vorname: Max Mustermann
Geburtsdatum: 22.02.1988
Geburtsort: Essen
Adresse: Musterstraße 1, 12345 Musterstadt
Familienstand: ledig
Staatsangehörigkeit: deutsch
```

Das Geburtsdatum wird dabei ins Format TT.MM.JJJJ umgewandelt. Die Adresse wird aus Strasse, PLZ und Stadt zusammengesetzt.

## Keine weiteren Aenderungen

Keine Datenbank-Aenderungen, nur UI-Anpassungen in einer Datei.

