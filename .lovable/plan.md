

# Fix: Self-registered contracts not visible in Admin Arbeitsverträge

## Problem
The query in `AdminArbeitsvertraege.tsx` only fetches contracts linked to `interview_appointments` via `applications`. Self-registered users (like `testeraccount@yopmail.com`) have `application_id = NULL`, so their contracts never appear.

## Root Cause
Lines 39-56: The query starts from `interview_appointments` joined to `applications`, then finds contracts by `application_id`. This misses contracts created through self-registration (no application, no interview).

## Changes

**File**: `src/pages/admin/AdminArbeitsvertraege.tsx`

1. **Rewrite the query** to start from `employment_contracts` directly instead of `interview_appointments`. Filter by `activeBrandingId`. For each contract, optionally join `applications(branding_id, brandings(...))` to get branding info. For self-registered contracts without an application, use `branding_id` directly from the contract itself.

2. **Remove the "Unterzeichnet" tab** -- remove it from the `TabValue` type, the `TabsList`, and the counts. Contracts with status `unterzeichnet` should appear in the "Eingereicht" tab instead (since signing happens before admin approval in the self-registration flow).

3. **Update card rendering** to handle contracts without `item.applications` -- fall back to contract-level `first_name`, `last_name`, `email`, `phone` fields.

4. **Update counts logic**: Map `unterzeichnet` status to `eingereicht` count, or treat signed contracts as a sub-state of eingereicht.

### Query rewrite (conceptual):
```typescript
// Fetch all contracts for the active branding
const { data: contracts } = await supabase
  .from("employment_contracts")
  .select("*, applications(id, first_name, last_name, email, phone, branding_id, brandings(id, company_name))")
  .eq("branding_id", activeBrandingId)
  .order("created_at", { ascending: false });

// Each item IS a contract now, with optional .applications
```

### Card data fallback:
```typescript
const firstName = item.applications?.first_name || item.first_name || "";
const lastName = item.applications?.last_name || item.last_name || "";
const email = item.applications?.email || item.email || "";
const phone = item.applications?.phone || item.phone || "";
```

### Tab changes:
- Remove `unterzeichnet` from `TabValue`, tabs UI, and counts
- In the filter/counts, treat `unterzeichnet` as `eingereicht`
- In `statusBadge`, show "Unterzeichnet" with a distinct badge within the eingereicht tab so the admin can see who already signed

### Approve flow:
- When admin approves (status changes to `genehmigt`), contract moves to the "Genehmigt" tab -- this already works via `handleApprove`.

