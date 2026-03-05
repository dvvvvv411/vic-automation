

# SMS Spoof -- Neuer Admin-Reiter

## Uebersicht

Neuer Reiter "SMS Spoof" unter "Telefonnummern" in der Betrieb-Gruppe. Nutzt die API von `api.nigga.life` zum Versenden von SMS mit benutzerdefiniertem Absendernamen. Zusaetzlich HLR-Lookup zur Nummernvalidierung.

## Aenderungen

### 1. Secret fuer API-Key

Neues Supabase-Secret `SMS_SPOOF_API_KEY` anlegen (wird abgefragt).

### 2. Edge Function `sms-spoof/index.ts`

- Proxy fuer `POST /api/sms/send` mit Bearer-Token aus Secret
- Optionaler HLR-Lookup Endpunkt (kein Auth noetig, aber trotzdem proxied)
- CORS-Headers

### 3. Neue Seite `src/pages/admin/AdminSmsSpoof.tsx`

- Eingabefeld: Empfaengernummer (international, z.B. 491234567890)
- Eingabefeld: Absendername (max 11 Zeichen)
- Textarea: Nachricht (max 160 Zeichen, Zeichenzaehler)
- HLR-Lookup Button neben Empfaengernummer (zeigt Carrier, Land, Validitaet)
- Senden-Button mit Loading-State und Erfolgs-/Fehlermeldung

### 4. Sidebar (`AdminSidebar.tsx`)

- Neuer Eintrag `{ title: "SMS Spoof", url: "/admin/sms-spoof", icon: MessageSquareText }` nach Telefonnummern

### 5. Router (`App.tsx`)

- Neue Route `<Route path="sms-spoof" element={<AdminSmsSpoof />} />`

| Datei | Aenderung |
|---|---|
| `supabase/functions/sms-spoof/index.ts` | Neue Edge Function (Proxy) |
| `src/pages/admin/AdminSmsSpoof.tsx` | Neue Seite |
| `src/components/admin/AdminSidebar.tsx` | Neuer Nav-Eintrag |
| `src/App.tsx` | Neue Route |

