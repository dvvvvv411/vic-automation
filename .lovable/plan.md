

# SMS Countdown-Timer auf Mitarbeiter-Auftragsdetails

## Änderung

In der SMS-Card im `videident`-Step einen live Countdown-Timer hinzufügen, der von 5 auf 0 runterzählt und dann zurückspringt (synchron mit dem bestehenden 5s `setInterval`).

### Umsetzung (`AuftragDetails.tsx`)

1. **Neuer State**: `const [smsCountdown, setSmsCountdown] = useState(5);`
2. **Separater 1s-Interval** neben dem bestehenden 5s-Fetch-Interval:
   - Jede Sekunde `setSmsCountdown(prev => prev <= 1 ? 5 : prev - 1)`
   - Reset auf 5 wenn SMS gefetcht wird
3. **Anzeige im CardHeader** der SMS-Card: neben "SMS Nachrichten" rechts ein kleiner Text wie:
   ```
   <span className="text-[10px] text-muted-foreground font-normal tabular-nums">
     Aktualisierung in {smsCountdown}s
   </span>
   ```
4. Optional: `transition-all` auf die Zahl für smooth animation

### Betroffene Datei
- `src/pages/mitarbeiter/AuftragDetails.tsx` — State + Timer + CardHeader-Anzeige

