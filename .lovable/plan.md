

## Plan: Status-Tabs für `/admin/anhaenge` (wie bei Bewertungen)

### Änderungen in `src/pages/admin/AdminAnhaenge.tsx`

1. **Import**: `Tabs, TabsContent, TabsList, TabsTrigger` aus `@/components/ui/tabs` hinzufügen

2. **Gruppen nach Status aufteilen** (nach dem Search-Filter):
   - **Eingereicht**: Gruppen wo mindestens ein Status "eingereicht" ist (und keiner "abgelehnt")
   - **Genehmigt**: Gruppen wo alle Statuses "genehmigt" sind
   - **Abgelehnt**: Gruppen wo mindestens ein Status "abgelehnt" ist

3. **Tabs rendern** (analog zu Bewertungen):
   ```
   <Tabs defaultValue="eingereicht">
     <TabsList>
       <TabsTrigger value="eingereicht">Eingereicht (X)</TabsTrigger>
       <TabsTrigger value="genehmigt">Genehmigt (X)</TabsTrigger>
       <TabsTrigger value="abgelehnt">Abgelehnt (X)</TabsTrigger>
     </TabsList>
     <TabsContent value="eingereicht">{renderTable(pending, true)}</TabsContent>
     <TabsContent value="genehmigt">{renderTable(approved, false)}</TabsContent>
     <TabsContent value="abgelehnt">{renderTable(rejected, false)}</TabsContent>
   </Tabs>
   ```

4. **Tabelle als `renderTable(rows, showActions)` extrahieren** — bei "Genehmigt" und "Abgelehnt" wird die Aktionen-Spalte ausgeblendet (keine pending_ids)

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminAnhaenge.tsx` | Tabs + Filterlogik + renderTable-Funktion |

