

## Plan: Email-Vorschau "Vertrag genehmigt" aktualisieren

### Problem

Die Vorschau-Vorlage in `AdminEmails.tsx` (Zeile 205-217) zeigt noch den alten Text. Die tatsaechliche E-Mail (in `AdminArbeitsvertraege.tsx`) enthaelt bereits den neuen Text + Button, aber die Vorschau-Seite wurde nicht synchronisiert.

### Aenderung

**`src/pages/admin/AdminEmails.tsx`** (Zeile 205-217)

Die `vertrag_genehmigt` Vorlage erhaelt:
- Zwei neue Textzeilen: "Bitte vereinbaren Sie mit uns einen Termin fuer Ihren ersten Arbeitstag." und "Michael Fischer wird Sie anschliessend telefonisch kontaktieren, um mit Ihnen die ersten Auftraege durchzugehen."
- Button: `buttonText: "Termin fuer 1. Arbeitstag buchen"`, `buttonUrl: "https://web.example.com/erster-arbeitstag/abc123"`

```typescript
{
  eventType: "vertrag_genehmigt",
  label: "Vertrag genehmigt",
  subject: (c) => `Herzlichen Glückwunsch – Sie sind nun vollwertiger Mitarbeiter bei ${c}`,
  bodyTitle: "Willkommen im Team!",
  bodyLines: (c) => [
    "Sehr geehrte/r Max Mustermann,",
    `herzlichen Glückwunsch! Ihr Arbeitsvertrag bei ${c} wurde genehmigt – Sie sind nun vollwertiger Mitarbeiter.`,
    "Ihr Startdatum: 01.04.2026",
    "Ab diesem Datum werden Ihnen Aufträge zugewiesen.",
    "Bitte vereinbaren Sie mit uns einen Termin für Ihren ersten Arbeitstag.",
    "Michael Fischer wird Sie anschließend telefonisch kontaktieren, um mit Ihnen die ersten Aufträge durchzugehen.",
    "Wir freuen uns auf die Zusammenarbeit!",
  ],
  buttonText: "Termin für 1. Arbeitstag buchen",
  buttonUrl: "https://web.example.com/erster-arbeitstag/abc123",
},
```

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `AdminEmails.tsx` | Vorschau-Vorlage "vertrag_genehmigt" mit neuem Text + Button |

