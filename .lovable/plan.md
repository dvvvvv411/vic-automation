

# Deployment-Ready: Titel, Beschreibung und Favicon

## Aenderungen

### 1. `index.html` -- Titel und Meta-Tags aktualisieren

Alle generischen "Lovable App" / "Lovable Generated Project" Texte werden ersetzt:

| Meta-Tag | Neuer Wert |
|----------|-----------|
| `<title>` | Mitarbeiter Dashboard |
| `meta description` | Das zentrale Dashboard fuer Mitarbeiter -- Auftraege, Bewertungen und mehr auf einen Blick. |
| `og:title` | Mitarbeiter Dashboard |
| `og:description` | Das zentrale Dashboard fuer Mitarbeiter -- Auftraege, Bewertungen und mehr auf einen Blick. |
| `meta author` | entfernen (kein "Lovable" mehr) |
| `og:image` / `twitter:image` | entfernen oder auf eigenes Bild setzen |
| `twitter:site` | entfernen (kein @Lovable) |

### 2. Favicon generieren

Ein neues Favicon wird per AI-Bildgenerierung erstellt:
- **Motiv**: Einfaches Dashboard-Icon (z.B. stilisiertes Grid/Layout-Symbol oder Tachometer)
- **Farbe**: Schwarz auf transparentem Hintergrund
- **Format**: PNG, wird als `public/favicon.png` gespeichert
- **Einbindung**: `<link rel="icon" href="/favicon.png" type="image/png">` in `index.html`

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `index.html` | Titel, Meta-Tags, Favicon-Link aktualisieren |
| `public/favicon.png` | Neues generiertes Favicon (schwarz auf transparent) |

