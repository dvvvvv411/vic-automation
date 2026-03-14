

# Arbeitsverträge: Tabs + Card-Layout wie Referenz

## Referenz-Analyse
Das Referenz-Panel zeigt: Tabs oben (Alle 11, Ausstehend 9, In Prüfung, Genehmigt 1, Abgelehnt 1) mit Zähler-Badges. Darunter Card-Rows statt Tabelle — jede Card zeigt Avatar-Kreis, Name + Status-Badge, E-Mail, Timestamps, und Action-Buttons rechts.

## Geplante Änderungen

### 1. Status-Tabs mit Zählern
Tabs: **Alle**, **Offen** (kein Contract/offen), **Eingereicht**, **Genehmigt**, **Unterzeichnet** — jeweils mit Count-Badge. Verwendet `Tabs`/`TabsList`/`TabsTrigger` von Radix. Filterung rein clientseitig auf den bereits geladenen `data`.

### 2. Card-Layout statt Tabelle
Jede Zeile wird eine Card mit:
- Links: Avatar-Kreis (Initialen), Name + Status-Badge, E-Mail darunter, Startdatum + Branding als Meta-Info
- Rechts: Action-Buttons (Link kopieren, Daten ansehen)

### 3. Tab-Wechsel setzt Pagination zurück

### Betroffene Datei
| Datei | Änderung |
|-------|----------|
| `AdminArbeitsvertraege.tsx` | Tabelle durch Tabs + Card-Liste ersetzen, Avatar-Initialen, moderneres Layout |

Keine Funktionsänderungen. Dialoge bleiben identisch.

