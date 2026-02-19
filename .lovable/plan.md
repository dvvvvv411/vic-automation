

# Registrierungsfunktion auf /auth hinzufuegen

## Uebersicht

Auf der `/auth`-Seite wird ein Tab-Wechsel zwischen "Anmelden" und "Registrieren" hinzugefuegt. Neue Nutzer koennen sich mit E-Mail und Passwort registrieren. Nach der Registrierung wird automatisch die Rolle "user" zugewiesen (durch den bestehenden Trigger `handle_new_user_role`).

## Aenderungen

### `src/pages/Auth.tsx`

1. **Neuer State** fuer den aktiven Tab (`login` / `register`) und die Registrierungsfelder (E-Mail, Passwort, Passwort bestaetigen)

2. **Tab-Umschalter** oberhalb des Formulars -- zwei Buttons/Links zum Wechseln zwischen Anmelden und Registrieren

3. **Registrierungsformular** mit:
   - E-Mail-Feld
   - Passwort-Feld (min. 6 Zeichen)
   - Passwort bestaetigen-Feld
   - Registrieren-Button

4. **handleRegister-Funktion**:
   - Prueft ob Passwoerter uebereinstimmen
   - Ruft `supabase.auth.signUp()` auf
   - Zeigt Erfolgs- oder Fehlermeldung via `toast`

5. **Ueberschrift und Beschreibung** passen sich dynamisch an den aktiven Tab an:
   - Login: "Willkommen" / "Melden Sie sich an."
   - Register: "Konto erstellen" / "Registrieren Sie sich."

6. **Link unter dem Formular** zum Wechseln ("Noch kein Konto? Registrieren" / "Bereits ein Konto? Anmelden")

## Technische Details

```typescript
// Neuer State
const [isRegister, setIsRegister] = useState(false);
const [registerEmail, setRegisterEmail] = useState("");
const [registerPassword, setRegisterPassword] = useState("");
const [registerConfirm, setRegisterConfirm] = useState("");

// Registrierung
const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  if (registerPassword !== registerConfirm) {
    toast.error("Passwoerter stimmen nicht ueberein");
    return;
  }
  if (registerPassword.length < 6) {
    toast.error("Passwort muss mindestens 6 Zeichen lang sein");
    return;
  }
  setLoading(true);
  const { error } = await supabase.auth.signUp({
    email: registerEmail,
    password: registerPassword,
  });
  setLoading(false);
  if (error) {
    toast.error(error.message);
  } else {
    toast.success("Registrierung erfolgreich! Bitte pruefen Sie Ihre E-Mails.");
  }
};
```

Das bestehende Design (Split-Screen, Glassmorphism, Animationen) bleibt vollstaendig erhalten. Es wird lediglich das rechte Formular-Panel um die Umschaltmoeglichkeit und das Registrierungsformular erweitert.

| Datei | Aenderung |
|-------|----------|
| `src/pages/Auth.tsx` | Tab-Umschalter, Registrierungsformular und handleRegister hinzufuegen |
