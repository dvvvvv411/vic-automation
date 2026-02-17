

# PDF-Viewer minimalisieren

## Problem
Der Arbeitsvertrag wird aktuell im Browser-eigenen PDF-Viewer angezeigt (mit Toolbar, Seitennavigation, Zoom-Buttons etc.). Gewuenscht ist eine minimalistische Darstellung, die nur die PDF-Seiten zeigt.

## Loesung

**Datei:** `src/components/mitarbeiter/ContractSigningView.tsx`

Die iframe `src` URL bekommt PDF-Viewer-Parameter angehaengt, die die Toolbar und Navigation ausblenden:

```
src={`${contractPdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
```

Das blendet in den meisten Browsern (Chrome, Edge, Firefox) die komplette Toolbar, Seitenleiste und Scrollbar-Controls aus. Es werden nur noch die reinen PDF-Seiten angezeigt, durch die der Nutzer scrollen kann.

## Betroffene Datei

| Datei | Aenderung |
|-------|-----------|
| `src/components/mitarbeiter/ContractSigningView.tsx` | PDF-URL um Viewer-Parameter ergaenzen (1 Zeile) |

