

# Mobile-Optimierung der Vertragsunterzeichnung

## Probleme

1. PDF ist auf Mobile nicht vollstaendig lesbar
2. "Vertrag unterschreiben"-Button ist unter dem PDF und nicht erreichbar
3. Kein Download-Button fuer das ununterschriebene PDF

## Aenderungen (nur Mobile, Desktop bleibt identisch)

**Datei: `src/components/mitarbeiter/ContractSigningView.tsx`**

### 1. Buttons ueber das PDF verschieben (nur Mobile)

Zwei Button-Bereiche:
- **Mobile** (`md:hidden`): Buttons werden **oberhalb** des PDF-Viewers angezeigt
- **Desktop** (`hidden md:flex`): Button bleibt **unterhalb** des PDF-Viewers wie bisher

### 2. PDF-Hoehe auf Mobile reduzieren

Statt inline `height: 65vh` werden responsive Tailwind-Klassen verwendet: `h-[50vh] md:h-[65vh]`, damit auf Mobile mehr Platz bleibt und der Content scrollbar ist.

### 3. Dezenter Download-Button (nur Mobile)

Ein kleiner, zurueckhaltender Button (variant `ghost` oder `outline`, klein) mit Download-Icon wird nur auf Mobile ueber dem PDF angezeigt. Er oeffnet die PDF-URL in einem neuen Tab zum vollstaendigen Lesen.

### Layout nach Aenderung

```text
Mobile:                              Desktop (unveraendert):
[Icon + Titel + Text]               [Icon + Titel + Text]
[Vertrag unterschreiben]  (md:hidden) [PDF Viewer - 65vh]
[Vertrag herunterladen]   (md:hidden) [Vertrag unterschreiben]
[PDF Viewer - 50vh]
```

Keine neuen Dateien, keine neuen Abhaengigkeiten. Nur Tailwind-responsive-Klassen und ein zusaetzlicher `<a>`/`<Button>` fuer den Download.

