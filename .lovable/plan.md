

## E-Mail-Fusszeile schoener gestalten

### Problem

Aktuell sind Firmenname, Adresse, Geschaeftsfuehrer, Telefon, Amtsgericht, HRB und USt-ID als dichte Textbloecke mit `·`-Trennern aneinandergereiht — schwer lesbar.

### Neues Design

Statt Fliesstext wird eine strukturierte zweispaltige Tabelle mit Icons/Labels verwendet:

```text
─────────────────────────────────────────
  Firmenname
  Strasse, PLZ Ort

  Geschäftsführer    Max Mustermann
  Telefon            +49 123 456789
  Amtsgericht        München
  Handelsregister    HRB 123456
  USt-ID             DE123456789
─────────────────────────────────────────
```

- Jedes Detail bekommt eine eigene Zeile mit grauem Label links und Wert rechts
- Firmenname + Adresse zentriert oben, leicht groesser
- Einzelne Zeilen nur wenn Wert vorhanden
- Subtile Hintergrundfarbe (`#f8fafc`) fuer den gesamten Footer-Block
- Kleinere Schrift (12px) fuer die Detail-Zeilen, Labels in `color:#94a3b8`, Werte in `#64748b`

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `supabase/functions/send-email/index.ts` | Footer-HTML in `buildEmailHtml` neu gestalten |
| `src/pages/admin/AdminEmails.tsx` | Gleiche Aenderung im client-seitigen Mirror |

Keine DB-Aenderungen. Edge Function wird redeployed.

