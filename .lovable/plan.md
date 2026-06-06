# Mehrfach-Slots pro Bewerbungsgespräch-Termin

## Ziel
Pro Branding einstellbar, wie viele Bewerber denselben Zeitslot (z.B. 10:30 Uhr) buchen dürfen. Standard: 1. Termine werden erst als "belegt" markiert, wenn alle Slots vergeben sind. In der Übersicht bekommt jeder gebuchte Termin ein Label "1. Slot", "2. Slot", "3. Slot".

## Änderungen

### 1. Datenbank
- Neue Spalte `interview_slots_per_time INTEGER NOT NULL DEFAULT 1` in `branding_schedule_settings` (nur für `schedule_type = 'interview'` relevant).

### 2. Admin-Einstellung (`/admin/zeitplan` → Tab Bewerbungsgespräche)
- In `BrandingScheduleForm` (Datei `src/pages/admin/AdminZeitplan.tsx`) ein zusätzliches Feld "Slots pro Uhrzeit" (Number-Input, min 1, max 10), nur im Interview-Tab sichtbar.
- Wert wird zusammen mit den anderen Einstellungen in `branding_schedule_settings` gespeichert.

### 3. Öffentliche Buchungsseite (`src/pages/Bewerbungsgespraech.tsx`)
- Statt `Set<string>` der gebuchten Zeiten wird `Map<string, number>` (Uhrzeit → Anzahl bestehender Buchungen) erstellt.
- Ein Zeitslot wird nur dann ausgegraut/`isBooked`, wenn `count >= interview_slots_per_time`.
- Blockierte Slots aus `schedule_blocked_slots` bleiben immer disabled.
- Setting `interview_slots_per_time` wird aus den vorhandenen `branding_schedule_settings`-Daten gelesen.

### 4. Admin-Übersicht (`src/pages/admin/AdminBewerbungsgespraeche.tsx`)
- Für jede Liste (vergangen / heute&morgen / zukünftig) nach dem Laden ein Slot-Index berechnen:
  - Gruppieren nach `appointment_date + appointment_time`
  - Innerhalb der Gruppe nach `created_at ASC` sortieren → Index 1, 2, 3 …
- Neues Badge "1. Slot" / "2. Slot" neben der Uhrzeit anzeigen (nur sichtbar wenn Branding `interview_slots_per_time > 1` ODER wenn überhaupt mehrere Buchungen auf demselben Slot existieren — sicherer: immer wenn Gruppe > 1).
- Sortierung anpassen: primär nach `appointment_date`/`appointment_time` (wie bisher), sekundär nach Slot-Index aufsteigend, damit bei identischer Uhrzeit Slot 1 oben steht, dann 2, dann 3.

### 5. Keine Änderung nötig
- RPC `interview_booked_slots_for_branding` liefert weiterhin alle Buchungen — Zählung erfolgt im Frontend.
- Bestehender Conflict-Check beim Insert in `interview_appointments` bleibt entfernt/erlaubt mehrfache Einträge (kein Unique-Index vorhanden, daher passt das).

## Technische Hinweise
- Migration: `ALTER TABLE public.branding_schedule_settings ADD COLUMN interview_slots_per_time integer NOT NULL DEFAULT 1;`
- Bestehende Einträge bekommen automatisch 1 → Verhalten bleibt für alle Brandings unverändert.
- Label-Format: `${index}. Slot` als shadcn `Badge variant="secondary"`.
