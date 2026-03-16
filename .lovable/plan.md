

# Plan: Anhänge-Badge in Sidebar + Gruppen-Genehmigung/-Ablehnung

## 2 Änderungen

### 1. `AdminSidebar.tsx` — Badge für `/admin/anhaenge`

Neue Query `anhaengeEingereichtCount` hinzufügen: Zählt `order_attachments` mit Status `eingereicht` für Contracts des aktiven Brandings. Badge in `badgeCounts` unter `/admin/anhaenge` eintragen (analog zu den anderen Badges, `refetchInterval: 30000`).

### 2. `AdminAnhaengeDetail.tsx` — Nur Gruppen-Aktionen

- Einzelne Genehmigen/Ablehnen-Buttons pro Card entfernen (Zeilen 243-254)
- `updateMutation` entfernen (wird nicht mehr gebraucht)
- Neue `bulkRejectMutation` hinzufügen: Setzt alle `eingereicht`-Anhänge auf `abgelehnt`
- Die 2 Gruppen-Buttons ("Alle genehmigen" / "Alle ablehnen") prominent oberhalb der Grid anzeigen, nur wenn es `eingereicht`-Anhänge gibt

### Betroffene Dateien
| Datei | Änderung |
|-------|----------|
| `AdminSidebar.tsx` | Badge-Query für Anhänge |
| `AdminAnhaengeDetail.tsx` | Einzelbuttons entfernen, "Alle ablehnen" hinzufügen |

