

# Chat-Header: Admin-Ansprechpartner statt eigenes Profilbild

## Was wird geaendert

Im Livechat-Popup des Mitarbeiters (`/mitarbeiter`) wird der Header umgebaut:

- **Weg**: Das editierbare eigene Profilbild des Mitarbeiters (AvatarUpload mit `editable`)
- **Neu**: Avatar und Name des Administrators mit dem Label "Dein Ansprechpartner"

## Vorher / Nachher

```text
VORHER:
┌─────────────────────────────────┐
│  Support                [Avatar]│
│  Wir antworten sofort      [X]  │
└─────────────────────────────────┘

NACHHER:
┌─────────────────────────────────┐
│ [Admin-Avatar]                  │
│  Admin-Name              [X]    │
│  Dein Ansprechpartner           │
└─────────────────────────────────┘
```

## Aenderungen

| Datei | Aenderung |
|---|---|
| `src/components/chat/ChatWidget.tsx` | Header umbauen: eigenes Avatar entfernen, Admin-Avatar + Name + Label "Dein Ansprechpartner" anzeigen |

### Technische Details

Der Header-Bereich (Zeilen 168-188) wird ersetzt:

- Links: Admin-Avatar (nicht editierbar, aus `adminProfile.avatar_url`) + Admin-Name (`adminProfile.display_name || "Admin"`) + Untertitel "Dein Ansprechpartner"
- Rechts: Nur noch der Schliessen-Button (X)
- Die States `myAvatar` und `myName` sowie der zugehoerige `useEffect` zum Laden des eigenen Profils koennen entfernt werden, da sie nicht mehr benoetigt werden

