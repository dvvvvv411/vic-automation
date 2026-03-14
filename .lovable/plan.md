

# Moderne Scrollbar für Admin-Sidebar

Custom CSS-Scrollbar in der Sidebar: schmal, blau, abgerundet — passend zum dunklen Sidebar-Theme.

### Änderung

**`src/index.css`** — Neue CSS-Regeln für `[data-sidebar="content"]`:

```css
[data-sidebar="content"]::-webkit-scrollbar {
  width: 6px;
}
[data-sidebar="content"]::-webkit-scrollbar-track {
  background: transparent;
}
[data-sidebar="content"]::-webkit-scrollbar-thumb {
  background: hsl(var(--sidebar-primary) / 0.4);
  border-radius: 3px;
}
[data-sidebar="content"]::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--sidebar-primary) / 0.7);
}
```

Plus Firefox-Support via `scrollbar-width: thin; scrollbar-color`.

| Datei | Änderung |
|-------|----------|
| `src/index.css` | Scrollbar-Styling für Sidebar-Content |

