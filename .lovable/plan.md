

# Hide Arbeitsvertrag sidebar item when contract is approved

## Change

**File**: `src/components/mitarbeiter/MitarbeiterSidebar.tsx`

1. Add `contractStatus?: string` to `MitarbeiterSidebarProps`
2. Filter `navItems` to exclude the "Arbeitsvertrag" entry when `contractStatus === "genehmigt"`

**File**: `src/components/mitarbeiter/MitarbeiterLayout.tsx`

1. Pass `contractStatus={contract?.status}` to `<MitarbeiterSidebar>`

