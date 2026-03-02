

# Mitarbeiterkonto sperren

## Uebersicht

Ein "Sperren"-Button in der Mitarbeiter-Tabelle oeffnet ein Bestaetigungs-Popup. Nach Bestaetigung wird das Konto gesperrt. Der gesperrte Mitarbeiter sieht nur noch eine Sperrseite -- kein Dashboard, keine Navigation, keinen Livechat.

## Aenderungen

### 1. Datenbank: Neue Spalte `is_suspended` auf `employment_contracts`

```sql
ALTER TABLE employment_contracts ADD COLUMN is_suspended boolean NOT NULL DEFAULT false;
```

Keine neue Tabelle noetig -- die Spalte auf `employment_contracts` reicht, da jeder Mitarbeiter genau einen Vertrag hat und die gesamte App darauf basiert.

### 2. `src/pages/admin/AdminMitarbeiter.tsx`

- `is_suspended` in die Select-Query aufnehmen
- Neue Tabellenspalte "Aktionen" mit einem Button (Schloss-Icon)
- Bei Klick oeffnet sich ein `AlertDialog` mit Bestaetigungsfrage: "Benutzerkonto von [Name] sperren?"
- Bei Bestaetigung: `supabase.from("employment_contracts").update({ is_suspended: true }).eq("id", contractId)`
- Wenn bereits gesperrt: Button zeigt "Entsperren" und setzt `is_suspended` auf `false`
- Status-Badge "Gesperrt" (rot) wird zusaetzlich angezeigt wenn gesperrt
- Query wird nach Aktion invalidiert

### 3. `src/components/mitarbeiter/MitarbeiterLayout.tsx`

- `is_suspended` in der Contract-Query mitlesen
- Wenn `contract.is_suspended === true`: Statt der normalen App-Inhalte (Sidebar, Outlet, ChatWidget) wird eine Ganzseitige Sperrseite gerendert:
  - Rotes Schild-Icon
  - Text: "Ihr Benutzerkonto wurde gesperrt"
  - Beschreibung: "Bitte kontaktieren Sie Ihren Ansprechpartner."
  - Abmelde-Button
- Kein Zugriff auf Sidebar, Navigation oder ChatWidget

### 4. Typanpassung

Da `is_suspended` eine neue Spalte ist, wird sie nach der Migration automatisch in den Supabase-Typen verfuegbar sein. Keine manuelle Aenderung an `types.ts` noetig.

## Ablauf

1. Admin klickt auf Schloss-Button in der Mitarbeiter-Zeile
2. AlertDialog fragt: "Benutzerkonto von Max Mustermann sperren?"
3. Admin bestaetigt
4. `is_suspended` wird auf `true` gesetzt
5. Mitarbeiter sieht beim naechsten Laden (oder sofort bei Realtime) nur die Sperrseite
6. Admin kann das Konto jederzeit wieder entsperren

## Technische Details

- AlertDialog aus `@/components/ui/alert-dialog` (bereits vorhanden)
- Lucide Icons: `Lock`, `Unlock`, `ShieldX` fuer die Sperrseite
- Toast-Benachrichtigung nach erfolgreichem Sperren/Entsperren
- Kein Edge Function noetig -- direktes Update ueber Supabase Client (Admin hat RLS-Berechtigung)

