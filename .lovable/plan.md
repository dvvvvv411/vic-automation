## Ziel
Kleinere UI-Bereinigungen im rechten Panel der `/auth`-Seite (Login-/Registrierungsbereich).

## Änderungen

### 1. Footer-Links entfernen
**Ort:** Zeilen 549–552 in `src/pages/Auth.tsx`
**Aktion:** Den gesamten Footer-Block mit den Links „Impressum“ und „Datenschutz" löschen.
```tsx
// ZU ENTFERNEN:
<div className="flex justify-center gap-6 text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-12">
  <a href="#" className="hover:text-primary transition-colors">Impressum</a>
  <a href="#" className="hover:text-primary transition-colors">Datenschutz</a>
</div>
```

### 2. „Angemeldet bleiben" + „Passwort vergessen?" entfernen
**Ort:** Zeilen 372–378 in `src/pages/Auth.tsx`
**Aktion:** Die Zeile mit Checkbox und Passwort-vergessen-Link komplett entfernen.
```tsx
// ZU ENTFERNEN:
<div className="flex items-center justify-between text-sm">
  <label className="flex items-center gap-2.5 cursor-pointer">
    <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20" />
    <span className="text-muted-foreground font-medium">Angemeldet bleiben</span>
  </label>
  <a href="#" className="text-primary font-bold hover:opacity-80 transition-opacity">Passwort vergessen?</a>
</div>
```

### 3. „Nutzungsbedingungen" unlinked und ohne Unterstrich
**Ort:** Zwei Stellen in `src/pages/Auth.tsx`
- Login-Modus: Zeilen 406–408
- Registrierungs-Modus: Zeilen 541–543

**Aktion:** In beiden Textzeilen den `<a>`-Tag entfernen und „Nutzungsbedingungen" als reinen Text ohne Unterstreichung darstellen.

Vorher:
```tsx
Durch die Registrierung stimmst du unseren <a href="#" className="underline">Nutzungsbedingungen</a> zu.
```

Nachher:
```tsx
Durch die Registrierung stimmst du unseren Nutzungsbedingungen zu.
```

## Dateien
- `src/pages/Auth.tsx`