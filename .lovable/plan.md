

# Mitarbeiter-Detail als Popup im Livechat

## Umsetzung

Den Mitarbeiter-Namen im Chat-Header klickbar machen. Bei Klick öffnet sich ein großer Dialog, der die `AdminMitarbeiterDetail`-Seite einbettet.

### Ansatz

Da `AdminMitarbeiterDetail` stark mit `useParams` und `useNavigate` verwoben ist (20 navigate-Aufrufe, Back-Buttons etc.), wird die Seite **nicht** als Komponente extrahiert, sondern stattdessen per `<iframe>` im Dialog eingebettet. Das ist sauberer und vermeidet massive Refactoring-Risiken.

**Alternative**: Die Seite so refactoren, dass sie auch eine `contractId`-Prop akzeptiert und die Navigation-Buttons versteckt. Das wäre aufwändiger aber nativer. Da die Seite aber 672 Zeilen hat und viele interne Navigationen nutzt, ist der iframe-Ansatz pragmatischer.

### Änderungen

| Datei | Was |
|-------|-----|
| `AdminLivechat.tsx` | Neuer State `detailDialogOpen`, klickbarer Name im Header, Dialog mit iframe zur `/admin/mitarbeiter/{contract_id}` Seite |

### Details

1. **Klickbarer Name** (Zeile 376-377): Den `<h2>` mit dem Mitarbeiter-Namen in einen `<button>` wrappen mit Hover-Underline-Styling
2. **Dialog**: Großer Dialog (max-w-5xl, Höhe ~85vh) mit einem iframe, der auf `/admin/mitarbeiter/${active.contract_id}` zeigt
3. Der iframe lädt die existierende Seite vollständig, inkl. aller Funktionen

