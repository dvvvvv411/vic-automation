

# Fix: Anhänge-Absendung & Admin-Gruppierung

## Probleme

### 1. Anhänge werden nicht wirklich abgeschickt
Die RLS-Policy auf `order_attachments` erlaubt regulären Usern nur INSERT und SELECT — kein UPDATE. Der `handleSubmitAttachments`-Aufruf (Zeile 334-339) versucht per `.update({ status: "eingereicht" })` zu ändern, was stillschweigend fehlschlägt (0 rows affected, kein Error). Daher der Toast "Erfolgreich", aber keine tatsächliche Änderung.

### 2. Anhänge sofort für Admin sichtbar
Beim Upload wird sofort ein DB-Eintrag mit Status `entwurf` erstellt. Die Admin-Seite filtert nicht nach Status, zeigt also auch Entwürfe an.

### 3. Admin-Seite zeigt einzelne Anhänge statt Gruppen
Gewünscht: Eine Zeile pro Mitarbeiter+Auftrag-Kombination mit Zähler (z.B. "3/3"), Klick öffnet Detailseite.

---

## Lösung

### Schritt 1: RLS-Policy für User-Update hinzufügen
SQL-Migration: UPDATE-Policy auf `order_attachments`, die Usern erlaubt, ihre eigenen Anhänge im Status `entwurf` auf `eingereicht` zu setzen.

```sql
CREATE POLICY "Users can update own draft order_attachments"
ON public.order_attachments
FOR UPDATE
TO authenticated
USING (
  contract_id IN (SELECT ec.id FROM employment_contracts ec WHERE ec.user_id = auth.uid())
)
WITH CHECK (
  contract_id IN (SELECT ec.id FROM employment_contracts ec WHERE ec.user_id = auth.uid())
);
```

### Schritt 2: Testdaten löschen
Per SQL alle bestehenden `order_attachments` löschen, damit der User es neu testen kann.

### Schritt 3: Admin-Seite — nur eingereichte Anhänge, gruppiert
**`AdminAnhaenge.tsx`** komplett umbauen:
- Query filtert auf `status != 'entwurf'` (nur eingereichte/genehmigte/abgelehnte)
- Gruppierung nach `contract_id + order_id` → eine Zeile pro Gruppe
- Spalten: Mitarbeiter | Auftrag | Hochgeladen (z.B. "3/3") | Status | Eingereicht am
- Status-Badge zeigt Gesamtstatus (alle genehmigt → grün, mind. 1 abgelehnt → rot, sonst eingereicht)
- Klick auf Zeile navigiert zu `/admin/anhaenge/:contractId/:orderId`

### Schritt 4: Detail-Seite für Admin-Anhänge
Neue Seite `AdminAnhaengeDetail.tsx`:
- Zeigt alle einzelnen Anhänge der Gruppe als Cards mit Thumbnails
- Genehmigungs-/Ablehnungsbuttons pro Anhang
- Route: `/admin/anhaenge/:contractId/:orderId`

### Schritt 5: Route in App.tsx hinzufügen
Neue Route für die Detailansicht.

### Betroffene Dateien
| Datei | Änderung |
|-------|----------|
| SQL-Migration | RLS-Policy + Testdaten löschen |
| `AdminAnhaenge.tsx` | Gruppierte Ansicht |
| `AdminAnhaengeDetail.tsx` (neu) | Detail mit Thumbnails & Aktionen |
| `App.tsx` | Neue Route |

