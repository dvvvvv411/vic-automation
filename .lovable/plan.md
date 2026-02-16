

# Horizontale Scrollbar in der Admin-Sidebar entfernen

## Aenderung

Die `SidebarContent`-Komponente verwendet aktuell `overflow-auto`, was sowohl horizontales als auch vertikales Scrollen erlaubt. Das wird auf `overflow-y-auto overflow-x-hidden` geaendert, damit nur vertikal gescrollt werden kann.

## Technische Details

**Datei**: `src/components/ui/sidebar.tsx`, Zeile 334

Ersetze `overflow-auto` durch `overflow-y-auto overflow-x-hidden`, sodass die Zeile wird:

```
"flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden group-data-[collapsible=icon]:overflow-hidden"
```

Keine neuen Dateien oder Abhaengigkeiten noetig.

