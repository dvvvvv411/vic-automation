

# Bewerber-Info-Element kompakter und zentriert gestalten

## Aenderung

In `src/pages/Bewerbungsgespraech.tsx` wird die Applicant-Info-Card angepasst:

1. **Kompakter**: Statt voller Breite (`w-full` im aeusseren Container) bekommt die Card ein `w-fit` (nur so breit wie der Inhalt) und `mx-auto` (horizontal zentriert)
2. **Inhalt zentriert**: Der Flex-Container im CardContent wird auf `justify-center` und `text-center` gesetzt
3. **Weniger Padding**: Das Padding wird reduziert, damit kein ueberfluessiger Freiraum entsteht

### Geaenderte Datei

| Datei | Aenderung |
|---|---|
| `src/pages/Bewerbungsgespraech.tsx` | Card bekommt `w-fit mx-auto`, CardContent bekommt zentriertes Layout mit reduziertem Padding |

