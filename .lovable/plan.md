

# Umfassende Admin-UI und Feature-Erweiterungen

## 1. Icon-Only Buttons mit Tooltips (4 Dateien)

### `/admin/bewerbungen` (`AdminBewerbungen.tsx`)
- "Link kopieren" Button (Zeile 493-496): Text entfernen, nur `Copy` Icon, `size="icon"` verwenden
- Copy + Trash2 Buttons im Aktionen-Bereich: einheitlich als `size="icon"` Buttons nebeneinander

### `/admin/bewertungen` (`AdminBewertungen.tsx`)
- "Details" Button (Zeile 316): durch Icon-Button mit `FileText` oder `Eye` ersetzen
- "Genehmigen" und "Ablehnen" Buttons (Zeile 321-341): Text entfernen, nur Icons
- Gleiches im Dialog (Zeile 379-399)

### `/admin/mitarbeiter` (`AdminMitarbeiter.tsx`)
- "Details" Button (Zeile 248-250): nur `Eye` Icon
- "Sperren"/"Entsperren" Button (Zeile 253-267): nur `Lock`/`Unlock` Icon

### Tooltips
- Alle icon-only Buttons mit `<Tooltip>` aus `@/components/ui/tooltip` wrappen
- `<TooltipProvider>` einmal pro Seite
- Hover zeigt den jeweiligen Text ("Link kopieren", "Löschen", "Details", "Genehmigen", "Ablehnen", "Sperren", "Entsperren")

## 2. Telegram Branding-Zuordnung (`AdminTelegram.tsx` + DB)

### Datenbank
- Neue Tabelle `telegram_chat_brandings` mit `telegram_chat_id` (FK), `branding_id` (FK) und RLS (admin-only)
- Oder einfacher: `branding_ids uuid[]` Spalte zur `telegram_chats` Tabelle hinzufügen

**Gewählt: `branding_ids uuid[]` Spalte** (konsistent mit `events` Array-Pattern)

### Migration
```sql
ALTER TABLE public.telegram_chats 
ADD COLUMN branding_ids uuid[] NOT NULL DEFAULT '{}';
```

### UI-Änderungen
- Beim Erstellen einer Chat-ID: Multi-Select Checkboxen für Brandings (wie bei Events)
- Bei bestehenden Chat-IDs: Branding-Checkboxen anzeigen + toggle-Logik
- Brandings-Query laden und als Checkboxen anzeigen

## 3. Zeitplan-Überarbeitung (`AdminZeitplan.tsx` + `OrderAppointmentBlocker.tsx` + DB)

### 3a. Vergangene blockierte Slots automatisch löschen
- Beim Laden der blocked slots: nach dem Fetch alle Slots filtern, deren `blocked_date` in der Vergangenheit liegt
- Diese per Batch-Delete entfernen (einmalig beim Query-Load)
- Gilt für beide: `schedule_blocked_slots` und `order_appointment_blocked_slots`

### 3b. Intervallwechsel ab Stichtag entfernen
- Gesamten "Intervallwechsel ab Stichtag" Block (Zeile 257-308) entfernen
- Standard-Intervall auf 20 Minuten setzen in der Save-Mutation
- `new_slot_interval_minutes` und `interval_change_date` auf null setzen beim Speichern
- `getIntervalForDate` Funktion vereinfachen (immer `effectiveInterval` zurückgeben)
- 20-Minuten Option zum Intervall-Select hinzufügen

### 3c. Per-Branding Zeiteinstellungen
- Neue Tabelle `branding_schedule_settings`:
```sql
CREATE TABLE public.branding_schedule_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branding_id uuid NOT NULL REFERENCES public.brandings(id) ON DELETE CASCADE,
  start_time time NOT NULL DEFAULT '08:00',
  end_time time NOT NULL DEFAULT '18:00',
  slot_interval_minutes integer NOT NULL DEFAULT 20,
  available_days integer[] NOT NULL DEFAULT '{1,2,3,4,5,6}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(branding_id)
);
ALTER TABLE public.branding_schedule_settings ENABLE ROW LEVEL SECURITY;
-- Admin-only policies
```
- UI: Tabs oder Accordion pro Branding mit individuellen Einstellungen
- Globale Einstellungen bleiben als Fallback

### 3d. Branding-Auswahl beim Blockieren
- Sowohl bei Bewerbungsgespräch-Slots als auch Auftragstermin-Slots: Branding-Dropdown hinzufügen
- Neue Spalte `branding_id uuid` in `schedule_blocked_slots` und `order_appointment_blocked_slots`
```sql
ALTER TABLE public.schedule_blocked_slots ADD COLUMN branding_id uuid REFERENCES public.brandings(id);
ALTER TABLE public.order_appointment_blocked_slots ADD COLUMN branding_id uuid REFERENCES public.brandings(id);
```

## 4. Livechat Template-Erstellung (`ChatInput.tsx` + `TemplateDropdown.tsx`)

### Aktuelles Verhalten
- "Neues Template erstellen" in TemplateDropdown öffnet direkt den Erstellungs-Dialog

### Neues Verhalten
- Klick auf "Neues Template erstellen" → öffnet den `TemplateManager` Dialog (alle Templates + Erstellen)
- Den `TemplateManager` als managed Dialog nutzen (über state statt eigenen DialogTrigger)
- In `ChatInput.tsx`: `handleCreateNew` öffnet den TemplateManager statt den einfachen Dialog
- `TemplateManager` erhält eine `open`/`onOpenChange` Prop statt eigenem DialogTrigger

## Dateien-Übersicht

| Datei | Änderung |
|-------|----------|
| `AdminBewerbungen.tsx` | Icon-only Buttons + Tooltips |
| `AdminBewertungen.tsx` | Icon-only Buttons + Tooltips |
| `AdminMitarbeiter.tsx` | Icon-only Buttons + Tooltips |
| `AdminTelegram.tsx` | Branding-Auswahl pro Chat-ID |
| `AdminZeitplan.tsx` | Stichtag entfernen, Per-Branding Settings, Branding beim Blockieren, Auto-Delete |
| `OrderAppointmentBlocker.tsx` | Branding beim Blockieren, Auto-Delete |
| `ChatInput.tsx` | TemplateManager öffnen statt direktem Dialog |
| `TemplateManager.tsx` | Controlled open/onOpenChange Props |
| `TemplateDropdown.tsx` | Keine Änderung |
| DB-Migration | 3 Migrations (telegram branding_ids, branding_schedule_settings, blocked_slots branding_id) |

