

# Add Meldenachweis to Contract Details Dialog

## Change

**File**: `src/pages/admin/AdminArbeitsvertraege.tsx`

In the "Ausweisdokumente" section of the details dialog (around line 386-399), add a display for `selectedContract.proof_of_address_url` after the ID document images. The field is already fetched since we query `*` from `employment_contracts`.

Handle both image files and PDFs:
- If the URL ends with `.pdf`, show a link/button to open it in a new tab
- Otherwise, show a clickable thumbnail like the ID images

```jsx
{selectedContract.proof_of_address_url && (
  <div className="cursor-pointer" onClick={() => {
    if (selectedContract.proof_of_address_url.endsWith('.pdf')) {
      window.open(selectedContract.proof_of_address_url, '_blank');
    } else {
      setImagePreview(selectedContract.proof_of_address_url);
    }
  }}>
    <p className="text-xs text-muted-foreground mb-1">Meldenachweis</p>
    {selectedContract.proof_of_address_url.endsWith('.pdf') ? (
      <div className="rounded-lg border border-border w-full h-32 flex items-center justify-center bg-muted/30 hover:opacity-80 transition-opacity">
        <FileCheck className="h-8 w-8 text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">PDF öffnen</span>
      </div>
    ) : (
      <img src={selectedContract.proof_of_address_url} alt="Meldenachweis" className="rounded-lg border border-border w-full h-32 object-cover hover:opacity-80 transition-opacity" />
    )}
  </div>
)}
```

Single file, single section addition inside the existing `grid grid-cols-2` div.

