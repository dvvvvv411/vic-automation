

# SMS Spoof Templates Feature

## Overview
Add a new "Templates" section to `/admin/sms-spoof` where admins can create reusable SMS templates with sender name, message text, and variable support. Each saved template shows as a card with a "Send" button that opens a multi-step dialog: employee selection -> confirmation preview -> send.

## Database

**New table: `sms_spoof_templates`**
- `id` uuid PK
- `sender_name` text (max 11 chars)
- `message` text (max 160 chars)
- `label` text (display name)
- `created_at` timestamptz
- RLS: admin-only CRUD

## UI Changes

**File: `src/pages/admin/AdminSmsSpoof.tsx`**

Add a new section below the existing "Nachricht senden" card:

1. **Template Creator** - Card with inputs for Label, Absendername (max 11), Nachricht (max 160), and a "Speichern" button. Info box listing available variables: `%Vorname%`, `%Nachname%`, `%Unternehmen%`.

2. **Saved Templates** - Grid of cards, each showing label, sender name, message preview, and two buttons: "Loeschen" and "SMS senden".

3. **Employee Selection Dialog** - When "SMS senden" is clicked, a dialog opens listing all employees (from `employment_contracts` joined with `applications` for branding). Each row shows name + phone. Clicking a row opens the confirmation step.

4. **Confirmation Dialog** - Shows the resolved message (variables replaced with actual employee data), recipient name, phone number, and sender name. "Senden" button invokes `sms-spoof` edge function with the resolved values.

**Variable Resolution Logic:**
- `%Vorname%` -> `employment_contracts.first_name`
- `%Nachname%` -> `employment_contracts.last_name`
- `%Unternehmen%` -> `brandings.company_name` (via `applications.branding_id`)

## Data Flow
1. Query employees: `employment_contracts` (status != 'offen', not suspended) joined with `applications` -> `brandings` for company name
2. On employee select: replace variables in template message
3. On confirm: call `sms-spoof` edge function with `{ action: "send", to, senderID, text }`

No edge function changes needed -- the existing send action handles everything.

