
## Plan: "Ausstehend"-Sektion auf /admin/idents

### Konzept

Zwischen "Aktiv" und "Abgeschlossen" wird eine neue Sektion **"Ausstehend"** eingefügt. Sie zeigt Mitarbeiter, die einem Videochat-Auftrag zugewiesen sind, aber noch keine Ident-Session gestartet haben. Der Admin kann dort eine Ident-Session vorab erstellen und Identdaten vorausfüllen.

### Logik

**Ausstehende Idents** = `order_assignments` wo:
- Der zugehörige `order` hat `is_videochat = true`
- Es existiert keine `ident_sessions`-Zeile mit `assignment_id = oa.id`
- Gefiltert nach `branding_id` des Contracts

### Änderungen

**Datei: `src/pages/admin/AdminIdents.tsx`**

1. Neue Query: Lade `order_assignments` mit Join auf `orders` (where `is_videochat = true`) und `employment_contracts` (Name + branding_id), filtere die raus die bereits eine `ident_session` haben
2. Neue Sektion "Ausstehend" zwischen Aktiv und Abgeschlossen rendern
3. Jede Karte zeigt Mitarbeitername + Auftragsname + Badge "Ausstehend"
4. Klick auf eine Karte erstellt eine neue `ident_session` (mit `status: 'waiting'`, `contract_id`, `order_id`, `assignment_id`, `branding_id`) und navigiert dann zur Detail-Seite `/admin/idents/{neue_id}` — dort kann der Admin sofort Identdaten vorausfüllen

### Technische Details

- Die Query nutzt die bestehenden Tabellen, keine DB-Änderung nötig
- Beim Klick wird per `supabase.from("ident_sessions").insert(...)` eine Session erstellt und der User direkt zur Detailseite weitergeleitet
- Die leere Sektion wird nur angezeigt wenn es ausstehende Einträge gibt
- Die bestehende Prüfung `sessions.length === 0` für den Empty-State wird angepasst, damit auch ausstehende Idents den Empty-State verhindern

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminIdents.tsx` | Neue Query für ausstehende Idents, neue "Ausstehend"-Sektion mit Klick-to-Create |
