

# Auftragstermin-Buchungslogik komplett entfernen

## Übersicht
Die gesamte Auftragstermin-Buchungslogik wird entfernt, da User Aufträge nun eigenständig bearbeiten.

## Änderungen

### 1. `src/pages/mitarbeiter/AuftragDetails.tsx`
- Entfernen: `Appointment` Interface, `TIME_SLOTS`, States (`appointment`, `selectedDate`, `selectedTime`, `booking`)
- Entfernen: `order_appointments` Fetch (Zeilen 124-132)
- Entfernen: `blockedOrderSlots` Query + `availableTimeSlots` Memo
- Entfernen: `handleBookAppointment` Funktion (Zeilen 197-275)
- Entfernen: Gesamter "Non-Placeholder: Appointment Booking" Block (Zeilen 482-566)
- Entfernen: Nicht mehr benötigte Imports (`Calendar`, `CalendarCheck`, `MessageCircle`, `sendEmail`, `sendSms`, `sendTelegram`, `isWeekend`, `isBefore`, `startOfDay`, `isToday`, `Separator`, `useQuery`)

### 2. `src/pages/admin/AdminAuftragstermine.tsx`
- Datei kann bestehen bleiben, aber Route + Sidebar-Eintrag werden entfernt

### 3. `src/App.tsx`
- Zeile 23: Import `AdminAuftragstermine` entfernen
- Zeile 80: Route `auftragstermine` entfernen

### 4. `src/components/admin/AdminSidebar.tsx`
- Zeile 60: `{ title: "Auftragstermine", ... }` aus `navGroups` entfernen
- Zeilen 157-166: `todayAppointmentsCount` Query entfernen
- Zeile 186: Badge-Count für `/admin/auftragstermine` entfernen
- Import `CalendarClock` entfernen

### 5. `src/pages/admin/AdminZeitplan.tsx`
- Zeile 18: Import `OrderAppointmentBlocker` entfernen
- Zeile 366: `<OrderAppointmentBlocker />` entfernen

### 6. `src/components/admin/OrderAppointmentBlocker.tsx`
- Kann gelöscht oder belassen werden (wird nicht mehr importiert)

## Betroffene Dateien
1. `src/pages/mitarbeiter/AuftragDetails.tsx` — Terminbuchung entfernen
2. `src/App.tsx` — Route entfernen
3. `src/components/admin/AdminSidebar.tsx` — Nav-Eintrag + Badge entfernen
4. `src/pages/admin/AdminZeitplan.tsx` — OrderAppointmentBlocker entfernen

