

# Auth, Rollen & Dashboard-Seiten fuer Vic Automation 2.0

## Uebersicht

Komplette Authentifizierung mit Registrierung/Anmeldung, zwei Benutzerrollen (admin/user), rollenbasierte Weiterleitung und zwei Platzhalter-Dashboards. Branding wird von Gruen auf modernes Blau umgestellt.

---

## 1. Branding-Update: Blau statt Gruen

Die primaere Farbe in `src/index.css` wird von `160 80% 55%` (Gruen) auf ein modernes Blau umgestellt (ca. `217 91% 60%` -- ein kraeftiges, modernes Blau).

---

## 2. Datenbank-Setup (SQL-Migrationen)

**a) Profiles-Tabelle** -- speichert Benutzerdaten wie Anzeigename:

- `id` (UUID, Referenz auf `auth.users`)
- `full_name` (Text)
- `created_at` (Timestamp)
- RLS: Benutzer koennen nur ihr eigenes Profil lesen/aktualisieren
- Trigger: Automatische Profil-Erstellung bei Registrierung

**b) Rollen-System** (separate Tabelle, wie vorgeschrieben):

- Enum `app_role` mit Werten `admin` und `user`
- Tabelle `user_roles` mit `user_id` und `role`
- Security-Definer-Funktion `has_role()` zur sicheren Rollenpruefung
- RLS auf `user_roles`: Benutzer koennen nur ihre eigene Rolle lesen
- Trigger: Neue Benutzer erhalten automatisch die Rolle `user`

---

## 3. Neue Seiten & Komponenten

### `/auth` -- Authentifizierungsseite
- Tabs fuer "Anmelden" und "Registrieren"
- Anmeldung: E-Mail + Passwort
- Registrierung: Name, E-Mail, Passwort
- Premium-Design: Dunkler Hintergrund, blaue Akzente, Glasmorphism-Card, dezenter Glow
- Nach Login: Automatische Weiterleitung basierend auf Rolle

### `/admin` -- Admin-Dashboard (Platzhalter)
- Begruessung, Statistik-Karten (z.B. "Aktive Tester", "Laufende Tests", "Abgeschlossene Tests")
- Sidebar oder Top-Navigation mit Logout
- Geschuetzt: Nur fuer Admins zugaenglich
- App-Tester Branding

### `/mitarbeiter` -- Mitarbeiter-Dashboard (Platzhalter)
- Begruessung, eigene Statistik-Karten (z.B. "Meine Tests", "Verdienst", "Offene Aufgaben")
- Sidebar oder Top-Navigation mit Logout
- Geschuetzt: Nur fuer User-Rolle zugaenglich
- App-Tester Branding

---

## 4. Auth-Logik & Routing

### AuthProvider (Context)
- Verwaltet Session-State mit `onAuthStateChange`
- Stellt `user`, `session`, `loading`, `signOut` bereit

### Rollenpruefung
- Custom Hook `useUserRole` -- laedt die Rolle des eingeloggten Benutzers aus `user_roles`
- Wird verwendet fuer Weiterleitung und Seitenschutz

### Geschuetzte Routen
- `ProtectedRoute`-Komponente: Prueft ob eingeloggt und korrekte Rolle
- Leitet nicht-eingeloggte Benutzer zu `/auth`
- Leitet Admins automatisch zu `/admin`, User zu `/mitarbeiter`

### Routing in App.tsx
- `/` -- Landing Page (bleibt)
- `/auth` -- Login/Register
- `/admin` -- Admin-Dashboard (geschuetzt, nur admin)
- `/mitarbeiter` -- Mitarbeiter-Dashboard (geschuetzt, nur user)

---

## Technische Details

### Neue Dateien
| Datei | Zweck |
|---|---|
| `src/contexts/AuthContext.tsx` | Auth-State-Management |
| `src/hooks/useUserRole.ts` | Rolle des Benutzers laden |
| `src/components/ProtectedRoute.tsx` | Routenschutz mit Rollenpruefung |
| `src/pages/Auth.tsx` | Login/Register-Seite |
| `src/pages/Admin.tsx` | Admin-Dashboard Platzhalter |
| `src/pages/Mitarbeiter.tsx` | Mitarbeiter-Dashboard Platzhalter |

### Geaenderte Dateien
| Datei | Aenderung |
|---|---|
| `src/index.css` | Primaerfarbe auf Blau |
| `src/App.tsx` | Neue Routen, AuthProvider wrappen |
| `src/pages/Index.tsx` | Primaerfarbe-Referenz aktualisieren |

### SQL-Migrationen
1. Profiles-Tabelle + Trigger
2. `app_role` Enum + `user_roles` Tabelle + `has_role()` Funktion + Trigger fuer Default-Rolle

