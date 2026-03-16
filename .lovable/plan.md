

# Video-Chat Badge in Auftragsübersicht

## Änderung in `src/pages/admin/AdminAuftraege.tsx`

Nach dem bestehenden Starter-Job Badge (Zeile 113-117) ein weiteres Badge für `is_videochat` einfügen, im gleichen Stil:

```tsx
{o.is_videochat && (
  <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300 text-xs">
    <Video className="h-3 w-3 mr-1" />
    Video-Chat
  </Badge>
)}
```

Import `Video` von `lucide-react` hinzufügen.

