

# Plan: Mitarbeiterdaten Card auf Ident-Detailseite

## Ziel
Neue Card "Mitarbeiterdaten" unter der Test-Daten Card (rechte Spalte) mit persönlichen Daten aus `employment_contracts` und einem Personalausweis-Popup.

## Änderung in `AdminIdentDetail.tsx`

### 1. Neue Query in `IdentDetailContent`
Query auf `employment_contracts` mit `session.contract_id` um folgende Felder zu holen: `first_name`, `last_name`, `email`, `phone`, `birth_date`, `birth_place`, `nationality`, `street`, `zip_code`, `city`, `marital_status`, `id_front_url`, `id_back_url`.

### 2. Neue Card nach Zeile 507 (nach `</Card>` der Test-Daten)
- Titel "Mitarbeiterdaten" mit User-Icon
- 2-Spalten-Grid mit Label/Wert-Paaren:
  - Vorname, Nachname, E-Mail, Telefon, Geburtsdatum (formatiert dd.MM.yyyy), Geburtsort, Nationalität, Straße, PLZ & Stadt (kombiniert), Familienstand
- Button "Personalausweis anzeigen" oeffnet Dialog mit `id_front_url` und `id_back_url` Bildern (nur wenn mindestens ein Bild vorhanden)

### Betroffene Datei
| Datei | Änderung |
|-------|----------|
| `AdminIdentDetail.tsx` | Query + Card + Dialog in rechter Spalte unter Test-Daten |

