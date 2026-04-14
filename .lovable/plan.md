

## Plan: Text-Ausrichtung und Schriftgröße im Vertragsvorlagen-Editor

### Änderungen

**1. Neue TipTap-Extensions installieren**
- `@tiptap/extension-text-align` — für links/mittig/rechts
- `@tiptap/extension-text-style` + `@tiptap/extension-font-size` — für Schriftgröße (alternativ custom Extension mit `fontSize` als Inline-Style)

**2. `src/pages/admin/AdminVertragsvorlageForm.tsx`**

- **Extensions registrieren**: `TextAlign.configure({ types: ['heading', 'paragraph'] })`, `TextStyle`, und eine FontSize-Extension
- **Alignment-Buttons** in der MenuBar: AlignLeft / AlignCenter / AlignRight Icons sind bereits importiert aber nicht verwendet — diese als Buttons hinzufügen nach den Listen-Buttons
- **Font-Size-Dropdown** in der MenuBar: Ein `Select` mit Optionen wie 10px, 12px, 14px, 16px, 18px, 20px, 24px, 28px, 32px. Setzt `editor.chain().focus().setFontSize('16px').run()` bzw. `unsetFontSize()` für "Standard"

**3. Da `@tiptap/extension-font-size` kein offizielles Paket ist**, wird stattdessen eine custom Extension gebaut die `textStyle` nutzt:

```typescript
import { Extension } from "@tiptap/core";

const FontSize = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [{
      types: ["textStyle"],
      attributes: {
        fontSize: {
          default: null,
          parseHTML: el => el.style.fontSize || null,
          renderHTML: attrs => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (size) => ({ chain }) => chain().setMark("textStyle", { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }) => chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});
```

### Neue Pakete

| Paket | Zweck |
|---|---|
| `@tiptap/extension-text-align` | Textausrichtung |
| `@tiptap/extension-text-style` | Basis für inline Styles |

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminVertragsvorlageForm.tsx` | Extensions + Alignment-Buttons + Font-Size-Dropdown |

