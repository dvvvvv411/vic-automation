

# Fix: Firmenunterschrift date cut off in PDF export

## Problem
The dialog has `max-h-[85vh] overflow-y-auto` on the `DialogContent`. When `html2canvas` captures `#contract-pdf-content`, it only renders the visible portion within the scrollable container, cutting off the date below the company signature.

## Solution

**File**: `src/pages/mitarbeiter/MeineDaten.tsx` (lines 382-384)

Before calling `html2canvas`, temporarily remove the scroll/overflow constraints from the dialog content so the full element is rendered, then restore them after capture:

```typescript
const el = document.getElementById("contract-pdf-content");
if (!el) return;
const dialogEl = el.closest('[class*="max-h-"]') as HTMLElement | null;
const originalStyles = dialogEl ? { maxHeight: dialogEl.style.maxHeight, overflow: dialogEl.style.overflow } : null;
if (dialogEl) {
  dialogEl.style.maxHeight = "none";
  dialogEl.style.overflow = "visible";
}
const canvas = await html2canvas(el, { scale: 2, useCORS: true });
if (dialogEl && originalStyles) {
  dialogEl.style.maxHeight = originalStyles.maxHeight;
  dialogEl.style.overflow = originalStyles.overflow;
}
```

This ensures html2canvas sees the full content including the date line, then restores the dialog's scroll behavior.

