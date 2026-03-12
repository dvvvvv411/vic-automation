

# Stellenanzeigen-Link unter dem Button in der "Bewerbung angenommen"-E-Mail

## Änderung

In `src/pages/admin/AdminBewerbungen.tsx` wird in beiden E-Mail-Aufrufen (Indeed und Normal, Zeilen 220-223 und 255-258) eine zusätzliche `body_line` nach dem Button-Text eingefügt. Dazu muss vorher die Branding-Domain geladen werden (analog zu `buildBrandingUrl`, aber ohne `web.`-Prefix).

### Code-Änderung

**Beide `sendEmail`-Aufrufe** (Zeile ~214 und ~250): Die Branding-Domain wird abgefragt und ein Karriere-Link gebaut (`https://{domain}/karriere`). Dann wird eine zusätzliche Zeile in `body_lines` ergänzt:

```
Schauen Sie sich noch einmal die Stellenanzeige an: https://guvi.solutions/karriere
```

Da `body_lines` **vor** dem Button gerendert werden (im HTML-Template), muss der Karriere-Link **nach** dem Button erscheinen. Dafür gibt es zwei Optionen:

1. **Einfach als letzte `body_line`** — wird dann über dem Button angezeigt (nicht ideal)
2. **HTML-Template erweitern** um einen `footer_lines`-Parameter, der nach dem Button gerendert wird

Ich werde Option 2 umsetzen: Sowohl die Edge Function (`send-email/index.ts`) als auch die Client-Funktion (`sendEmail.ts`) bekommen einen optionalen Parameter `footer_lines: string[]`, der nach dem Button im E-Mail-Body gerendert wird.

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `supabase/functions/send-email/index.ts` | `footer_lines` Parameter + HTML nach Button rendern |
| `src/lib/sendEmail.ts` | `footer_lines` zum Interface hinzufügen |
| `src/pages/admin/AdminBewerbungen.tsx` | Branding-Domain laden, Karriere-Link bauen, `footer_lines` übergeben |
| `src/pages/admin/AdminEmails.tsx` | Template-Vorschau für "bewerbung_angenommen" um Karriere-Zeile erweitern |

### Karriere-Link-Logik
- Branding-Domain aus `brandings.domain` laden (bereits in `buildBrandingUrl` vorhanden)
- Domain ohne `web.`-Prefix verwenden: `https://{domain}/karriere`
- Fallback: Link weglassen wenn keine Domain konfiguriert

