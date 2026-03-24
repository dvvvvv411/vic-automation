

## Plan: Resend API Key sichtbar machen (Toggle)

### Aenderung

**`src/pages/admin/AdminBrandingForm.tsx`**

- Neuen State `showResendKey` (boolean, default `false`) hinzufuegen
- Das Input-Feld fuer `resend_api_key` (Zeile 524) erhaelt `type={showResendKey ? "text" : "password"}`
- Daneben ein kleiner Toggle-Button mit Eye/EyeOff Icon zum Umschalten

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/admin/AdminBrandingForm.tsx` | State + Eye-Toggle am Resend API Key Input |

