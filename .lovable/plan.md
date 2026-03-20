

## Detaillierte Fusszeile fuer automatische E-Mails

### Uebersicht

Die E-Mail-Fusszeile zeigt aktuell nur Firmenname und Adresse. Sie soll erweitert werden um: Geschaeftsfuehrer, Telefonnummer, Handelsregister-Nummer, Amtsgericht, Umsatzsteuer-ID. Alle Felder existieren bereits in der `brandings`-Tabelle — keine DB-Migration noetig.

### Aenderungen

**1. Edge Function `send-email/index.ts`**

- Branding-Query erweitern um `managing_director, phone, register_court, trade_register, vat_id`
- Diese Werte an `buildEmailHtml` durchreichen (neuer Parameter `footerDetails`)
- Footer-HTML erweitern: Unter der bestehenden Zeile (Firmenname · Adresse) weitere Zeilen mit den neuen Feldern, nur wenn befuellt

Footer-Aufbau:
```
Firmenname · Strasse, PLZ Ort
Geschaeftsfuehrer: Max Mustermann · Tel: +49 123 456
Amtsgericht: Muenchen · HRB 123456 · USt-ID: DE123456789
```

**2. Admin E-Mail-Vorschau `AdminEmails.tsx`**

- Gleiche Aenderungen am client-seitigen `buildEmailHtml`-Mirror
- Branding-Query erweitern um die 5 zusaetzlichen Felder
- Footer-Details an die Render-Funktion durchreichen

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `supabase/functions/send-email/index.ts` | Branding-Query + Footer-HTML erweitern |
| `src/pages/admin/AdminEmails.tsx` | Gleiche Footer-Erweiterung im Preview-Mirror |

