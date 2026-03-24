

## Plan: Bewerbungsstatus aktualisieren

Einfaches Daten-Update: Die Bewerbung von testtest@yopmail.com (ID: `54a53399-fd35-48d2-97c6-e6772c7d3f92`) von Status `akzeptiert` auf `bewerbungsgespraech` setzen.

### Aenderung

SQL-Update ueber Insert-Tool:
```sql
UPDATE applications SET status = 'bewerbungsgespraech' WHERE id = '54a53399-fd35-48d2-97c6-e6772c7d3f92';
```

Keine Code-Aenderungen noetig — die Edge Function wurde bereits im letzten Schritt korrigiert, sodass zukuenftige auto_accept-Bewerbungen direkt mit `bewerbungsgespraech` erstellt werden.

