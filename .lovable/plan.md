

# Ident-Detail als eigene Seite + Branding-Filter für Telefonnummern + UI-Optimierung

## Drei Änderungen

### 1. Ident-Detail: Dialog → eigene Seite

**Aktuell:** Klick auf eine Ident-Card öffnet `IdentDetailDialog` als Modal.
**Neu:** Klick navigiert zu `/admin/idents/:id`, eine eigene Seite mit dem gesamten Detail-Inhalt.

**Dateien:**
- **`src/pages/admin/AdminIdentDetail.tsx`** (neu): Neue Seite, die den Inhalt des bisherigen `IdentDetailDialog` enthält, aber als vollwertige Seite mit Zurück-Button. Die Session-ID kommt aus `useParams()`. Lädt Session, Contract-Name, Order-Title selbst.
- **`src/pages/admin/AdminIdents.tsx`**: Dialog-Import und `IdentDetailDialog`-Komponente entfernen. Card-Klick wird zu `navigate(\`/admin/idents/${session.id}\`)`.
- **`src/App.tsx`**: Route `<Route path="idents/:id" element={<AdminIdentDetail />} />` hinzufügen.

### 2. Telefonnummern-Auswahl: nur Branding-gefiltert

**Aktuell:** Die Query in `IdentDetailDialog` holt alle `phone_numbers` ohne Branding-Filter.
**Neu:** In der neuen `AdminIdentDetail`-Seite wird die Phone-Query mit `.eq("branding_id", session.branding_id)` gefiltert, sodass nur zum Branding gehörige Nummern angezeigt werden.

### 3. Testdaten-UI aufräumen

**Aktuell:** Kleine `h-7`/`text-xs`-Inputs für Feldnamen, ein separates Dropdown + eigenes Textfeld + Plus-Button nebeneinander — wirkt unübersichtlich.

**Neu — professionelles Layout:**
- Testdaten als saubere Tabelle/Grid mit Label links, Value-Input rechts, Delete-Icon am Rand
- Labels der Default-Felder sind read-only (nicht editierbar), nur der Value ist ein Input
- "Feld hinzufügen" als ein einziger Button unten, der ein Dropdown öffnet mit den Standard-Feldern + "Eigenes Feld" Option
- Größere, besser lesbare Inputs (normale Größe statt `h-7 text-xs`)
- Kein separates Input-Feld für "Eigenes Feld" neben dem Dropdown

| Datei | Änderung |
|-------|----------|
| `src/pages/admin/AdminIdentDetail.tsx` | Neue Seite mit refactored Detail-View |
| `src/pages/admin/AdminIdents.tsx` | Dialog entfernen, Navigation statt Popup |
| `src/App.tsx` | Neue Route für idents/:id |

