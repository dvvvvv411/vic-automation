## Ziel
Die linke Hero-Spalte der `/auth` Seite optisch näher an den Referenz-Screenshot bringen.

## Änderungen in `src/pages/Auth.tsx` (linke Spalte)

### 1. Headline-Text + Effekt
- Text ändern auf den Original-Wortlaut:  
  **"Mitarbeiterportal für moderne App-Sicherheit."**
- Schriftgröße reduzieren von `text-5xl` → `text-4xl xl:text-[2.75rem]` mit `leading-[1.1]`, damit der Text sauber dreizeilig in die Spalte passt und nicht abgeschnitten wirkt.
- Letztes Wort **"App-Sicherheit."** als `<span>` mit goldener Unterstreichung im Stil des Screenshots:
  - `decoration-amber-400 decoration-4 underline underline-offset-[6px]`
  - Alternativ als `border-b-4 border-amber-400` Span für sauberen Stop am Punkt.
- Subline-Text anpassen:  
  "Verwalte App-Tests, prüfe Reports und arbeite zentral an einer modernen Plattform für App-Sicherheit."

### 2. Kachel-Hintergrund (Grid-Pattern)
- Auf dem `bg-primary` Container ein zusätzliches absolutes Overlay mit feinem Grid-Muster wie im Screenshot legen:
  ```tsx
  <div
    className="absolute inset-0 opacity-[0.12] pointer-events-none"
    style={{
      backgroundImage:
        "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
      backgroundSize: "44px 44px",
    }}
  />
  ```
- Layer-Reihenfolge: Primary-Fläche → Grid-Overlay → bestehende Blur-Blobs → `relative z-10` Content (bleibt unverändert).
- Leichten Vignette-/Verlauf hinzufügen (`bg-gradient-to-br from-white/5 via-transparent to-black/10`) für mehr Tiefe wie im Screenshot.

### 3. Feature-Kacheln (App-Tests / Test-Aufträge / Befund-Reports)
- Titel/Untertitel angleichen an Screenshot:
  - App-Tests · "iOS & Android prüfen"
  - Test-Aufträge · "Zentral zugewiesen & getrackt"
  - Befund-Reports · "Schnell dokumentieren & einreichen"

## Nicht geändert
- Rechte Form-Spalte, Auth-Logik, Branding-Fetch, Farben aus `--primary`, Logo-Handling.

## Betroffene Datei
- `src/pages/Auth.tsx` (nur JSX/Strings in der linken Spalte + Headline-Block).
