

# Plan: 4 Changes + DB Migration

## 1. Fix Auftrags-Cards Description Overflow
**File**: `src/pages/mitarbeiter/MitarbeiterAuftraege.tsx` (line ~325)
- Change `line-clamp-2` to `line-clamp-1`

## 2. Vorschau Button rechts in Card
**File**: `src/pages/mitarbeiter/MitarbeiterArbeitsvertrag.tsx`
- Move the "Vorschau" button to the right side of the card's `flex justify-between` container

## 3. ID Document Type Selection + Meldenachweis Upload (Mitarbeiter)
**File**: `src/pages/mitarbeiter/MitarbeiterArbeitsvertrag.tsx`
- Add `idType` state (personalausweis/reisepass) with RadioGroup
- Personalausweis = front + back upload; Reisepass = single image
- Conditionally show Meldenachweis upload (image/pdf) when `requires_proof_of_address` is true on the contract
- Update `isStepValid()` and submit logic

## 4. Admin KYC Tab
**File**: `src/pages/admin/AdminMitarbeiterDetail.tsx` (lines 725-857)
- Rename tab from "Personalausweis" to "KYC"
- Add Switch toggle for "Meldenachweis erforderlich" (updates `requires_proof_of_address`)
- Show ID images with labels based on `id_type` (Personalausweis: Vorderseite/Rueckseite, Reisepass: single image)
- **Meldenachweis thumbnail preview**: If `proof_of_address_url` is an image, render it as a clickable `<img>` thumbnail (same pattern as the ID images, with `onClick` opening `setImagePreview`). If it's a PDF, show an embedded `<iframe>` or a PDF icon thumbnail with a clickable link to open in new tab. Same styling as the existing ID card previews.

## 5. Database Migration
```sql
ALTER TABLE public.employment_contracts
  ADD COLUMN id_type text DEFAULT 'personalausweis',
  ADD COLUMN proof_of_address_url text,
  ADD COLUMN requires_proof_of_address boolean NOT NULL DEFAULT false;
```

## Summary
| File | Changes |
|------|---------|
| `MitarbeiterAuftraege.tsx` | `line-clamp-1` |
| `MitarbeiterArbeitsvertrag.tsx` | Vorschau button right-aligned, ID type selection, Meldenachweis upload |
| `AdminMitarbeiterDetail.tsx` | Tab rename to KYC, Meldenachweis toggle + thumbnail preview, id_type labels |
| DB migration | 3 new columns on `employment_contracts` |

