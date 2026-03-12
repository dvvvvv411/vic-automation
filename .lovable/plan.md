

# Stabile Sortierung + Massen-Akzeptierung für Bewerbungen

## Problem 1: Zeilen springen nach Akzeptieren
Nach `acceptMutation.onSuccess` wird `invalidateQueries` aufgerufen, was einen Refetch auslöst. Während des Refetchs kann sich die Reihenfolge kurzzeitig ändern. 

**Lösung**: Statt `invalidateQueries` ein optimistisches Update mit `queryClient.setQueryData` verwenden — der Status wird direkt im Cache auf `bewerbungsgespraech` gesetzt. Die Zeile bleibt an ihrer Position.

## Problem 2: Mehrere Bewerbungen gleichzeitig akzeptieren (Queue)

### UI-Änderungen
- Checkbox-Spalte links in der Tabelle (nur für Bewerbungen mit Status `neu`)
- "Ausgewählte akzeptieren"-Button in der Header-Leiste (erscheint wenn ≥1 ausgewählt)
- Fortschrittsanzeige während der Queue-Verarbeitung (z.B. "3/7 verarbeitet...")
- Jede erfolgreich verarbeitete Bewerbung wird sofort im Cache aktualisiert (optimistisch)

### Logik
- State: `selectedIds: Set<string>` für ausgewählte Bewerbungen
- State: `bulkProcessing: { total, current, inProgress }` für Queue-Status
- Beim Klick auf "Ausgewählte akzeptieren": Sequentielle Verarbeitung über eine `for`-Schleife
- Pro Bewerbung: `acceptMutation.mutateAsync(app)` aufrufen, nach Erfolg nächste starten
- Bei Fehler: Fehlermeldung anzeigen, mit nächster fortfahren
- Am Ende: Zusammenfassung als Toast ("X von Y erfolgreich akzeptiert")

### Betroffene Datei
| Datei | Änderung |
|-------|----------|
| `src/pages/admin/AdminBewerbungen.tsx` | Checkbox-Spalte, Selection-State, Bulk-Accept-Button, Queue-Logik, optimistisches Cache-Update |

