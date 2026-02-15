
# Verdienst-Historie auf "Meine Daten"

## Aenderung

Neue Card unterhalb der Bankverbindung, die alle erfolgreich abgeschlossenen Auftraege mit deren Praemie als Tabelle anzeigt.

## Datenquelle

Die Daten werden bereits teilweise geladen (`order_assignments` mit Status `erfolgreich` und `orders(reward)`). Der bestehende Query wird erweitert um auch `orders(title, reward)` und `assigned_at` zu laden.

## UI

Eine neue Card mit dem Titel "Verdienst-Historie" (Icon: `History` aus lucide-react) zeigt eine Tabelle mit folgenden Spalten:

| Auftrag | Praemie | Datum |
|---------|---------|-------|
| BBVA Deutschland MyWebID | 70 € | 12.02.2026 |
| POSTBANK | 50 € | 10.02.2026 |
| test | 22 € | 08.02.2026 |

- Sortiert nach Datum absteigend (neueste zuerst)
- Falls keine Eintraege: Hinweistext "Noch keine abgeschlossenen Auftraege."
- Animiert mit `motion.div` (delay 0.4) passend zum bestehenden Stil

## Technische Umsetzung

**Datei**: `src/pages/mitarbeiter/MeineDaten.tsx`

1. Neuen State `rewardHistory` hinzufuegen mit Array von `{ title: string, reward: string, date: string }`
2. Den bestehenden `assignmentsRes`-Query erweitern: `orders(title, reward)` statt nur `orders(reward)`
3. Aus den erfolgreichen Assignments die History-Daten extrahieren und nach Datum sortieren
4. Neue Card nach der Bankverbindungs-Card rendern mit einer einfachen Tabelle (Table-Komponente)
5. Praemie wird mit Euro-Zeichen formatiert angezeigt
