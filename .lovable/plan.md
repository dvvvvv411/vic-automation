

# Badge "Anhänge erforderlich" auf Admin-Aufträge-Seite

## Problem
Auf `/admin/auftraege` fehlt ein Badge, das anzeigt, wenn ein Auftrag `required_attachments` definiert hat (Array mit mindestens einem Eintrag).

## Lösung
Nach dem Video-Chat Badge (Zeile ~125) ein neues Badge einfügen:

```tsx
{Array.isArray(o.required_attachments) && o.required_attachments.length > 0 && (
  <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-300 text-xs">
    <Paperclip className="h-3 w-3 mr-1" />
    Anhänge erforderlich
  </Badge>
)}
```

Import `Paperclip` aus `lucide-react` hinzufügen.

## Betroffene Datei
`src/pages/admin/AdminAuftraege.tsx` — Zeile ~12 (Import) und ~125 (nach is_videochat Badge)

