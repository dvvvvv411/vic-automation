

## Plan: PDF-Thumbnails + Vorschau mit Download

### Ziel
Wenn KYC-Dateien (Vorderseite/Rückseite Ausweis) als PDF hochgeladen sind, werden statt kaputter `<img>`-Vorschau echte **PDF-Thumbnails** gezeigt. Klick auf Thumbnail → großer Vorschau-Dialog mit **Download-Button**.

### Umsetzung

**Bibliothek:** `react-pdf` (basiert auf pdf.js) für Thumbnail-Rendering im Browser. Wird per `package.json` ergänzt.

**Komponente:** Neue wiederverwendbare `KycDocumentPreview.tsx` in `src/components/admin/`:
- Props: `url: string`, `label: string` (z. B. "Vorderseite")
- Erkennung: `url.toLowerCase().endsWith(".pdf")`
- Bei Bild → bestehendes `<img>`-Verhalten
- Bei PDF → `<Document><Page pageNumber={1} /></Document>` als Thumbnail (Höhe ~112px wie aktuell), gleicher Hover-Effekt
- Klick öffnet Dialog mit:
  - Bei Bild: großes `<img>` + Download-Button
  - Bei PDF: volle erste Seite (oder alle Seiten scrollbar) + **Download-Button** (Anchor mit `download`-Attribut, öffnet/lädt Original-URL)

**Integration:**
- `src/pages/admin/AdminMitarbeiterDetail.tsx` — KYC-Block (Vorderseite/Rückseite) ersetzt durch `<KycDocumentPreview>`
- `src/components/admin/MitarbeiterDetailPopup.tsx` — gleicher Ersatz im Popup
- Bestehender `imagePreview`-Dialog wird in beiden Dateien entfernt (durch neue Komponente abgelöst)

### Build-Fixes (parallel, da blockierend)

`package.json`:
- `react-pdf@^9.1.1` ergänzen (für PDF-Thumbnails)
- `@tiptap/core@^2.12.0` ergänzen (fehlt → Build-Error)
- `html2canvas@^1.4.1` ergänzen (fehlt → Build-Error)
- `@tiptap/extension-text-align` und `@tiptap/extension-text-style` von v3 → `^2.12.0` (Versions-Mix)

`src/main.tsx` (oder `App.tsx`): pdf.js Worker einmalig konfigurieren:
```ts
import { pdfjs } from "react-pdf";
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
```

### Geänderte Dateien

| Datei | Änderung |
|---|---|
| `package.json` | `react-pdf`, `@tiptap/core`, `html2canvas` ergänzen + TipTap-Versionen vereinheitlichen |
| `src/main.tsx` | pdf.js Worker konfigurieren |
| `src/components/admin/KycDocumentPreview.tsx` | **Neu** — Thumbnail + Vorschau-Dialog mit Download |
| `src/pages/admin/AdminMitarbeiterDetail.tsx` | KYC-Bilder durch `<KycDocumentPreview>` ersetzen |
| `src/components/admin/MitarbeiterDetailPopup.tsx` | Gleicher Ersatz im Popup |

### Was NICHT geändert wird
- Keine DB-Migration
- Keine Edge-Function
- Bestehende PDF-Uploads bleiben unverändert nutzbar

### Erwartetes Ergebnis
- Martina Zewe: zwei PDF-Thumbnails (echte Seitenvorschau) statt leerer Bilder
- Klick → großer Dialog mit PDF-Vorschau + **Download-Button**
- Bilder funktionieren weiterhin wie bisher, bekommen zusätzlich den Download-Button im Dialog
- Build wieder grün

