

## Plan: Video-Chat Hinweistext aktualisieren

**Datei:** `src/pages/mitarbeiter/AuftragDetails.tsx` (Zeilen 630-633)

Den bestehenden Text in der Card (Zeilen 630-633) ersetzen durch den neuen, ausfuehrlicheren Inhalt mit drei Abschnitten:

1. **"Gesetzlich vorgeschriebene Fragen im Chat"** – neuer Text mit Beispielfragen als Zitate und Hinweis auf Bewertungsbogen
2. **"Wichtige Hinweise zur Durchführung"** – neuer Abschnitt mit drei Punkten (ruhige Umgebung, Anweisungen folgen, Probleme notieren)

Konkret werden Zeilen 630-633 ersetzt durch:

```tsx
<h4 className="font-semibold text-foreground">Gesetzlich vorgeschriebene Fragen im Chat</h4>
<p className="text-sm text-muted-foreground leading-relaxed">
  Während des Video-Chats kann dir der/die Mitarbeiter:in Sicherheitsfragen stellen, z.&nbsp;B.:
</p>
<blockquote className="text-sm italic text-muted-foreground border-l-2 border-primary/30 pl-3">
  „Wirst du gezwungen, einen Account zu eröffnen?"
</blockquote>
<blockquote className="text-sm italic text-muted-foreground border-l-2 border-primary/30 pl-3">
  „Steht jemand bei dir, der dich zur Anmeldung drängt?"
</blockquote>
<p className="text-sm text-muted-foreground leading-relaxed font-medium">
  Diese Fragen musst du immer mit „Nein" beantworten.
</p>
<p className="text-sm text-muted-foreground leading-relaxed">
  Falls keine solchen Fragen gestellt werden, vermerke das bitte im Bewertungsbogen.
</p>

<h4 className="font-semibold text-foreground pt-2">Wichtige Hinweise zur Durchführung</h4>
<ul className="text-sm text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
  <li>Wähle eine ruhige Umgebung mit guter Beleuchtung, funktionierender Webcam und stabiler Internetverbindung.</li>
  <li>Folge den Anweisungen des Video-Chat-Systems bzw. der Mitarbeiterin oder des Mitarbeiters Schritt für Schritt.</li>
  <li>Sollte etwas unklar oder technisch problematisch sein, notiere es bitte im Bewertungsbogen.</li>
</ul>
```

Keine weiteren Dateien betroffen.

