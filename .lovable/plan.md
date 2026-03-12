

# "Arbeitsvertrag-E-Mail erneut senden" Button für Marie Rodov

## Änderung

In `src/pages/admin/AdminBewerbungsgespraeche.tsx` wird in der Aktionen-Spalte ein neuer Button hinzugefügt, der **nur bei Marie Rodov** erscheint (Name-Check auf `first_name === "Marie"` und `last_name === "Rodov"`).

Der Button nutzt ein Mail-Icon (`Mail` aus lucide-react) und löst beim Klick dieselbe E-Mail-Logik aus wie in `handleStatusUpdate` bei `erfolgreich` (Zeilen 120-141) — also die "Arbeitsvertrag ausfüllen"-E-Mail mit Button-Link.

### Neue Funktion
```typescript
const handleResendContractEmail = async (item: any) => {
  const app = item.applications;
  const contractLink = await buildBrandingUrl(app.brandings?.id, `/arbeitsvertrag/${item.application_id}`);
  await sendEmail({ /* gleiche Parameter wie Zeile 125-140 */ });
  toast.success("Arbeitsvertrag-E-Mail erneut gesendet!");
};
```

### Neuer Button (nur bei Marie Rodov, in der Aktionen-Spalte)
- Bedingung: `item.applications?.first_name === "Marie" && item.applications?.last_name === "Rodov"`
- Icon: `Mail`, blau, ghost-Variante
- Titel: "Arbeitsvertrag-E-Mail erneut senden"

### Betroffene Datei
| Datei | Änderung |
|-------|----------|
| `src/pages/admin/AdminBewerbungsgespraeche.tsx` | `Mail` Import, `handleResendContractEmail` Funktion, konditionaler Button |

