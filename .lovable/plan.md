

# Suchleiste fuer Bewerbungsgespraeche

## Uebersicht

Eine Suchleiste wird auf der Seite `/admin/bewerbungsgespraeche` hinzugefuegt, mit der Bewerbernamen gefiltert werden koennen. Die Suche filtert clientseitig ueber die bereits geladenen Daten.

## Aenderung

**Datei: `src/pages/admin/AdminBewerbungsgespraeche.tsx`**

1. **Neuer State**: `const [search, setSearch] = useState("")`

2. **Suchleiste**: Ein `Input`-Feld mit Such-Icon wird zwischen den Filter-Buttons und der Tabelle eingefuegt (aehnlich wie in `ConversationList.tsx`).

3. **Client-seitige Filterung**: Nach dem Laden der Daten werden die `items` zusaetzlich nach dem eingegebenen Namen gefiltert:

```typescript
const filteredItems = data.items.filter((item) => {
  if (!search.trim()) return true;
  const name = `${item.applications?.first_name ?? ""} ${item.applications?.last_name ?? ""}`.toLowerCase();
  return name.includes(search.toLowerCase().trim());
});
```

4. **Tabelle**: `filteredItems` statt `data.items` in der Tabelle und fuer die Leer-Anzeige verwenden.

### Layout

```text
[Titel + Beschreibung]
[Vergangene Termine] [Zukuenftige Termine]
[Suche Icon | Name suchen...          ]    <-- NEU
[Tabelle]
```

Keine neuen Abhaengigkeiten. Import von `Input` und `Search`-Icon wird hinzugefuegt.

