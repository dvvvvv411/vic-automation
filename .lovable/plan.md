

## Plan: Details-Button mit Popup für SMS-Nachrichten

### Änderung

In `src/pages/admin/AdminSmsHistory.tsx`:

1. **State hinzufügen**: `const [detailLog, setDetailLog] = useState<any>(null)` für das ausgewählte Log
2. **Details-Button** in beide Tabellen (seven.io + Spoof) einfügen — ein `Eye`-Icon-Button pro Zeile, der `setDetailLog(log)` aufruft
3. **Dialog-Popup** am Ende der Komponente mit:
   - Datum, Empfänger (Name + Telefon), Branding, Event-Typ, Status
   - **Vollständige Nachricht** ohne Truncation
   - Bei seven.io: auch Fehlermeldung falls vorhanden
4. **Imports**: `Dialog, DialogContent, DialogHeader, DialogTitle` + `Eye` Icon aus lucide-react

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminSmsHistory.tsx` | State, Button in Tabellenzeilen, Dialog-Popup |

