

# Registrierung auf der Auth-Seite

## Übersicht
Tab-basiertes UI auf der rechten Seite: **Anmelden** / **Registrieren**. Bei Registrierung werden Vorname, Nachname, E-Mail, Passwort, Passwort bestätigen und Handynummer abgefragt.

## 1. Profil-Tabelle erweitern

Die `profiles`-Tabelle hat kein `phone`-Feld. Migration:
```sql
ALTER TABLE public.profiles ADD COLUMN phone text;
```

Trigger `handle_new_user` erweitern, um `phone` und korrekt zusammengesetzten `full_name` zu speichern:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL)
  );
  RETURN NEW;
END;
$$;
```

## 2. Auth.tsx erweitern

- State `mode` hinzufügen: `"login"` | `"register"`
- Registrierungs-State: `firstName`, `lastName`, `regEmail`, `regPassword`, `regPasswordConfirm`, `phone`
- Zwei Tabs oben im Formular-Bereich (Text-Buttons oder einfache Tabs)
- Validierung: Passwörter müssen übereinstimmen, alle Felder ausgefüllt
- `supabase.auth.signUp()` mit `user_metadata: { full_name: "Vorname Nachname", phone }`
- Erfolg: Toast "Registrierung erfolgreich!" → automatischer Login und Redirect

## 3. Felder im Registrierungsformular

```
Vorname          Nachname        (nebeneinander)
E-Mail
Handynummer
Passwort
Passwort bestätigen
[Registrieren Button]
```

## Betroffene Dateien
1. **Migration** — `phone` Spalte auf `profiles`, Trigger Update
2. `src/pages/Auth.tsx` — Tab-UI + Registrierungsformular
3. `src/integrations/supabase/types.ts` — wird automatisch aktualisiert

