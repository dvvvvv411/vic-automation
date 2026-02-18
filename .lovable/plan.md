

# Registrieren-Tab auf der Auth-Seite entfernen

## Aenderung

Auf der `/auth`-Seite wird der "Registrieren"-Tab komplett entfernt, sodass nur noch das Anmeldeformular sichtbar ist. Die Tabs-Komponente wird dabei ebenfalls entfernt, da sie bei nur einem Tab keinen Sinn mehr ergibt.

## Betroffene Datei

| Datei | Aenderung |
|-------|-----------|
| `src/pages/Auth.tsx` | Tabs-Komponente, TabsList, TabsTrigger und den gesamten "register"-TabsContent entfernen. Das Login-Formular wird direkt ohne Tabs gerendert. Registrierungs-State-Variablen (`regName`, `regEmail`, `regPassword`) und `handleRegister` ebenfalls entfernen. |

## Details

- Die Imports fuer `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger` werden entfernt
- Die State-Variablen `regName`, `regEmail`, `regPassword` werden entfernt
- Die Funktion `handleRegister` wird entfernt
- Das Login-Formular bleibt bestehen und wird direkt (ohne Tabs-Wrapper) angezeigt

