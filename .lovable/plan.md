
Ziel: 2 Dinge sauber nachziehen:
1. `/mitarbeiter/arbeitsvertrag` als echten Entwurf speicherbar machen, inkl. Meldenachweis-Preview in der Zusammenfassung
2. `/mitarbeiter/auftraege` Description-Preview stabil und deterministisch machen statt per kaputtem CSS-Clamp

Was ich im Code gefunden habe:
- `MitarbeiterArbeitsvertrag.tsx` lädt aktuell nur ein paar Felder (`first_name`, `last_name`, `email`, `phone`, `requires_proof_of_address`) und verliert deshalb fast alles beim Verlassen der Seite.
- Dokumente werden aktuell erst beim finalen Submit hochgeladen. Dadurch kann ein Nutzer nach Verlassen der Seite keine gespeicherten Uploads wiedersehen oder weiterverwenden.
- Die Zusammenfassung zeigt nur `idFrontPreview`/`idBackPreview`, aber keinen Meldenachweis.
- Die Auftragskarten nutzen aktuell `line-clamp-1`, was genau das falsche Verhalten erzeugt. Gewünscht ist jetzt ein fester Zeichen-Previewtext mit `...`, plus mehr Platz für den Beschreibungstext.

Umsetzungsplan

1. Arbeitsvertrag-Entwurf persistent machen
Datei: `src/pages/mitarbeiter/MitarbeiterArbeitsvertrag.tsx`

- Den initialen Contract-Load auf alle relevanten Felder erweitern:
  - persönliche Daten
  - Steuerdaten
  - Bankdaten
  - `id_front_url`, `id_back_url`, `id_type`
  - `proof_of_address_url`
  - `template_id`
  - `requires_proof_of_address`
- Beim Laden die Form vollständig aus `employment_contracts` vorbefüllen.
- Die gewählte Vertragsvorlage über `template_id` wiederherstellen.
- Den Wiedereinstieg logisch setzen:
  - nicht immer wieder bei Schritt 1 starten
  - stattdessen anhand der schon gespeicherten Daten den ersten unvollständigen Schritt öffnen
- Auto-Save einbauen:
  - debounced `update` auf `employment_contracts`, solange noch nicht eingereicht
  - speichert Textfelder, `employment_type`, `desired_start_date`, `template_id`, `id_type`
- Wichtige Guard-Logik:
  - erst speichern, nachdem Initialdaten geladen wurden
  - verhindern, dass der erste Render leere Werte zurück in die DB schreibt

2. Uploads auch als Entwurf speichern
Datei: `src/pages/mitarbeiter/MitarbeiterArbeitsvertrag.tsx`

- Dokumente nicht erst am finalen Submit behandeln, sondern schon beim Auswählen:
  - Upload in `contract-documents`
  - URL sofort in `employment_contracts` speichern
- Dafür getrennte Zustände für:
  - gespeicherte URLs
  - lokale Preview-Anzeige
- Ergebnis:
  - Nutzer kann Seite verlassen und später exakt mit denselben Uploads weitermachen
  - finaler Submit nutzt vorhandene gespeicherte URLs weiter, statt neue `File`-Objekte zu brauchen
- Auch Entfernen eines Dokuments muss den DB-Wert wieder leeren, damit der Entwurf konsistent bleibt

3. Meldenachweis in der Zusammenfassung anzeigen
Datei: `src/pages/mitarbeiter/MitarbeiterArbeitsvertrag.tsx`

- Im Zusammenfassungs-Schritt unter den Ausweisdokumenten zusätzlich den Meldenachweis rendern, falls vorhanden.
- Gleiches Anzeigeverhalten wie im Uploadbereich:
  - Bild => Thumbnail
  - PDF => Dateikarte/PDF-Hinweis
- Die Summary darf nicht nur mit lokalen `File`-Previews arbeiten, sondern muss auch gespeicherte URLs korrekt anzeigen.

4. Auftragskarten sauber und fest kürzen
Datei: `src/pages/mitarbeiter/MitarbeiterAuftraege.tsx`

- `line-clamp-1` komplett raus.
- Stattdessen eine kleine Helper-Funktion für deterministische Textvorschau:
  - Whitespace normalisieren
  - auf feste Zeichenanzahl kürzen
  - möglichst an Wortgrenze schneiden
  - immer mit `...` enden, wenn gekürzt wurde
- Damit ist die Vorschau immer gleich lang und nicht abhängig von Browser-/Card-Breite.
- Zusätzlich den Beschreibungsbereich größer machen:
  - mehr Höhe/Abstand für den Textblock
  - etwas angenehmere `leading`/Zeilenhöhe
  - `break-words`/saubere Umbrüche, damit nichts optisch abgesägt wirkt
- Ich würde also nicht mehr auf “1 Zeile clampen”, sondern einen etwas größeren, stabilen Previewbereich mit fixem Zeichenlimit bauen.

Technische Hinweise
- Dafür ist keine neue Migration nötig; die benötigten Contract-Spalten sind schon vorhanden.
- Der kritische Teil ist, dass finales Einreichen auch dann funktioniert, wenn der Nutzer nach einem Reload keine `File`-Objekte mehr im State hat. Deshalb müssen gespeicherte Dokument-URLs als First-Class-State behandelt werden.
- Für die Resume-Logik ist “erster unvollständiger Schritt” robuster als blind den alten Step lokal zu merken.

Betroffene Dateien
- `src/pages/mitarbeiter/MitarbeiterArbeitsvertrag.tsx`
- `src/pages/mitarbeiter/MitarbeiterAuftraege.tsx`
