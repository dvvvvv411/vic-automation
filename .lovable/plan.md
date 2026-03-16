

# Fix Contract View Dialog in MeineDaten

## Issues
1. User signature + name not always showing (signature_data not in layout contract fetch)
2. PDF export puts everything on one page — overflows if content is long
3. No timestamp showing when signatures were made

## Changes

### File: `src/pages/mitarbeiter/MeineDaten.tsx`

**1. Fetch `submitted_at` when opening dialog (line 207-208)**
Add `submitted_at` to the select query so we have the signing timestamp. Store it in state alongside templateContent.

**2. Ensure signature_data is available**
The `contract` from context doesn't include `signature_data`. The dialog's onClick already fetches `signature_data` from the contract (line 208), but it's stored in `ec` which is scoped to that callback. Store `ec.signature_data` and `ec.first_name`/`ec.last_name` in component state so the dialog can use them.

Add state: `const [contractExtra, setContractExtra] = useState<{signature_data?: string; first_name?: string; last_name?: string; submitted_at?: string} | null>(null);`

In the onClick handler, after fetching `ec`, call `setContractExtra({ signature_data: ec?.signature_data, first_name: ec?.first_name, last_name: ec?.last_name, submitted_at: ec?.submitted_at })`.

**3. Fix signature display in dialog (lines 348-364)**
- Always show the grid with both columns
- Left: Firmenunterschrift (existing)
- Right: User signature from `contractExtra.signature_data` with name from `contractExtra.first_name`/`last_name`
- Add timestamp below each signature: format `submitted_at` as "dd.MM.yyyy" using date-fns

**4. Fix PDF export for multi-page content (lines 369-378)**
Replace the single-page approach with a loop that slices the canvas into A4-sized chunks:

```typescript
const A4_HEIGHT_PX = (canvas.width * 297) / 210; // A4 aspect ratio
let yOffset = 0;
let page = 0;
while (yOffset < canvas.height) {
  if (page > 0) pdf.addPage();
  // Create a temporary canvas for this page slice
  const pageCanvas = document.createElement("canvas");
  pageCanvas.width = canvas.width;
  pageCanvas.height = Math.min(A4_HEIGHT_PX, canvas.height - yOffset);
  const ctx = pageCanvas.getContext("2d")!;
  ctx.drawImage(canvas, 0, yOffset, pageCanvas.width, pageCanvas.height, 0, 0, pageCanvas.width, pageCanvas.height);
  const pageImg = pageCanvas.toDataURL("image/png");
  const pageH = (pageCanvas.height * pdfWidth) / pageCanvas.width;
  pdf.addImage(pageImg, "PNG", 0, 0, pdfWidth, pageH);
  yOffset += A4_HEIGHT_PX;
  page++;
}
```

### File: `src/components/mitarbeiter/MitarbeiterLayout.tsx`

**5. Add `submitted_at` to contract fetch (line 46)**
Add `submitted_at` to the select so it's available in context. Update `ContractData` interface to include `submitted_at?: string`.

