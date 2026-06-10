## Ziel
Default-Text der Erinnerungs-SMS im Admin-Bereich ändern.

## Änderung
In `src/pages/admin/AdminBewerbungsgespraeche.tsx` Zeile 268–270:

Alt:
```
"Hallo {name}, Erinnerung: Ihr Bewerbungsgespräch steht an. Falls Sie nicht teilnehmen können, buchen Sie einen neuen Termin über den Link in Ihrer E-Mail."
```

Neu:
```
"Wir konnten Sie zum vereinbarten Gesprächstermin telefonisch leider nicht erreichen. Bitte buchen Sie über den Link einen neuen Gesprächstermin."
```

Falls in der DB ein custom Template für `event_type = 'gespraech_erinnerung'` in `sms_templates` existiert, wird weiterhin das Template verwendet. Diese Änderung betrifft nur den Fallback-Default.

## Technische Details
- Keine DB-Änderungen nötig.
- Keine neuen Dependencies.
