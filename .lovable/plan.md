

# Fix: Admin-Avatar cachen statt bei jedem Seitenaufruf neu laden

## Problem

Zwei Ursachen verhindern das Caching des Admin-Avatars:

1. **Cache-Busting URL**: Beim Upload wird `?t=${Date.now()}` an die Bild-URL angehängt (Zeile 71, `AvatarUpload.tsx`). Der Browser behandelt jede URL mit unterschiedlichem Query-Parameter als neues Bild und lädt es jedes Mal neu herunter.

2. **Kein Client-seitiger Cache**: In `ChatWidget.tsx` wird das Admin-Profil bei jedem Mounten (also bei jedem Seitenaufruf) frisch von der Datenbank geladen. Währenddessen zeigt das Widget keinen Avatar an.

## Lösung

### 1. Admin-Profil im `sessionStorage` cachen

Beim ersten Laden wird das Admin-Profil (Avatar-URL + Anzeigename) im `sessionStorage` gespeichert. Bei erneutem Öffnen wird zuerst der Cache angezeigt (sofort sichtbar), dann im Hintergrund aktualisiert.

### 2. Cache-Buster nur beim Upload verwenden

Der `?t=...`-Parameter wird nur **einmalig direkt nach dem Upload** gesetzt (damit der Nutzer sofort das neue Bild sieht). Beim **Speichern in die Datenbank** wird die saubere URL ohne Cache-Buster verwendet, damit der Browser das Bild danach normal cachen kann.

## Änderungen

| Datei | Änderung |
|---|---|
| `src/components/chat/ChatWidget.tsx` | Admin-Profil aus sessionStorage laden (sofortige Anzeige), dann im Hintergrund aktualisieren |
| `src/components/chat/AvatarUpload.tsx` | Cache-Buster nur lokal nutzen, saubere URL in die Datenbank schreiben |

### Technische Details

**AvatarUpload.tsx** -- Zeilen 70-73 ändern:

```text
// Saubere URL in DB speichern (ohne Cache-Buster)
const { data } = supabase.storage.from("avatars").getPublicUrl(path);
const cleanUrl = data.publicUrl;

// In DB ohne Cache-Buster speichern
await supabase.from("profiles").update({ avatar_url: cleanUrl }).eq("id", user.id);

// Lokal mit Cache-Buster anzeigen (damit sofort das neue Bild erscheint)
onUploaded?.(`${cleanUrl}?t=${Date.now()}`);
```

**ChatWidget.tsx** -- Admin-Profil-Laden (ca. Zeile 63-77) erweitern:

```text
// Admin-Profil laden mit sessionStorage-Cache
useEffect(() => {
  // Sofort aus Cache laden
  const cached = sessionStorage.getItem("admin_chat_profile");
  if (cached) {
    try {
      setAdminProfile(JSON.parse(cached));
    } catch {}
  }

  // Im Hintergrund aktualisieren
  const loadAdmin = async () => {
    const { data: roles } = await supabase
      .from("user_roles").select("user_id").eq("role", "admin").limit(1);
    if (!roles?.length) return;
    const { data: profile } = await supabase
      .from("profiles").select("avatar_url, display_name").eq("id", roles[0].user_id).maybeSingle();
    if (profile) {
      setAdminProfile({ avatar_url: profile.avatar_url, display_name: profile.display_name });
      sessionStorage.setItem("admin_chat_profile", JSON.stringify({
        avatar_url: profile.avatar_url,
        display_name: profile.display_name,
      }));
    }
  };
  loadAdmin();
}, []);
```

Damit wird das Admin-Bild beim ersten Mal geladen, ab dann sofort aus dem Cache angezeigt -- und still im Hintergrund aktualisiert, falls sich etwas geändert hat.

