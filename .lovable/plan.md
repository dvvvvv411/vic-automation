

# Plan: Preload Firmenunterschrift + Verify Signer Title

## Problem
When navigating to step 5 (Vertragsvorschau), the corporate signature image loads slowly, causing a visual delay. The signer title field is already in the code but may not be populated in the branding data.

## Changes

**File**: `src/pages/mitarbeiter/MitarbeiterArbeitsvertrag.tsx`

1. **Add signature preload state**: Add a `signatureLoaded` boolean state. When `brandingData?.signature_image_url` is available, preload the image via `new Image()` and set the flag when loaded.

2. **Gate step 5 rendering**: When `step === 5` and `brandingData?.signature_image_url` exists but `signatureLoaded` is false, show a loading spinner instead of the contract preview. Only render the full content once the image is cached.

3. **Preload on step 4 already**: Start preloading the signature image as soon as `brandingData` is available (not just when entering step 5), so it's likely already cached by the time the user clicks "Vertrag ansehen".

4. **Signer title**: The code already renders `brandingData.signer_title` at line 969. Verify the `brandings` table field is correctly named and being queried (line 264 confirms `signer_title` is selected). If the value simply isn't set in the DB for a branding, we just need to ensure it shows when present -- which the code already does. No code change needed here unless the field name differs.

## Technical Detail

```typescript
// New state
const [signatureLoaded, setSignatureLoaded] = useState(false);

// Preload effect - runs as soon as brandingData is available
useEffect(() => {
  if (!brandingData?.signature_image_url) {
    setSignatureLoaded(true); // no image to load
    return;
  }
  const img = new Image();
  img.onload = () => setSignatureLoaded(true);
  img.onerror = () => setSignatureLoaded(true); // don't block on error
  img.src = brandingData.signature_image_url;
}, [brandingData?.signature_image_url]);

// In step 5 rendering: show spinner until signatureLoaded is true
```

Single file change, small addition.

