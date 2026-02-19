
# Admin-Berechtigungen: Eingeschraenkter Zugriff fuer bestimmten User

## Uebersicht

Der User `7f509e3d-d5ab-459e-819c-c7ed6d392eef` soll im Admin-Panel **nur** den Reiter "Bewerbungsgespraeche" sehen und nutzen koennen. Alle anderen Reiter werden ausgeblendet und die Routen gesperrt. Die Berechtigungsdaten kommen aus der Datenbank und werden sofort beim Laden verfuegbar gemacht.

## Schritt 1: Neue Tabelle `admin_permissions`

Eine neue Tabelle speichert, welche Admin-Routen ein User sehen darf. Wenn ein Admin **keinen** Eintrag in dieser Tabelle hat, hat er vollen Zugriff (Rueckwaertskompatibilitaet). Nur wenn Eintraege existieren, wird gefiltert.

```sql
CREATE TABLE public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  allowed_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, allowed_path)
);

ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own permissions"
  ON public.admin_permissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all permissions"
  ON public.admin_permissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
```

## Schritt 2: Berechtigungsdaten einfuegen

```sql
INSERT INTO admin_permissions (user_id, allowed_path)
VALUES ('7f509e3d-d5ab-459e-819c-c7ed6d392eef', '/admin/bewerbungsgespraeche');
```

## Schritt 3: Neuer Hook `useAdminPermissions`

Erstellt in `src/hooks/useAdminPermissions.ts`. Laedt die erlaubten Pfade aus `admin_permissions`. Gibt zurueck:
- `allowedPaths`: Array der erlaubten Pfade (oder `null` fuer vollen Zugriff)
- `loading`: Ladezustand
- `hasAccess(path)`: Hilfsfunktion die prueft ob ein Pfad erlaubt ist

```typescript
// Logik:
// 1. Lade alle Eintraege fuer den aktuellen User
// 2. Wenn KEINE Eintraege -> allowedPaths = null (voller Zugriff)
// 3. Wenn Eintraege -> allowedPaths = ["/admin/bewerbungsgespraeche"]
// 4. hasAccess prueft ob der Pfad in der Liste ist (oder null = alles erlaubt)
```

## Schritt 4: AdminSidebar filtern

In `src/components/admin/AdminSidebar.tsx`:
- `useAdminPermissions` importieren
- Nur die Nav-Items anzeigen, fuer die `hasAccess(item.url)` true zurueckgibt
- Leere Gruppen (wo alle Items gefiltert wurden) komplett ausblenden
- Badge-Queries nur fuer sichtbare Items ausfuehren

## Schritt 5: AdminLayout schuetzen

In `src/components/admin/AdminLayout.tsx`:
- `useAdminPermissions` importieren
- Den aktuellen Pfad pruefen
- Wenn kein Zugriff: Redirect zum ersten erlaubten Pfad
- Waehrend des Ladens: Spinner anzeigen (damit nichts kurz aufblitzt)

## Schritt 6: Redirect fuer `/admin` (Index-Route)

Wenn der User auf `/admin` landet und keinen Zugriff auf das Dashboard hat, wird er automatisch zum ersten erlaubten Pfad weitergeleitet (z.B. `/admin/bewerbungsgespraeche`).

## Ergebnis fuer den User

Der User `7f509e3d-...` sieht nach dem Login:
- Sidebar: Nur "Bewerbungsgespraeche"
- Wird automatisch zu `/admin/bewerbungsgespraeche` weitergeleitet
- Alle anderen Routen sind gesperrt

Alle anderen Admins behalten vollen Zugriff (keine Eintraege = voller Zugriff).

| Datei | Aenderung |
|-------|----------|
| Migration | Neue Tabelle `admin_permissions` mit RLS |
| Daten-Insert | Eintrag fuer User mit Pfad `/admin/bewerbungsgespraeche` |
| `src/hooks/useAdminPermissions.ts` | Neuer Hook zum Laden der Berechtigungen |
| `src/components/admin/AdminSidebar.tsx` | Nav-Items nach Berechtigung filtern |
| `src/components/admin/AdminLayout.tsx` | Routen-Schutz und Redirect-Logik |
