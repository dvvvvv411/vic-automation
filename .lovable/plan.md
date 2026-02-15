

# Auftragsdetails-Seite fuer Mitarbeiter

## Was wird gebaut

Eine neue Seite unter `/mitarbeiter/auftragdetails/:id`, die beim Klick auf "Auftrag starten" im Dashboard angezeigt wird. Sie zeigt alle Details eines Auftrags uebersichtlich an: Titel, Auftragsnummer, Anbieter, Praemie, Projektziel, Bewertungsfragen sowie App-Store-Links.

## Seitenaufbau

```text
┌──────────────────────────────────────────────┐
│ [<- Zurueck]              Badge: #AUF-001    │
├──────────────────────────────────────────────┤
│                                              │
│  Titel des Auftrags                          │
│  Anbieter: XYZ Corp         Praemie: €50     │
│                                              │
├──────────────────────────────────────────────┤
│  Projektziel                                 │
│  ─────────                                   │
│  Beschreibungstext des Projektziels...       │
│                                              │
├──────────────────────────────────────────────┤
│  Bewertungsfragen                            │
│  ─────────────────                           │
│  1. Wie war die Benutzeroberflaeche?         │
│  2. Gab es technische Probleme?              │
│  3. ...                                      │
│                                              │
├──────────────────────────────────────────────┤
│  Downloads                                   │
│  [App Store]  [Play Store]                   │
│                                              │
└──────────────────────────────────────────────┘
```

## Aenderungen

| Datei | Aenderung |
|---|---|
| `src/pages/mitarbeiter/AuftragDetails.tsx` | **Neue Datei** -- Detailseite mit Laden des Auftrags per `useParams().id` aus der `orders`-Tabelle |
| `src/App.tsx` | Neue Route `auftragdetails/:id` als Child-Route von `/mitarbeiter` hinzufuegen |
| `src/pages/mitarbeiter/MitarbeiterDashboard.tsx` | "Auftrag starten"-Button mit `useNavigate` zu `/mitarbeiter/auftragdetails/${order.id}` verlinken |

## Technische Details

- Der Auftrag wird ueber `supabase.from("orders").select("*").eq("id", id).maybeSingle()` geladen
- Zusaetzlich wird geprueft, ob der Mitarbeiter ueber `order_assignments` dem Auftrag zugewiesen ist (Sicherheit)
- `review_questions` ist ein JSON-Feld -- wird als Array von Strings geparst und als nummerierte Liste dargestellt
- Zurueck-Button navigiert per `useNavigate(-1)` zum Dashboard
- Loading- und Fehlerzustaende werden mit Skeleton bzw. Fehlermeldung abgedeckt
- Die Seite nutzt `useOutletContext` fuer `contract`-Daten (gleich wie das Dashboard)

