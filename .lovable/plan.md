

# Neuer Admin-Reiter "Telefonnummern" unter Betrieb

## Uebersicht

Ein neuer Bereich `/admin/telefonnummern` wird erstellt, in dem der Admin API-Share-Links von anosim.net einfuegen kann. Die App ruft dann den oeffentlichen Endpoint `GET /api/v1/OrderBookingShare?token=...` auf und zeigt die Telefonnummerndaten in einer Tabelle an. SMS werden per Collapsible in der jeweiligen Zeile angezeigt. Alles aktualisiert sich alle 5 Sekunden.

## Datenbankdesign

Neue Tabelle `phone_numbers` zum Speichern der API-Links:

```sql
CREATE TABLE public.phone_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage phone_numbers"
  ON public.phone_numbers FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));
```

Die Tabelle speichert nur die API-URL. Alle Daten (Nummer, Land, Status, SMS) werden live ueber den oeffentlichen anosim-Endpoint abgerufen -- kein Caching noetig.

## Neue Dateien

### 1. `src/pages/admin/AdminTelefonnummern.tsx`

- Input-Feld + Button zum Hinzufuegen eines API-Links (Validierung: muss `anosim.net/api/v1/orderbookingshare?token=` enthalten)
- Tabelle mit allen gespeicherten Nummern
- Fuer jede gespeicherte URL wird per `useQuery` mit `refetchInterval: 5000` der anosim-Endpoint aufgerufen
- Tabellenspalten: Nummer, Land, Typ, Service, Start, Ende, Status
- Klick auf Zeile oeffnet ein Collapsible mit den letzten 10 SMS (sortiert nach `messageDate` absteigend)
- Loeschen-Button pro Zeile (mit Bestaetigung)
- Status-Badges: Active = gruen, Ended = rot, Pending = gelb

### 2. Aenderungen an bestehenden Dateien

**`src/components/admin/AdminSidebar.tsx`**: Neuer Eintrag `{ title: "Telefonnummern", url: "/admin/telefonnummern", icon: Phone }` in der Gruppe "Betrieb" (nach Bewertungen)

**`src/App.tsx`**: Neue Route `<Route path="telefonnummern" element={<AdminTelefonnummern />} />` unter `/admin`

## API-Aufruf

Der `OrderBookingShare` Endpoint ist **oeffentlich** -- kein API-Key noetig. Der Admin gibt einfach die volle URL ein (z.B. `https://anosim.net/api/v1/orderbookingshare?token=94f6576eb60a4f95`), und die App ruft diese URL direkt per `fetch` auf. Alle 5 Sekunden wird die Antwort aktualisiert.

Antwortformat:
```json
{
  "number": "+4912345678910",
  "country": "Germany",
  "rentalType": "Activation",
  "service": "Facebook",
  "startDate": "2025-05-22T02:36:52.7Z",
  "endDate": "2025-05-22T03:36:52.7Z",
  "state": "Active",
  "sms": [{ "messageSender": "...", "messageDate": "...", "messageText": "..." }]
}
```

## SMS-Anzeige

- Standardmaessig eingeklappt
- Klick auf Tabellenzeile klappt SMS-Bereich auf (Collapsible)
- Zeigt die letzten 10 SMS, sortiert nach Datum (neueste zuerst)
- Jede SMS zeigt: Absender, Datum/Uhrzeit, Nachrichtentext

## Zusammenfassung der Aenderungen

| Datei | Aenderung |
|---|---|
| Migration | Neue Tabelle `phone_numbers` |
| `AdminTelefonnummern.tsx` | Neue Seite (NEU) |
| `AdminSidebar.tsx` | Neuer Nav-Eintrag |
| `App.tsx` | Neue Route |

