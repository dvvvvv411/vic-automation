## Ziel
Auf der `/auth`-Seite das Logo des for.tel-Brandings (Domain `for-tel.solutions`) im linken dunklen Panel komplett weiß darstellen. Andere Brandings bleiben unverändert.

## Umsetzung
In `src/pages/Auth.tsx`:

1. Beim Branding-Fetch (Zeile 54-73) das `domain`-Feld mitspeichern in einem neuen State `brandingDomain`.
2. Beim Render des Desktop-Logos (Zeile 195-196) prüfen, ob `brandingDomain === "for-tel.solutions"`. Falls ja, dem `<img>` die Klasse `[filter:brightness(0)_invert(1)]` hinzufügen → macht das Logo vollständig weiß.
3. Mobile-Logo (Zeile 234-235) bleibt unverändert (rechte Seite hat hellen Hintergrund).

Keine weiteren Dateien, keine DB-Änderungen.
