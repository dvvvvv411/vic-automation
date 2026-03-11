

# Mitarbeiter-Detail als natives Popup (statt iframe)

## Problem
Der iframe-Ansatz funktioniert nicht zuverlässig. Die komplette Seite wird in einem iframe geladen, was Auth-Probleme, Layout-Issues und eine schlechte UX verursacht.

## Lösung
Den iframe durch eine native React-Komponente ersetzen, die dieselben Daten direkt aus Supabase lädt und im Dialog anzeigt. Kein Refactoring der Detail-Seite nötig -- stattdessen eine neue, schlanke `MitarbeiterDetailPopup`-Komponente.

## Neue Komponente: `src/components/admin/MitarbeiterDetailPopup.tsx`

Erhält `contractId` als Prop. Lädt per `useQuery`:
- `employment_contracts` (alle Felder + `applications(brandings(company_name))`)
- `order_assignments` mit `orders(order_number, title, provider, reward)` + `order_appointments`
- `order_reviews` mit `orders(order_number, title)`

Zeigt im Dialog an (read-only, keine Actions):
1. **Header**: Name, Status-Badge, Branding
2. **Persönliche Daten**: Vorname, Nachname, Geburtsdatum, Geburtsort, Nationalität, Familienstand, Beschäftigungsart, Startdatum
3. **Kontakt & Finanzen**: Email, Telefon, Adresse, SV-Nr, Steuer-ID, Krankenkasse, IBAN, BIC, Bank, Guthaben, Temp. Passwort
4. **Personalausweis**: Vorschaubilder (klickbar zum Vergrößern)
5. **Aufträge-Tabelle**: Auftragsnr, Titel, Anbieter, Prämie, Status, Termin
6. **Bewertungen**: Collapsible pro Auftrag mit Rating-Sternen und Kommentaren

Alles in einem `ScrollArea` innerhalb des Dialogs.

## Änderungen in `AdminLivechat.tsx`
- Iframe-Block (Zeilen 641-654) ersetzen durch `<MitarbeiterDetailPopup contractId={active.contract_id} open={detailDialogOpen} onOpenChange={setDetailDialogOpen} />`
- Import hinzufügen

