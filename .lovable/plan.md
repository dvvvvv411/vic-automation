

# Bewertung freischalten im MitarbeiterDetailPopup

## Änderungen in `src/components/admin/MitarbeiterDetailPopup.tsx`

1. **`review_unlocked` im Query laden**: Das `order_assignments` Select um `review_unlocked` erweitern (bereits als `select("*")` geladen, also schon vorhanden).

2. **Neue Spalte "Bewertung" in der Aufträge-Tabelle**: Eine zusätzliche Spalte mit einem Switch/Button hinzufügen, der `review_unlocked` toggelt. Nur für Nicht-Platzhalter-Aufträge relevant (Platzhalter sind immer freigeschaltet). Da wir `orders.is_placeholder` noch nicht laden, muss das Select erweitert werden: `orders(order_number, title, provider, reward, is_placeholder)`.

3. **Toggle-Handler**: Beim Klick auf den Switch wird `supabase.from("order_assignments").update({ review_unlocked: true/false }).eq("id", assignment.id)` aufgerufen und der Query-Cache invalidiert.

4. **Imports**: `Switch` aus `@/components/ui/switch`, `useQueryClient` aus `@tanstack/react-query`, `toast` aus `sonner`.

### UI-Detail
- Neue Spalte "Bewertung" nach "Status"
- Switch-Toggle: grün wenn freigeschaltet, grau wenn gesperrt
- Bei Platzhalter-Aufträgen: Badge "Auto" statt Switch (da immer freigeschaltet)
- Toast-Feedback bei Erfolg/Fehler

