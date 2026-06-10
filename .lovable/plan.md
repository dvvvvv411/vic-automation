## Plan

- Die 1h-Erinnerungslogik in `send-appointment-reminders` wird von `45–75 Minuten` auf **exakt 60 Minuten vorher** geändert.
- Da der Cron alle 5 Minuten läuft, wird technisch nur der aktuelle 5-Minuten-Lauf betrachtet und Termine werden nur dann getroffen, wenn sie genau in den Slot `jetzt + 60 Minuten` fallen.
- Die Markierung `reminder_1h_sent = true` bleibt bestehen, damit keine Doppel-SMS verschickt wird.
- Keine weiteren Änderungen an SMS-Texten, Tabellen oder 24h-Erinnerungen.