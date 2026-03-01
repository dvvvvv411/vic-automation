
# Telefonnummer per Klick kopieren in allen Admin-Tabellen

## Aenderung

In allen Admin-Tabellen, in denen Telefonnummern angezeigt werden, wird die Telefonnummer klickbar gemacht. Ein Klick kopiert die Nummer ins Clipboard und zeigt eine Toast-Meldung "Telefonnummer kopiert!".

## Betroffene Dateien und Stellen

### 1. `src/pages/admin/AdminBewerbungen.tsx` (Zeile 768)

Aktuell:
```tsx
<TableCell className="text-muted-foreground">{a.phone || "–"}</TableCell>
```
Neu: Klickbare Telefonnummer mit Cursor-Pointer und Hover-Effekt. Klick kopiert die Nummer und stoppt die Event-Propagation (da die Tabellenzeile selbst klickbar ist).

### 2. `src/pages/admin/AdminArbeitsvertraege.tsx` (Zeile 210)

Aktuell:
```tsx
<TableCell className="text-muted-foreground">{item.applications?.phone || "–"}</TableCell>
```
Neu: Gleiche Logik wie oben.

### 3. `src/pages/admin/AdminBewerbungsgespraeche.tsx` (Zeile 335-337)

Aktuell:
```tsx
<TableCell className="text-muted-foreground">
  {item.applications?.phone || "–"}
</TableCell>
```
Neu: Gleiche Logik.

### 4. `src/pages/admin/AdminMitarbeiter.tsx` (Zeile 153)

Aktuell:
```tsx
<TableCell className="text-muted-foreground">{item.phone || "–"}</TableCell>
```
Neu: Gleiche Logik.

## Umsetzung

Jede Telefonnummer-Zelle wird so umgebaut:

```tsx
<TableCell className="text-muted-foreground">
  {phoneValue ? (
    <span
      className="cursor-pointer hover:text-foreground transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(phoneValue);
        toast.success("Telefonnummer kopiert!");
      }}
    >
      {phoneValue}
    </span>
  ) : "–"}
</TableCell>
```

- `cursor-pointer` zeigt an, dass die Nummer klickbar ist
- `hover:text-foreground` gibt visuelles Feedback beim Hover
- `e.stopPropagation()` verhindert, dass ein Klick auf die Nummer auch die Tabellenzeile oeffnet (wichtig bei AdminBewerbungen, wo Zeilen klickbar sind)
- `toast.success` bestaetigt das Kopieren

Vier Dateien, jeweils eine minimale Aenderung pro Datei. `toast` ist in allen Dateien bereits importiert.
