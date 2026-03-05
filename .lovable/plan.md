
# SMS Spoof History

## Database
New table `sms_spoof_logs` to record every sent spoof SMS:
- `id` uuid PK
- `recipient_phone` text
- `recipient_name` text (nullable, for employee name)
- `sender_name` text (the spoofed sender ID)
- `message` text
- `template_id` uuid (nullable, FK to sms_spoof_templates)
- `created_at` timestamptz
- RLS: admin-only SELECT

## Edge Function Change (`supabase/functions/sms-spoof/index.ts`)
After a successful SMS send (non-error response), log the send to `sms_spoof_logs` using the Supabase service role client. Accept optional `recipientName` and `templateId` fields from the request body.

## UI Change (`src/pages/admin/AdminSmsSpoof.tsx`)
1. Add a "History" section at the bottom with a table showing: Datum, Empfänger, Telefon, Absender, and a "Preview" button.
2. Fetch from `sms_spoof_logs` ordered by `created_at desc`.
3. Preview Dialog: clicking a row opens a dialog showing the full message text, recipient info, and sender name.
4. Pass `recipientName` and `templateId` from both the manual send and template send flows so the edge function can log them.
