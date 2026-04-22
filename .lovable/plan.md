

## Plan: Zeitfilter für Funnel-Stats auf /admin/bewerbungen

### Ziel
Über den 4 Stat-Cards (Selbst registriert / Extern Allgemein / Extern META / Indeed) wird ein Zeitfilter mit drei Optionen ergänzt: **Letzte 24h**, **Letzte 7 Tage**, **Gesamt** (Default). Die Cards rechnen `total`, `booked` und `%` nur auf Basis der gefilterten Bewerbungen.

### Umsetzung

**Datei:** `src/pages/admin/AdminBewerbungen.tsx`

1. **Neuer State** direkt im Component:
   ```ts
   const [statsRange, setStatsRange] = useState<"24h" | "7d" | "all">("all");
   ```
2. **Filter-Helper** (über `created_at` der Bewerbung):
   ```ts
   const cutoff = statsRange === "24h" ? Date.now() - 86_400_000
                : statsRange === "7d"  ? Date.now() - 7*86_400_000
                : 0;
   const inRange = (a: any) => !cutoff || new Date(a.created_at).getTime() >= cutoff;
   ```
3. **Im Funnel-Stats-Block** (aktuell Zeile 860–894): vor dem Splitten in selfApps/externalApps/metaApps/indeedApps zuerst `applications.filter(inRange)` als Basis nutzen. Restliche Logik bleibt identisch.
4. **UI-Toggle** über dem Grid: ein `ToggleGroup` (`@/components/ui/toggle-group`) mit drei Items (`24h`, `7 Tage`, `Gesamt`), rechtsbündig, kleines Label „Zeitraum:". Default `"all"`.
5. **Zusatz**: kleiner Hinweis-Text neben den Cards (z. B. „Stand: letzte 24h" / „letzte 7 Tage" / „Gesamt"), damit der gewählte Zeitraum nach dem Scrollen ersichtlich bleibt.
6. Restliche Tabelle, Mutationen, Filter, Bulk-Aktionen bleiben **unverändert** — der Filter wirkt ausschließlich auf die 4 Stat-Cards.

### Was NICHT geändert wird
- Keine DB-Abfrageänderung (Filterung clientseitig auf bereits geladenen `applications`)
- Keine Änderung an der Bewerbungstabelle / Suche / Statusbadges
- Keine RLS-/Edge-Function-Änderung

### Geänderte Dateien

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminBewerbungen.tsx` | `statsRange`-State, ToggleGroup über den Cards, Filter via `created_at`, Stats rechnen auf gefilterter Liste |

### Erwartetes Ergebnis

```text
                                    Zeitraum: [ 24h | 7 Tage |*Gesamt*]

┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ Selbst regist. │ │ Extern (Allg.) │ │ Extern (META)  │ │ Indeed         │
│       42       │ │       18       │ │       9        │ │       27       │
│ 30 mit Termin  │ │ 12 mit Termin  │ │ 4 mit Termin   │ │ 19 mit Termin  │
│        71%     │ │        66%     │ │        44%     │ │        70%     │
└────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘
```

Beim Umschalten auf „24h" / „7 Tage" werden Total + Termin-Zahlen + Prozent live neu berechnet.

