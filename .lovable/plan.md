

## Plan: Ident-Prozess Neustart nach fehlgeschlagener Bewertung verhindern

### Problem-Analyse

Zwei zusammenhängende Bugs:

1. **Ident-Prozess startet neu**: Wenn ein Mitarbeiter den Videochat abschliesst (ident_session = "completed"), zur Bewertungsseite navigiert wird, dort aber die Bewertung nicht abschicken kann und zurück navigiert, zeigt AuftragDetails den "Auftrag starten" Button an. Der Grund: Die Flow-Logik (Zeile 167-175) setzt `flowStep` nur auf "videident" wenn der Ident-Status "waiting" oder "data_sent" ist. Bei "completed" bleibt es auf "overview", und da der Assignment-Status noch "offen" ist, wird der "Auftrag starten" Button gezeigt. Ein Klick darauf erstellt eine NEUE Ident-Session.

2. **Bewertung konnte nicht abgeschickt werden**: Mögliche Ursache unklar (kein Error-Log), aber das eigentliche Problem ist, dass der Nutzer nach einem Fehler keinen Weg zurück zur Bewertung hat, ohne den gesamten Prozess neu zu durchlaufen.

Adrian Tomczyk hat deshalb 2 completed Ident-Sessions und 0 Reviews für den BBVA-Auftrag.

### Lösung

**Datei: `src/pages/mitarbeiter/AuftragDetails.tsx`**

1. **Completed-Ident erkennen und direkt zur Bewertung leiten** (Zeile 156-175):
   - Wenn eine completed Ident-Session existiert UND der Assignment-Status "offen" ist UND noch keine Reviews existieren → `flowStep` auf "review" setzen (neuer Zwischen-Step der direkt "Bewertung starten" anbietet)
   
2. **Neuen FlowStep "review" rendern** (nach dem "videident" Block):
   - Zeigt eine Card mit "Video-Chat abgeschlossen" und Button "Jetzt bewerten" der zu `/mitarbeiter/bewertung/{orderId}` navigiert
   
3. **Duplikat-Ident verhindern** in `handleStartVideoIdent` (Zeile 272):
   - Vor dem Insert prüfen ob bereits eine completed Ident-Session existiert
   - Wenn ja, direkt zur Bewertung navigieren statt neue Session zu erstellen

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/mitarbeiter/AuftragDetails.tsx` | Completed-Ident-Erkennung, neuer "review" FlowStep, Duplikat-Schutz |

