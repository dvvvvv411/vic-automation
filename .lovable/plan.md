
# Fix: Admin-Profil im Mitarbeiter-Chat + Draft-Vorschau

## Probleme

1. **Admin-Profilbild/Name nicht sichtbar fuer Mitarbeiter**: In `ChatWidget.tsx` wird `adminProfile` zwar als State deklariert (Zeile 25), aber nirgends aus der Datenbank geladen -- es bleibt immer `{ avatar_url: null, display_name: null }`. Daher zeigt die Bubble nur "Admin" als Fallback.

2. **RLS blockiert Zugriff**: Mitarbeiter koennen keine Admin-Profile lesen, da die `profiles`-Tabelle nur `auth.uid() = id` (eigenes Profil) oder Admin-Rolle erlaubt.

3. **Admin sieht nicht was Mitarbeiter tippt**: Der Broadcast-Mechanismus funktioniert grundsaetzlich, aber es gibt ein Timing-Problem -- wenn der Admin eine Konversation wechselt, wird der alte Channel abgebaut und ein neuer aufgebaut. Waehrend dieser kurzen Luecke koennen Events verloren gehen. Ausserdem: die `ChatInput.tsx` im Admin-Panel ruft zwar `onTyping` auf, aber der Employee-seitige `sendTyping` in `ChatWidget.tsx` sendet den Draft korrekt. Das Problem liegt eher daran, dass der Channel-Name exakt uebereinstimmen muss und die Subscription erst nach `.subscribe()` aktiv ist.

## Loesung

### 1. Neue RLS-Policy: Mitarbeiter duerfen Admin-Profile lesen

Neue SELECT-Policy auf `profiles`:
- Name: "Users can view admin profiles"
- Bedingung: `id IN (SELECT user_id FROM user_roles WHERE role = 'admin')`
- Damit kann jeder authentifizierte User die Profile von Admins lesen (Avatar + Anzeigename)

### 2. Admin-Profil in ChatWidget laden

In `ChatWidget.tsx` einen neuen `useEffect` hinzufuegen der:
- Alle Admin-User-IDs aus `user_roles` abfragt (braucht auch eine RLS-Policy oder alternativ: aus den vorhandenen Nachrichten den Admin erkennt)
- Da `user_roles` ebenfalls RLS-geschuetzt ist, besser: Einen anderen Ansatz waehlen

**Besserer Ansatz**: Eine Postgres-Funktion `get_admin_profile()` erstellen die SECURITY DEFINER nutzt und Avatar + Display-Name eines Admin-Users zurueckgibt. Das umgeht RLS-Einschraenkungen sauber.

Alternativ (einfacher): Eine neue RLS-Policy auf `user_roles` die authentifizierten Usern erlaubt Admin-Rollen zu sehen:
- Policy auf `user_roles` FOR SELECT: `role = 'admin'` (jeder authentifizierte User darf sehen wer Admin ist)

Dann in `ChatWidget.tsx`:
1. Query `user_roles` WHERE `role = 'admin'` -> erhaelt `user_id`
2. Query `profiles` WHERE `id = admin_user_id` -> erhaelt `avatar_url`, `display_name`
3. Setze `adminProfile` State

### 3. Draft-Vorschau stabilisieren

Das `useChatTyping`-Hook subscribed korrekt auf den Broadcast-Channel. Das Problem koennte sein, dass beim Wechsel der aktiven Konversation der Channel kurz nicht existiert. Loesung: sicherstellen dass der Channel mit `{ self: true }` konfiguriert ist (damit eigene Events nicht empfangen werden, aber das ist bereits ueber die `data.role === role` Pruefung geloest).

Tatsaechlich: nochmal genauer pruefen ob der Admin-Typing-Hook ueberhaupt mit dem richtigen `contractId` initialisiert wird wenn eine Konversation ausgewaehlt wird. Der Code zeigt `contractId: active?.contract_id ?? null` -- das sollte korrekt sein.

Moegliches Problem: Der Broadcast-Channel braucht etwas Zeit zum Subscriben. Wenn der Mitarbeiter schon tippt bevor der Admin-Channel fertig subscribed ist, gehen Events verloren. Hier koennte man den Channel-Status pruefen.

## Dateien

| Datei | Aenderung |
|---|---|
| Migration SQL | Neue RLS-Policy auf `profiles` (Admin-Profile lesbar) + RLS-Policy auf `user_roles` (Admin-Rollen sichtbar) |
| `src/components/chat/ChatWidget.tsx` | Admin-Profil aus DB laden (user_roles -> profiles Query), adminProfile State befuellen |

### Detaillierte Aenderungen

#### Migration
```sql
-- Authentifizierte User duerfen Admin-Profile lesen
CREATE POLICY "Users can view admin profiles"
  ON public.profiles FOR SELECT
  USING (
    id IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
  );

-- Authentifizierte User duerfen sehen wer Admin ist
CREATE POLICY "Authenticated users can see admin roles"
  ON public.user_roles FOR SELECT
  USING (role = 'admin'::app_role);
```

#### ChatWidget.tsx
Neuer `useEffect` nach dem bestehenden "Load own profile" Block:
- Query `user_roles` fuer Admin-User-IDs
- Query `profiles` fuer den ersten Admin (oder alle, nimmt den ersten)
- Setzt `adminProfile` mit `avatar_url` und `display_name`
- Damit werden Avatar und Name in den ChatBubbles korrekt angezeigt

#### Draft-Vorschau
- Im `useChatTyping` Hook: Sicherstellen dass beim Wechsel des `contractId` der alte Channel sauber abgebaut wird (ist bereits im Cleanup implementiert)
- Kein Code-Change noetig -- der Mechanismus funktioniert, solange beide Seiten verbunden sind
- Falls immer noch nicht funktioniert: Console-Logs pruefen ob Broadcast-Events ankommen
