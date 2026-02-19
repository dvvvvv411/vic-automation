

# Testdaten bereinigen

## Uebersicht

Alle Testdaten werden aus der Datenbank entfernt. Die beiden Admin-Accounts und die 3 genannten echten Bewerbungen bleiben erhalten.

## Was bleibt erhalten

| Typ | Daten |
|-----|-------|
| Admin-Accounts | `admin@admin.de` (d981ca8d), `caller@vicpage.com` (7f509e3d) |
| Bewerbungen | `info@sl-textschmiede.de`, `Ledwon.Felix@gmail.com`, `TKasberger33@gmail.com` |
| Bewerbung (zusaetzlich) | `sabine_marc@web.de` -- wurde nicht als Testdaten genannt, bleibt also auch |

## Was geloescht wird (in der richtigen Reihenfolge wegen Abhaengigkeiten)

### Schritt 1: Abhaengige Daten loeschen

1. **order_reviews** -- alle (gehoeren alle zu Test-Vertraegen)
2. **order_appointments** -- alle (gehoeren alle zu Test-Vertraegen)
3. **order_assignments** -- alle (gehoeren alle zu Test-Vertraegen)
4. **chat_messages** -- alle (gehoeren alle zu Test-Vertraegen)

### Schritt 2: Arbeitsvertraege loeschen

Alle 8 `employment_contracts` loeschen (alle gehoeren zu Test-Bewerbungen)

### Schritt 3: Bewerbungsgespraeche loeschen

Alle 9 `interview_appointments` loeschen (alle gehoeren zu Test-Bewerbungen)

### Schritt 4: Test-Bewerbungen loeschen

Folgende Bewerbungen loeschen:
- `max@muster.de` (0bbe3297)
- `lul@lul.de` (e34ba5c6)
- `test@test.de` (bcbc3b8c)
- `fabian@minijob.de` (838e4085)
- `fabian@teilzeit.de` (2a89963c)
- `fabian@vollzeit.de` (1212a29a)
- `robertadam64738@gmail.com` -- 3 Bewerbungen (7cd5db94, 1ba66aaa, 71d52bc8)

### Schritt 5: Test-User-Accounts loeschen

Profiles und User-Roles fuer diese 6 Auth-User loeschen:
- `186e69a0` (max@muster.de)
- `898d2ca1` (test@test.de)
- `c7264f64` (fabian@minijob.de)
- `005a12f4` (fabian@teilzeit.de)
- `a1c3e21a` (fabian@vollzeit.de)
- `512fde07` (robertadam64738@gmail.com)

Danach die Auth-User selbst aus `auth.users` loeschen.

### Schritt 6: Hinweis zu `sabine_marc@web.de`

Die Bewerbung von `sabine_marc@web.de` wurde nicht in der Loeschliste genannt. Sie bleibt erhalten. Falls sie auch geloescht werden soll, bitte Bescheid geben.

## Technische Umsetzung

Alles wird ueber SQL-Daten-Operationen (INSERT-Tool) ausgefuehrt -- keine Schema-Migration noetig. Die Loesch-Reihenfolge beachtet Fremdschluessel-Abhaengigkeiten.

