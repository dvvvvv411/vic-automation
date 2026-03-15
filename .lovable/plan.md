

# Fix: Infinite Recursion Between employment_contracts ↔ applications

## Root Cause
The network logs confirm `42P17: infinite recursion detected in policy for relation "employment_contracts"` and `"applications"`. The previous migration only changed the Admin/Kunde logic pattern but didn't break the circular dependency:

1. `employment_contracts` Kunde policy: `application_id IN (SELECT id FROM applications WHERE branding_id IN (...))`
2. This triggers `applications` RLS → policy "Users can read own application": `id IN (SELECT application_id FROM employment_contracts WHERE user_id = auth.uid())`
3. This triggers `employment_contracts` RLS → back to step 1

Similarly for `order_assignments`, `order_appointments`, `order_reviews`, `chat_messages` — all have Kunde policies that reference `employment_contracts` JOIN `applications`, which triggers the same cycle.

## Fix: Two SECURITY DEFINER Functions

### Function 1: `user_application_ids(_user_id uuid)`
Returns application_ids for a user (via employment_contracts). Used to replace the "Users can read own application" policy on `applications`.

### Function 2: `branding_application_ids(_branding_id uuid)` 
Returns application IDs for a given branding. Used in Kunde policies on `employment_contracts`, `interview_appointments`, `trial_day_appointments` to avoid querying `applications` through RLS.

### Function 3: `branding_contract_ids(_branding_id uuid)`
Returns contract IDs for a given branding (via applications JOIN). Used in Kunde policies on `chat_messages`, `order_appointments`, `order_assignments`, `order_reviews` to avoid querying both `employment_contracts` and `applications` through RLS.

## Policy Changes

**`applications`**:
- Drop "Users can read own application" → recreate using `user_application_ids(auth.uid())`

**`employment_contracts`** (SELECT, UPDATE, DELETE):
- Kunde part changes from `application_id IN (SELECT id FROM applications WHERE branding_id IN (...))` to `application_id IN (SELECT branding_application_ids(user_branding_ids(auth.uid())))`... Actually simpler: use a single function `application_ids_for_brandings` that takes the branding IDs set.

Actually, simplest approach: create one function per lookup pattern that bypasses RLS:

```sql
-- Get application IDs owned by a user (via contracts)
CREATE FUNCTION public.user_application_ids(_user_id uuid) RETURNS SETOF uuid
SECURITY DEFINER AS $$
  SELECT application_id FROM public.employment_contracts WHERE user_id = _user_id
$$ LANGUAGE sql STABLE;

-- Get application IDs for given branding IDs  
CREATE FUNCTION public.apps_for_branding_ids(_user_id uuid) RETURNS SETOF uuid
SECURITY DEFINER AS $$
  SELECT id FROM public.applications 
  WHERE branding_id IN (SELECT public.user_branding_ids(_user_id))
$$ LANGUAGE sql STABLE;

-- Get contract IDs for given branding IDs (via applications)
CREATE FUNCTION public.contracts_for_branding_ids(_user_id uuid) RETURNS SETOF uuid
SECURITY DEFINER AS $$
  SELECT ec.id FROM public.employment_contracts ec
  JOIN public.applications a ON a.id = ec.application_id
  WHERE a.branding_id IN (SELECT public.user_branding_ids(_user_id))
$$ LANGUAGE sql STABLE;
```

Then update ALL policies that currently do inline subqueries crossing `employment_contracts` ↔ `applications`:

- **`applications`** "Users can read own application": `id IN (SELECT user_application_ids(auth.uid()))`
- **`employment_contracts`** Kunde part: `application_id IN (SELECT apps_for_branding_ids(auth.uid()))`
- **`interview_appointments`** Kunde part: same pattern
- **`trial_day_appointments`** Kunde part: same pattern
- **`chat_messages`** Kunde part: `contract_id IN (SELECT contracts_for_branding_ids(auth.uid()))`
- **`order_appointments`** Kunde part: same
- **`order_assignments`** Kunde part: same
- **`order_reviews`** Kunde part: same

## Single Migration
One SQL migration that:
1. Creates 3 SECURITY DEFINER functions
2. Drops and recreates ~20 policies across 8 tables

No frontend changes needed.

