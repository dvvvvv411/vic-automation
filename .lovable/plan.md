
# Badges in der Admin-Sidebar

## Uebersicht

Drei Sidebar-Menuepunkte erhalten dynamische Badges mit Echtzeit-Zahlen aus der Datenbank:

- **Bewerbungen**: Anzahl mit Status `"neu"`
- **Bewerbungsgespraeche**: Anzahl mit `appointment_date = heute` UND `appointment_time >= jetzt` (nur anstehende, nicht vergangene)
- **Arbeitsvertraege**: Anzahl mit Status `"eingereicht"`

## Technische Umsetzung

### Datei: `src/components/admin/AdminSidebar.tsx`

1. **Drei `useQuery`-Hooks** hinzufuegen, die jeweils nur `count` abfragen (kein Datentransfer):
   - `supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "neu")`
   - `supabase.from("interview_appointments").select("*", { count: "exact", head: true }).eq("appointment_date", today).gte("appointment_time", nowTime)`
   - `supabase.from("employment_contracts").select("*", { count: "exact", head: true }).eq("status", "eingereicht")`

2. **Badge-Zuordnung** ueber ein Objekt, das die URL auf die Zahl mappt:
   ```
   badgeCounts = {
     "/admin/bewerbungen": neuCount,
     "/admin/bewerbungsgespraeche": todayCount,
     "/admin/arbeitsvertraege": eingereichtCount,
   }
   ```

3. **Rendering**: Im `navItems.map` wird geprueft ob `badgeCounts[item.url] > 0` -- wenn ja, wird rechts neben dem Titel ein kleiner `Badge` (z.B. `bg-primary text-white text-xs rounded-full px-1.5`) angezeigt.

4. **Imports**: `useQuery` von `@tanstack/react-query`, `supabase` Client, `Badge` Komponente, `format` von `date-fns`.

### Keine weiteren Dateien betroffen

Keine Datenbank-Aenderungen noetig. Alle drei Tabellen haben bereits Admin-SELECT-Policies.
