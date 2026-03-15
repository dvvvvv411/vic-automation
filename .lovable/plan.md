

# Fix: Branding-Isolierung für Livechat & Bewertungen

## Problem

### Livechat (`AdminLivechat.tsx`)
- `loadConversations()` lädt ALLE `chat_messages` ohne Branding-Filter
- Die Konversationsliste zeigt Chats aller Brandings, nicht nur des aktiven
- `loadAvailableOrders()` lädt ebenfalls alle Orders ohne Branding-Filter
- `useBrandingFilter` wird gar nicht importiert/genutzt

### Bewertungen (`AdminBewertungen.tsx`)
- `useBrandingFilter` wird importiert und `activeBrandingId` ist im Query-Key
- ABER: Die eigentliche Query auf `order_reviews` hat keinen `.eq("branding_id", ...)` Filter
- Reviews werden über `orders` und `contracts` geladen, aber ohne Branding-Einschränkung

## Lösung

### Livechat
1. `useBrandingFilter` importieren
2. `loadConversations()` umbauen:
   - Erst `employment_contracts` laden mit `applications!inner(branding_id)` gefiltert auf `activeBrandingId`
   - Dann nur `chat_messages` für diese Contract-IDs laden
3. `loadAvailableOrders()`: `.eq("branding_id", activeBrandingId)` hinzufügen
4. Realtime-Channel: nur auf relevante Contract-IDs reagieren (oder nach Insert neu filtern)

### Bewertungen
1. Die Query muss Reviews filtern, deren zugehörige Orders zum aktiven Branding gehören
2. Ansatz: Erst Orders für das aktive Branding laden, dann nur Reviews für diese Order-IDs abfragen
3. Alternativ: Orders-Query mit `.eq("branding_id", activeBrandingId)` und dann Reviews nur für diese Order-IDs

## Betroffene Dateien
- `src/pages/admin/AdminLivechat.tsx` — Branding-Filter für Konversationen und Orders
- `src/pages/admin/AdminBewertungen.tsx` — Branding-Filter für Reviews

Keine DB-Änderungen nötig, rein Frontend.

