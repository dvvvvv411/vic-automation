

## Plan: Projektleiter & Recruiter Daten im Branding + Kontakt-Cards auf Buchungsseiten

### 1. DB-Migration

6 neue Spalten in `brandings`:

```sql
ALTER TABLE public.brandings
  ADD COLUMN IF NOT EXISTS project_manager_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS project_manager_title text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS project_manager_image_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recruiter_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recruiter_title text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recruiter_image_url text DEFAULT NULL;
```

### 2. AdminBrandingForm: Zwei neue Sektionen

Neue Card **"Projektleiter"** mit:
- Bild-Upload (in `branding-logos` Bucket) + Vorschau
- Name (Text)
- Jobtitel (Text)

Neue Card **"Recruiter"** mit identischer Struktur.

Schema, initialForm, useEffect und saveMutation werden um die 6 Felder erweitert. Bild-Uploads analog zum bestehenden Logo-Upload.

### 3. Kontakt-Card Komponente

Neue wiederverwendbare Komponente `src/components/ContactCard.tsx`:
- Avatar/Bild, Name, Jobtitel
- Titel z.B. "Ihr Ansprechpartner"
- Kompaktes Design passend zum Branding

### 4. Buchungsseiten: Card einbinden

| Seite | Daten |
|---|---|
| `Bewerbungsgespraech.tsx` | Recruiter-Daten aus `brandings` |
| `Probetag.tsx` | Projektleiter-Daten aus `brandings` |
| `ErsterArbeitstag.tsx` | Projektleiter-Daten aus `brandings` |

- Brandings-Select in allen 3 Seiten um die neuen Felder erweitern
- ContactCard oberhalb oder neben dem Kalender anzeigen (nur wenn Name vorhanden)

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| DB-Migration | 6 neue Spalten |
| `AdminBrandingForm.tsx` | 2 neue Card-Sektionen (Projektleiter + Recruiter) |
| `ContactCard.tsx` (neu) | Wiederverwendbare Ansprechpartner-Card |
| `Bewerbungsgespraech.tsx` | Recruiter-Card einbinden |
| `Probetag.tsx` | Projektleiter-Card einbinden |
| `ErsterArbeitstag.tsx` | Projektleiter-Card einbinden |

