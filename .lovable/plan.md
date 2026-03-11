

# Fix: Anosim Share-Link Validierung

## Problem

Die URL-Validierung ist zu strikt. Sie prüft auf `anosim.net/api/v1/orderbookingshare`, aber der Share-Link hat das Format `anosim.net/share/orderbooking?token=...`. Betroffen sind drei Stellen:

1. **`supabase/functions/anosim-proxy/index.ts`** (Zeile 15): Proxy blockt die URL
2. **`src/pages/admin/AdminTelefonnummern.tsx`**: `isValidUrl` prüft auf falsches Muster
3. **`src/components/chat/SmsWatch.tsx`**: `handleAddUrl` prüft auf falsches Muster

## Lösung

Alle drei Validierungen so ändern, dass sie `anosim.net` akzeptieren -- sowohl das alte API-Format als auch das neue Share-Format:

| Datei | Änderung |
|-------|----------|
| `anosim-proxy/index.ts` | Validierung auf `anosim.net` mit Token-Parameter lockern |
| `AdminTelefonnummern.tsx` | `isValidUrl` anpassen |
| `SmsWatch.tsx` | `handleAddUrl` Validierung anpassen |

Die Proxy-Funktion muss danach neu deployed werden.

