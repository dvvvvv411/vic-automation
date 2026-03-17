

## Plan: Branding-basierte SMS-Deaktivierung fuer Ident-Daten

### Ansatz

Eine neue Spalte `sms_ident_disabled` (boolean, default `false`) auf der `brandings`-Tabelle. Standardmaessig aktiviert (false = SMS wird gesendet), kann pro Branding deaktiviert werden.

### Aenderungen

**1. DB-Migration: Neue Spalte auf `brandings`**

```sql
ALTER TABLE public.brandings
ADD COLUMN sms_ident_disabled boolean NOT NULL DEFAULT false;
```

**2. `src/pages/admin/AdminSmsTemplates.tsx` — Toggle bei ident_daten_gesendet Template**

Beim Template mit `event_type === 'ident_daten_gesendet'` einen Switch anzeigen, der den Wert von `brandings.sms_ident_disabled` fuer das aktive Branding toggelt. Query laedt den aktuellen Wert, Switch speichert direkt per Update auf `brandings`.

- Aktives Branding kommt aus `useBrandingFilter().activeBrandingId`
- Label: "SMS bei Ident-Daten deaktivieren" mit Switch
- Toggle updatet `brandings.sms_ident_disabled` direkt

**3. `src/pages/admin/AdminIdentDetail.tsx` — Pruefung vor SMS-Versand**

In der `handleSave`-Funktion (Zeile 265-306): Vor dem SMS-Versand den Branding-Wert `sms_ident_disabled` abfragen. Wenn `true`, wird keine SMS gesendet. Die Branding-Query (Zeile 288-293) wird erweitert um `sms_ident_disabled`.

```typescript
// Erweitere bestehende Branding-Query
const { data: br } = await supabase
  .from("brandings")
  .select("sms_sender_name, sms_ident_disabled")
  .eq("id", branding)
  .single();
if ((br as any)?.sms_ident_disabled) {
  // Skip SMS
} else {
  await sendSms({ ... });
}
```

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| DB-Migration | `sms_ident_disabled` Spalte auf `brandings` |
| `src/pages/admin/AdminSmsTemplates.tsx` | Switch-Toggle beim Ident-Template |
| `src/pages/admin/AdminIdentDetail.tsx` | Pruefung vor SMS-Versand |

