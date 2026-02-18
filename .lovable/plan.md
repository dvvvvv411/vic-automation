

# Fußzeile auf eine Zeile zusammenführen

## Änderung

Die Fußzeile in den E-Mail-Templates wird von zwei separaten Zeilen (Firmenname + Adresse) auf eine einzige Zeile umgestellt. Firmenname links, Adresse rechts -- über die gesamte Breite verteilt mit `justify-content: space-between` (umgesetzt via Table-Layout für maximale E-Mail-Client-Kompatibilität).

## Betroffene Dateien

### 1. `src/pages/admin/AdminEmails.tsx` (Vorschau-Template)
- Footer-Bereich (Zeilen 65-69): Die zwei `<p>`-Tags werden durch eine einzeilige Tabelle ersetzt, die den Firmennamen links und die Adresse rechts platziert.

### 2. `supabase/functions/send-email/index.ts` (Versand-Template)
- Footer-Bereich (Zeilen 95-100): Gleiche Änderung wie in der Vorschau, damit Vorschau und tatsächlich versendete E-Mails identisch aussehen.

## Technisches Detail

Statt zwei `<p>`-Tags wird eine innere Tabelle mit einer Zeile und zwei Zellen verwendet:

```text
<table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="font-size:12px;color:#9ca3af;" align="left">Firmenname</td>
    <td style="font-size:12px;color:#9ca3af;" align="right">Straße, PLZ Ort</td>
  </tr>
</table>
```

Dies stellt sicher, dass die Informationen auf einer Zeile stehen, über die volle Breite verteilt, und in allen E-Mail-Clients korrekt dargestellt werden.

