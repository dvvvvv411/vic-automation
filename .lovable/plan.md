

# SMS Spoof Page Improvements

## 1. "+" Card an erster Stelle
Move the "Neues Template" button card before the template list in the grid (currently it's after).

## 2. Template Cards: Edit statt Delete
- Replace the `Trash2` delete button on each template card with a `Pencil` edit icon
- Clicking edit opens an **Edit Dialog** pre-filled with the template's values (label, sender_name, message)
- The edit dialog includes a save button and a **delete button** (red, destructive) at the bottom
- New state: `editTemplate` to track which template is being edited, plus `editLabel`, `editSender`, `editMessage` fields
- New handler: `handleUpdateTemplate` that calls `.update()` on `sms_spoof_templates`

## 3. Employee Selection Dialog: Search + Scroll Limit
- Add a search state `employeeSearch` to the employee dialog
- Add an `Input` with search icon at the top of the dialog
- Filter employees by first/last name matching the search term
- Set `max-h` on the scrollable list so only ~10 employees are visible at once (roughly `max-h-[400px]`), rest accessible by scrolling

## File Changes
**`src/pages/admin/AdminSmsSpoof.tsx`** only:
1. Add new state vars: `editTemplate`, `editLabel`, `editSender`, `editMessage`, `employeeSearch`
2. Move "+" card before `templates.map()` in the grid
3. Replace `Trash2` button with `Pencil` edit button on template cards
4. Add Edit Template Dialog with pre-filled fields + delete button
5. Add search input + scroll constraint to Employee Selection Dialog

