

## Plan: Loading-Spinner aus SMS-Card entfernen

**Datei:** `src/pages/mitarbeiter/AuftragDetails.tsx`

Zeilen 732-735 entfernen (den `smsLoading && smsMessages.length === 0` Branch). Dadurch springt die Logik direkt von "Warte auf Telefonnummer-Zuweisung" zum "Warte auf eingehende SMS..." Text wenn keine Nachrichten vorhanden sind.

Konkret: Die Zeilen `} : smsLoading && smsMessages.length === 0 ? ( ... )` werden entfernt, sodass der vorherige Branch direkt in den `smsMessages.length === 0` Branch übergeht.

