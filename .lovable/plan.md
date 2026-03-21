

## Eigene E-Mail für externe Bewerbungen

### Ziel
Wenn eine externe Bewerbung (`is_external = true`) akzeptiert wird, soll eine angepasste "Bewerbung angenommen"-E-Mail versendet werden, die:
- Erwähnt, dass sich der Bewerber über Instagram/Facebook beworben hat
- Den `main_job_title` aus dem Branding enthält
- Ansonsten identisch zur normalen "Bewerbung angenommen"-E-Mail ist

### Änderungen

**1. `AdminBewerbungen.tsx` — Accept-Mutation (Zeile ~274)**
Neue Bedingung `app.is_external` vor dem `else`-Block einfügen:
- Branding-Query erweitern um `main_job_title`
- Eigene `body_lines` mit Hinweis auf Social-Media-Bewerbung und Jobtitel
- `event_type: "bewerbung_angenommen_extern"`
- Danach SMS senden wie im normalen Flow (kein Spoof)

Beispiel body_lines:
```
"wir freuen uns, Ihnen mitzuteilen, dass Ihre Bewerbung über Instagram/Facebook als „{main_job_title}" angenommen wurde."
```

**2. `AdminEmails.tsx` — Neues Template in der Vorschau-Liste**
Neuen Eintrag nach "Bewerbung angenommen" einfügen:
- `eventType: "bewerbung_angenommen_extern"`
- `label: "Bewerbung angenommen (Extern)"`
- Branding-Query in der Vorschau muss `main_job_title` laden
- `bodyLines` mit Social-Media-Hinweis und Jobtitel-Platzhalter

Da der Jobtitel dynamisch aus dem Branding kommt, muss die `bodyLines`-Funktion den Jobtitel als zweiten Parameter erhalten oder separat geladen werden. Die Preview-Komponente lädt bereits Branding-Daten — diese Query um `main_job_title` erweitern.

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminBewerbungen.tsx` | Neue Bedingung für `is_external` im Accept-Flow |
| `src/pages/admin/AdminEmails.tsx` | Neues Template + `main_job_title` in Branding-Query |

### Keine DB-Migration nötig

