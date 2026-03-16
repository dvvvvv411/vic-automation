

# Dritter Tab "Abgelehnt" für fehlgeschlagene Bewertungen

**Datei: `src/pages/admin/AdminBewertungen.tsx`**

1. Neues gefiltertes Array: `const rejectedReviews = grouped.filter((g) => g.assignment_status === "fehlgeschlagen");`
2. Dritten `TabsTrigger` hinzufügen: `Abgelehnt ({rejectedReviews.length})`
3. Drittes `TabsContent` mit `renderTable(rejectedReviews, false)` (keine Aktions-Buttons)

