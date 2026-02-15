

# Dashboard-Ueberarbeitung: Echte Daten und Zusammenfassungs-Sektionen

## Probleme

1. **Bewertungs-Card**: Zeigt fest "4.8" und "Top 10%" an statt den echten Durchschnitt aus `order_reviews`
2. **Verdienst-Card**: Zeigt die Summe aller Praemien statt das aktuelle Guthaben (`balance`) aus `employment_contracts`
3. **Keine Zusammenfassungen**: Es fehlen Sektionen, die die Inhalte der anderen Reiter (Bewertungen, Meine Daten) kompakt darstellen

## Loesung

### 1. Echte Bewertungsdaten laden

In `fetchOrders` werden zusaetzlich die `order_reviews` des Mitarbeiters geladen:

```typescript
const { data: reviews } = await supabase
  .from("order_reviews")
  .select("rating")
  .eq("contract_id", contract.id);
```

Daraus wird der Durchschnitt berechnet. Die Detail-Zeile zeigt statt "Top 10%" die Anzahl bewerteter Auftraege an (z.B. "3 Bewertungen").

### 2. Guthaben statt Praemiensumme

Statt die Rewards aller Auftraege zusammenzurechnen, wird das `balance`-Feld des Vertrags geladen:

```typescript
const { data: contractDetails } = await supabase
  .from("employment_contracts")
  .select("balance")
  .eq("id", contract.id)
  .maybeSingle();
```

Die Verdienst-Card zeigt dann `balance` als "Guthaben" an.

### 3. Neue Zusammenfassungs-Sektionen

Unterhalb der Auftraege erscheinen zwei kompakte Sektionen:

**a) Letzte Bewertungen** -- Zeigt die letzten 3 bewerteten Auftraege mit Durchschnittssterne und Titel. Ein "Alle ansehen"-Button verlinkt zu `/mitarbeiter/bewertungen`.

**b) Meine Daten Kurzuebersicht** -- Zeigt Name, E-Mail, IBAN (maskiert) und aktuellen Kontostand. Ein "Details ansehen"-Button verlinkt zu `/mitarbeiter/meine-daten`.

## Technische Details

**Datei**: `src/pages/mitarbeiter/MitarbeiterDashboard.tsx`

### Neue State-Variablen

```typescript
const [balance, setBalance] = useState<number>(0);
const [avgRating, setAvgRating] = useState<number>(0);
const [reviewCount, setReviewCount] = useState<number>(0);
const [recentReviews, setRecentReviews] = useState<{order_title: string; avg: number; date: string}[]>([]);
const [profileSummary, setProfileSummary] = useState<{name: string; email: string; iban: string | null} | null>(null);
```

### Erweiterte Datenladen-Logik

Im bestehenden `useEffect` werden parallel zu den Auftraegen drei weitere Queries ausgefuehrt:

1. `employment_contracts` -> `balance, first_name, last_name, email, iban`
2. `order_reviews` -> alle Ratings fuer Durchschnitt + gruppiert nach `order_id` fuer "Letzte Bewertungen"
3. Die Reviews werden mit `orders(title)` gejoined, nach Auftrag gruppiert und die letzten 3 als `recentReviews` gespeichert

### Stats-Array Anpassung

```typescript
const stats = [
  { label: "Zugewiesene Tests", value: orders.length.toString(), icon: Smartphone, detail: "..." },
  { label: "Guthaben", value: `€${balance.toFixed(2)}`, icon: Euro, detail: "Aktueller Kontostand" },
  { label: "Offene Aufträge", value: "...", icon: ClipboardList, detail: "Handlungsbedarf" },
  { label: "Bewertung", value: avgRating > 0 ? avgRating.toFixed(1) : "—", icon: Star, detail: reviewCount > 0 ? `${reviewCount} Bewertungen` : "Noch keine" },
];
```

### Neue UI-Sektionen

Nach dem bestehenden "Deine Auftraege"-Block werden zwei neue Cards gerendert in einem 2-Spalten-Grid:

- **Letzte Bewertungen**: Liste mit max. 3 Eintraegen, jeweils Titel + goldene Sterne + Datum. Falls keine Bewertungen: Platzhalter-Text.
- **Profil-Kurzinfo**: Name, E-Mail, maskierte IBAN, Kontostand. Alles als kompakte Info-Zeilen.

Beide Cards haben einen "Alle ansehen" / "Details"-Button der via `navigate()` zum jeweiligen Reiter fuehrt.

