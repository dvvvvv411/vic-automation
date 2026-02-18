

# Fix: Schnelleingabe nicht sichtbar (Build-Fehler beheben)

## Problem

Beim letzten Edit wurde die Funktionsdeklaration `const handleSendSms = async () => {` versehentlich entfernt. Ab Zeile 216 beginnt ein Funktionskoerper ohne Deklaration, was einen TypeScript-Fehler verursacht (`TS1128: Declaration or statement expected`). Dadurch wird die gesamte Seite nicht gerendert -- deshalb ist auch die Schnelleingabe nicht sichtbar.

## Loesung

In Zeile 215 (die leere Zeile zwischen `handleQuickSms` und dem verwaisten Funktionskoerper) muss die fehlende Deklaration eingefuegt werden:

```
const handleSendSms = async () => {
```

Das ist ein Einzeiler-Fix. Danach kompiliert die Seite wieder und sowohl die Schnelleingabe als auch der SMS-Dialog sind sichtbar.

## Betroffene Datei

| Datei | Aenderung |
|-------|-----------|
| `src/pages/admin/AdminLivechat.tsx` (Zeile 215) | Fehlende `const handleSendSms = async () => {` Deklaration einfuegen |

