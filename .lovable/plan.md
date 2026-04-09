

## Plan: E-Mail-Templates für Extern (Allgemein) vs. Extern (META) trennen

### Problem
Aktuell verwenden **beide** Extern-Typen (Allgemein + META) den gleichen E-Mail-Text mit "Instagram/Facebook"-Bezug. Extern (Allgemein) sollte diesen Bezug **nicht** haben.

### Änderungen

**1. `src/pages/admin/AdminEmails.tsx` — Templates-Vorschau**

- Bestehendes Template `bewerbung_angenommen_extern` umbenennen zu **"Bewerbung angenommen (Extern - META)"** und `eventType` auf `bewerbung_angenommen_extern_meta` setzen (mit Instagram/Facebook-Text)
- Neues Template hinzufügen: **"Bewerbung angenommen (Extern - Allgemein)"** mit `eventType: "bewerbung_angenommen_extern"` — gleicher Text, aber **ohne** "über Instagram/Facebook", stattdessen z.B. "dass Ihre Bewerbung als ‚{Jobtitel}' angenommen wurde."

**2. `src/pages/admin/AdminBewerbungen.tsx` — E-Mail-Text bei Annehmen**

4 Stellen anpassen (Einzel-Annehmen + Bulk-Annehmen, jeweils `is_external`-Block):

- **Extern (Allgemein)** `body_lines`: "Instagram/Facebook" entfernen → `"wir freuen uns, Ihnen mitzuteilen, dass Ihre Bewerbung${mainJobTitle ? ` als „${mainJobTitle}"` : ""} angenommen wurde."`
- **Extern (Allgemein)** SMS-Fallback: ebenfalls "Instagram/Facebook" entfernen
- **Extern (META)** bleibt unverändert (hat bereits den Instagram/Facebook-Bezug)

### Betroffene Stellen im Detail

| Datei | Zeilen | Änderung |
|---|---|---|
| `AdminEmails.tsx` | 154-167 | Label → "Bewerbung angenommen (Extern - META)", eventType → `bewerbung_angenommen_extern_meta` |
| `AdminEmails.tsx` | nach 167 | Neues Template "Bewerbung angenommen (Extern - Allgemein)" einfügen |
| `AdminBewerbungen.tsx` | 325-328 | Einzel-Annehmen: "Instagram/Facebook" aus body_lines entfernen |
| `AdminBewerbungen.tsx` | 351 | Einzel-Annehmen: SMS-Fallback ohne Instagram/Facebook |
| `AdminBewerbungen.tsx` | 486 | Bulk-Annehmen: body_lines ohne Instagram/Facebook |
| `AdminBewerbungen.tsx` | 492 | Bulk-Annehmen: SMS-Fallback ohne Instagram/Facebook |

