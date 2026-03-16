

## Plan: Livechat-Einstellungen als Branding-basierte Settings-Seite

### Problem
Aktuell werden Livechat-Einstellungen (Name, Avatar, Online-Status) pro Admin-User in der `profiles`-Tabelle gespeichert und im Livechat-Header per Popover bearbeitet. Das fuehrt dazu, dass verschiedene Kunden/Admins unterschiedliche Daten sehen. Stattdessen sollen diese Einstellungen pro Branding gelten.

### DB-Migration

Neue Spalten auf `brandings`-Tabelle:

```sql
ALTER TABLE public.brandings
  ADD COLUMN chat_display_name text,
  ADD COLUMN chat_avatar_url text,
  ADD COLUMN chat_online boolean NOT NULL DEFAULT false;
```

### Neue Seite: `/admin/livechat-einstellungen`

Einfaches Formular mit:
- **Avatar-Upload** (via `AvatarUpload`-Komponente)
- **Anzeigename** (Input)
- **Online/Offline** (Switch)
- Speichert per `supabase.from("brandings").update(...)` auf `activeBrandingId`
- Laedt Daten per Query auf `brandings` gefiltert nach `activeBrandingId`

### Sidebar

Neuer Eintrag in "Einstellungen"-Gruppe: `{ title: "Livechat", url: "/admin/livechat-einstellungen", icon: MessageCircle }`

### Routing

Neue Route `livechat-einstellungen` in `App.tsx` unter `/admin`.

### AdminLivechat.tsx

- Admin-Profil-Popover (Zeilen 507-550) komplett entfernen
- `adminAvatar`, `adminDisplayName`, `editingName`, `adminOnlineStatus`, `handleOnlineToggle`, `saveDisplayName` State/Logik entfernen
- Profil-Load-Effect (Zeilen 79-93) entfernen

### ChatWidget.tsx (Mitarbeiter-Seite)

- Statt Admin-Profil aus `profiles` zu laden, Branding-Daten laden:
  1. `employment_contracts.branding_id` holen
  2. `brandings.chat_display_name, chat_avatar_url, chat_online` lesen
- Online-Status-Subscription auf `brandings`-Tabelle statt `profiles`
- Fallback: Wenn keine Branding-Chat-Daten vorhanden, bestehende `profiles`-Logik beibehalten

### Dateien

| Datei | Aenderung |
|-------|-----------|
| DB-Migration | 3 neue Spalten auf `brandings` |
| `AdminLivechatEinstellungen.tsx` | Neue Seite (erstellen) |
| `App.tsx` | Route hinzufuegen |
| `AdminSidebar.tsx` | Nav-Eintrag hinzufuegen |
| `AdminLivechat.tsx` | Profil-Popover + zugehoerige Logik entfernen |
| `ChatWidget.tsx` | Branding-basierte Chat-Daten statt Profil-basierte |

