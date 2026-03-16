

# Plan: Mitarbeiter-Daten Card auf Ident-Detailseite

## Änderung

In `src/pages/admin/AdminIdentDetail.tsx` eine neue Card **"Mitarbeiterdaten"** unterhalb der Test-Daten Card (rechte Spalte) hinzufügen.

### Datenquelle
Die `session.contract_id` ist bereits vorhanden. Eine neue Query fetcht den `employment_contracts`-Datensatz mit den Feldern: `first_name`, `last_name`, `email`, `phone`, `birth_date`, `birth_place`, `nationality`, `street`, `zip_code`, `city`, `marital_status`, `id_front_url`, `id_back_url`.

### UI
- Card mit Titel "Mitarbeiterdaten" und User-Icon
- 2-Spalten-Grid mit Label/Wert-Paaren für alle 10 Felder
- `birth_date` wird mit `format()` als `dd.MM.yyyy` dargestellt
- Button "Personalausweis anzeigen" öffnet einen Dialog (`Dialog` aus ui/dialog) mit den beiden Bildern (`id_front_url`, `id_back_url`) nebeneinander, nur sichtbar wenn mindestens ein Bild vorhanden

### Betroffene Datei
| Datei | Änderung |
|-------|----------|
| `AdminIdentDetail.tsx` | Neue Query für Contract-Daten, neue Card + Ausweis-Dialog in rechter Spalte unter Test-Daten |

