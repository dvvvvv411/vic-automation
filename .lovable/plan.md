

# Fix: Admin Online-Status wird nicht korrekt an Mitarbeiter übertragen

## Ursache

Der Online-Toggle speichert den Status nur als lokalen React State (`useState(true)`) und sendet ihn per Supabase Presence. Presence ist aber unzuverlässig für einen **manuellen** Toggle — es hängt davon ab, dass beide Clients (Admin und Mitarbeiter) gleichzeitig auf dem gleichen WebSocket-Channel verbunden sind und Sync-Events korrekt empfangen. Wenn der Mitarbeiter den Chat erst nach dem Toggle öffnet oder es Timing-Probleme gibt, wird der Status nicht angezeigt.

## Lösung

Den Online-Status in der Datenbank persistieren statt nur über Presence zu senden. Der Admin-Toggle schreibt in die `profiles`-Tabelle, und das ChatWidget des Mitarbeiters liest den Wert von dort.

### 1. Migration: `is_chat_online` Spalte zu `profiles` hinzufügen

```sql
ALTER TABLE public.profiles
ADD COLUMN is_chat_online boolean NOT NULL DEFAULT false;
```

### 2. `AdminLivechat.tsx` anpassen

- Beim Laden des Admin-Profils auch `is_chat_online` lesen und als Initialwert für `adminOnlineStatus` verwenden
- Beim Toggle-Wechsel den Wert in `profiles.is_chat_online` updaten (zusätzlich zum Presence-Tracking)

```typescript
// On toggle change:
const handleOnlineToggle = async (checked: boolean) => {
  setAdminOnlineStatus(checked);
  await supabase.from("profiles").update({ is_chat_online: checked }).eq("id", user.id);
};
```

### 3. `ChatWidget.tsx` anpassen

- Statt `adminOnline` aus dem Presence-Hook, den `is_chat_online`-Wert aus dem `loadAdmin`-Query lesen (das bereits `profiles` abfragt)
- Zusätzlich mit Supabase Realtime auf Änderungen an der `profiles`-Tabelle subscriben, damit der Status live aktualisiert wird

```typescript
// In loadAdmin:
const { data: profile } = await supabase
  .from("profiles")
  .select("avatar_url, display_name, is_chat_online")
  .eq("id", ownerId)
  .maybeSingle();

// Subscribe to profile changes for live updates
supabase.channel("admin-online-status")
  .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${ownerId}` },
    (payload) => setAdminOnline(payload.new.is_chat_online)
  ).subscribe();
```

### Dateien

| Datei | Änderung |
|-------|----------|
| Migration (SQL) | `is_chat_online` Spalte auf `profiles` |
| `src/pages/admin/AdminLivechat.tsx` | Toggle schreibt in DB |
| `src/components/chat/ChatWidget.tsx` | Online-Status aus DB lesen + Realtime-Subscription |

