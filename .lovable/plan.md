## Fix: Kunde-Rolle ("normaler Admin") kann keine Chat-Anhänge hochladen

### Ursache
- `chat_messages` INSERT/UPDATE-Policy erlaubt bereits `is_kunde(auth.uid())` → Nachrichten senden geht.
- Storage-Bucket `chat-attachments` hat aber nur Policies für `has_role(admin)` (Superadmin) und für Mitarbeiter (eigener `contract_id`-Ordner). Die `kunde`-Rolle fehlt komplett → Upload bricht ab, daher kein Anhang versendbar.

### Änderung
Migration: zwei neue RLS-Policies auf `storage.objects` für Bucket `chat-attachments`:

1. **INSERT** "Kunde can upload chat attachments"
   - Bedingung: `bucket_id = 'chat-attachments'` AND `is_kunde(auth.uid())` AND (kein zugewiesenes Branding ODER `contract_id`-Ordner gehört zu einem Vertrag eines zugewiesenen Brandings via `contracts_for_branding_ids(auth.uid())`).
2. **SELECT** "Kunde can read chat attachments"
   - Gleiche Bedingung für Lesezugriff, damit hochgeladene Anhänge auch angezeigt werden.

Scope folgt exakt der bestehenden `chat_messages`-Policy für `kunde`, sodass keine Tenant-Grenzen umgangen werden.

### Keine Code-Änderungen
`uploadChatAttachment.ts` und UI bleiben unverändert — Bug liegt rein in den Storage-RLS-Policies.