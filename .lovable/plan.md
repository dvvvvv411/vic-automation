## Ziel
Alle ausgehenden E-Mails laufen über eine DB-Warteschlange. Jede Mail wird mit zufälligem Abstand von 15–60 Sekunden zur vorherigen verschickt. Bei Resend-Fehler sofort `failed` (kein Retry).

## Architektur

```text
Frontend (sendEmail)
   │
   ▼
send-email (Edge Function)
   │  → ruft DB-Funktion enqueue_email()
   │  → berechnet next_attempt_at = max(now, letzter Slot) + random(15..60s)
   │  → INSERT in email_queue (status='pending')
   │  → liefert sofort 202 zurück
   ▼
email_queue (Tabelle)
   │
   ▼
process-email-queue (Edge Function, läuft alle 15s via pg_cron)
   │  → claim_email_batch() holt bis zu 5 fällige Mails (SKIP LOCKED)
   │  → sendet via Resend (gleiche HTML-Logik wie bisher)
   │  → schreibt email_logs (sent/failed)
   │  → bei Fehler sofort status='failed'
```

## Was geändert wird

### Datenbank (Migration)
- Neue Tabelle `email_queue` mit Status, `next_attempt_at`, `attempts`, `last_error`, plus alle Payload-Felder (Empfänger, Betreff, Inhalt, Branding, Event-Typ, Metadata).
- Index auf `(next_attempt_at) WHERE status='pending'` für schnelles Scheduling.
- RLS: nur `service_role` schreibt, Admins dürfen lesen (für spätere Queue-Übersicht).
- Funktion `enqueue_email(...)`: berechnet Slot und fügt Zeile ein.
- Funktion `claim_email_batch(limit)`: holt fällige Mails atomar via `FOR UPDATE SKIP LOCKED`.
- pg_cron Job: ruft alle 15 Sekunden `process-email-queue` per `pg_net.http_post` auf.

### Edge Functions
- **`send-email`** (Umbau): kein direkter Resend-Call mehr. Validiert Payload, ruft `enqueue_email` RPC, gibt 202 zurück. Branding-Resolve passiert erst beim tatsächlichen Versand.
- **`process-email-queue`** (neu): claimt Batch, baut HTML (gleiche Logik wie bisher in `send-email`), schickt via Resend, schreibt `email_logs`, setzt Queue-Row auf `sent`/`failed`.

### Frontend
- **Keine Änderung.** `src/lib/sendEmail.ts` und alle Aufrufer bleiben gleich — Antwort ist jetzt `{ queued: true }` statt `{ resend_id }`, aber das wird nirgends ausgewertet.

## Was sich nicht ändert
- `email_logs` bleibt die Audit-Quelle (gleiche Spalten, gleiches Verhalten).
- SMS-Versand, Telegram-Versand: komplett unverändert.
- Branding-Auflösung (inkl. Fallback über `metadata.contract_id`): identisch zu jetzt.

## Tradeoffs / Hinweise
- Bei 100 Mails gleichzeitig: Durchlauf dauert ca. 25–50 Minuten (gewollt, das ist der Sinn des Rate Limits).
- Bei Resend-Fehler keine zweite Chance → Mail muss manuell neu ausgelöst werden. Im Admin-Email-Log sichtbar mit Fehlertext.
- Cron läuft alle 15s; kürzeste tatsächliche Zustellzeit liegt damit bei ~15s nach Enqueue.

## Reihenfolge der Umsetzung
1. Migration (Tabelle + Funktionen + Cron) — **bereits ausgeführt**.
2. `send-email` umbauen auf Enqueue.
3. Neue Function `process-email-queue` schreiben.
4. Beide Functions deployen.
5. Test: eine Mail über bestehendes Frontend triggern, in `email_queue` und `email_logs` prüfen.