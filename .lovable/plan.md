

# Fix: Gmail versteckt gesamten E-Mail-Inhalt

## Problem

Gmail's Signatur-Erkennung stuft die gesamte E-Mail als "zitiert/Signatur" ein und klappt den kompletten Inhalt ein. Man sieht nur "..." und muss klicken. Ursache: Der Footer mit separatem Hintergrund, Trennlinie und kleinem grauem Text signalisiert Gmail "ab hier ist Signatur" -- und da die E-Mail insgesamt kurz ist, wird alles eingeklappt.

## Loesung

Mehrere Massnahmen gleichzeitig, um Gmails Signatur-Erkennung zu umgehen:

1. **Footer in den Body integrieren** -- gleicher weisser Hintergrund, keine Trennlinie, keine separate Tabellenzeile
2. **Footer-Text groesser machen** (14px statt 12px) und dunklere Farbe (#6b7280 statt #9ca3af)
3. **Sichtbaren Abschluss-Text hinzufuegen** nach dem Footer (z.B. Leerzeile oder unsichtbarer Inhalt), damit Gmail den Footer nicht als "Ende-Signatur" erkennt
4. **Footer direkt in die Body-Zelle verschieben** statt als eigene Tabellenzeile -- so gibt es keinen visuellen "Block-Bruch"

## Technische Aenderungen

### `supabase/functions/send-email/index.ts`

Die HTML-Struktur aendern: Statt drei separate Tabellenzeilen (Header, Body, Footer) wird der Footer **in die Body-Zelle integriert** als normaler Absatz am Ende:

```
Vorher (3 Zeilen):
[Header: Branding-Farbe + Firmenname]
[Body: weisser Hintergrund + Inhalt]
[Footer: grauer Hintergrund + Trennlinie + kleiner Text]  <-- Gmail denkt: Signatur!

Nachher (2 Zeilen):
[Header: Branding-Farbe + Firmenname]
[Body: weisser Hintergrund + Inhalt + Footer-Text integriert]
```

Konkretes neues HTML fuer Body + Footer kombiniert:

```html
<tr>
  <td style="background-color:#ffffff;padding:36px 32px 28px 32px;border-radius:0 0 8px 8px;">
    <h1 style="...">Titel</h1>
    <p>Inhalt...</p>
    <!-- Button falls vorhanden -->
    
    <!-- Footer integriert, kein separater Block -->
    <p style="margin:32px 0 0 0;padding:20px 0 0 0;font-size:14px;line-height:1.5;color:#6b7280;">
      Firmenname | Strasse, PLZ Stadt
    </p>
  </td>
</tr>
```

### `src/pages/admin/AdminEmails.tsx`

Gleiche Struktur-Aenderung in der Client-seitigen Vorschau-Kopie, damit die Admin-Vorschau das tatsaechliche E-Mail-Layout widerspiegelt.

## Betroffene Dateien

| Datei | Aenderung |
|-------|----------|
| `supabase/functions/send-email/index.ts` | Footer-Zeile entfernen, in Body integrieren |
| `src/pages/admin/AdminEmails.tsx` | Gleiche Aenderung in der Vorschau |

## Warum das funktioniert

Gmail erkennt Signaturen anhand von Mustern:
- Separater Block mit anderem Hintergrund am Ende
- Trennlinie (`border-top`) vor kurzem Text
- Sehr kleiner, heller Text als letztes Element
- Separate Tabellenzeile mit wenig Inhalt

Durch die Integration in den Body faellt keines dieser Muster mehr zu. Der Footer-Text sieht fuer Gmail wie normaler E-Mail-Inhalt aus.
