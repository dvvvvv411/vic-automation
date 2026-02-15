

# Bankkarten-Layout korrigieren

## Problem

Die Bankkarte hat drei separate Flex-Children mit `justify-between`, wodurch BIC und Bankname in der Mitte der Karte schweben, statt unten beim Namen zu stehen. Das sieht nicht wie eine echte Bankkarte aus.

## Loesung

Das Layout wird so umstrukturiert, dass die Karte nur zwei logische Bereiche hat:

- **Oben**: IBAN (mit Label)
- **Unten**: BIC, Bankname und Karteninhaber-Name zusammen

### Neues Layout der Bankkarte

```text
+--------------------------------------+
|                            (o)(o)    |
|  IBAN                                |
|  DE89 3704 0044 0532 0130 00         |
|                                      |
|                                      |
|  BIC: COBADEFFXXX                    |
|  Sparkasse Musterstadt              |
|  Max Mustermann                      |
+--------------------------------------+
```

### Technische Aenderung

**Datei**: `src/pages/mitarbeiter/MeineDaten.tsx` (Zeilen 186-202)

Die drei Flex-Children werden zu zwei zusammengefasst:

1. Oberer Bereich: IBAN-Label + IBAN-Nummer (bleibt gleich)
2. Unterer Bereich: BIC, Bankname und Name werden in ein gemeinsames `div` gruppiert

So rutschen BIC und Bankname nach unten direkt ueber den Namen, wie bei einer echten Bankkarte.

