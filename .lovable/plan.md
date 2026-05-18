# Alle Verweise auf das alte Supabase-Projekt ersetzen

Alt: `luorlnagxpsibarcygjm.supabase.co` + alter anon key
Neu: `laozvnaupdecerpvwzmh.supabase.co` + aktueller anon key (identisch zu `src/integrations/supabase/client.ts`)

## Zu ändernde Dateien

1. **`index.html`** (Z. 14–15) — Favicon-Loader: `SB_URL` + `SB_KEY` aktualisieren. Damit lädt das Branding-Favicon wieder.

2. **`src/components/mitarbeiter/ContractSigningView.tsx`** (Z. 96 + 102) — Edge-Function-Call `sign-contract` auf neue URL + neuen anon key.

3. **`src/pages/admin/AdminMitarbeiterDetail.tsx`** (Z. 706 + 712) — Edge-Function-Call `create-employee-account` auf neue URL + neuen anon key.

4. **`.env`** (Z. 1–2) — `SUPABASE_URL` und `SUPABASE_PUBLISHABLE_KEY` (ohne `VITE_`-Prefix) auf die neuen Werte setzen, konsistent mit `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`.

## Nicht angefasst

- `supabase/migrations/20260316212046_*.sql` — historische Migration mit pg_cron-Job, der auf die alte URL zeigt. Wird durch eine neue Migration ersetzt, wenn der Reminder-Cronjob wieder aktiv sein soll. Aktuell nicht teil dieses Fixes.
- `src/integrations/supabase/client.ts` und `publicClient.ts` — bereits korrekt.

## Empfehlung danach

Hardcoded URLs/Keys in den beiden TSX-Dateien durch `supabase.functions.invoke(...)` ersetzen, damit so etwas bei einem Projekt-Wechsel nicht mehr vorkommt. Optional als Folge-Cleanup.
