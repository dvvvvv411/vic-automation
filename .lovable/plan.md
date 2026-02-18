

# Alle Hosts in der Vite-Config erlauben

## Problem

Beim Zugriff ueber die Domain `web.47-skys.de` blockiert Vite die Anfrage, weil der Host nicht in der erlaubten Liste steht.

## Loesung

In `vite.config.ts` wird `server.allowedHosts` auf `"all"` gesetzt, damit alle Hosts erlaubt sind.

## Betroffene Datei

| Datei | Aenderung |
|-------|-----------|
| `vite.config.ts` | `allowedHosts: "all"` im `server`-Block ergaenzen |

