

# Fix: Dashboard Order Cards match Auftraege Cards

## Problem
The dashboard at `/mitarbeiter` uses `line-clamp-2` for description text (line 507), while `/mitarbeiter/auftraege` uses the deterministic `truncateText` helper. This causes inconsistent and broken text display.

## Changes

**File**: `src/pages/mitarbeiter/MitarbeiterDashboard.tsx`

1. Add a `truncateText` helper (same as in `MitarbeiterAuftraege.tsx`):
```typescript
const truncateText = (text: string, maxLen: number): string => {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLen) return normalized;
  const cut = normalized.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > maxLen * 0.6 ? cut.slice(0, lastSpace) : cut) + "...";
};
```

2. Line 507: Replace the description paragraph from:
```jsx
<p className="text-sm text-muted-foreground line-clamp-2 pb-3 border-b border-border/30">{order.description}</p>
```
to:
```jsx
<p className="text-sm text-muted-foreground leading-relaxed pb-3 border-b border-border/30 break-words">{truncateText(order.description, 120)}</p>
```

Single file, two small edits.

