
# Euro-Zeichen bei Praemie im Livechat-Auftragsangebot

## Problem

Beim Zuweisen eines Auftrags im Livechat wird die Praemie ohne Euro-Zeichen angezeigt (z.B. "Praemie: 25" statt "Praemie: 25 EUR").

## Aenderungen

Drei Stellen muessen angepasst werden, alle nutzen das bereits vorhandene Muster aus dem restlichen Projekt:

```
reward + (reward.includes("€") ? "" : " €")
```

### 1. `src/pages/admin/AdminLivechat.tsx` – Systemnachricht-Text (Zeile 287)

Vorher: `Prämie: ${order.reward}`
Nachher: `Prämie: ${order.reward}${order.reward.includes("€") ? "" : " €"}`

### 2. `src/pages/admin/AdminLivechat.tsx` – Auftragsliste im Dialog (Zeile 587)

Vorher: `Prämie: {order.reward}`
Nachher: `Prämie: {order.reward}{order.reward.includes("€") ? "" : " €"}`

### 3. `src/components/chat/ChatBubble.tsx` – Auftrags-Karte (Zeile 129)

Vorher: `Prämie: {metadata.reward}`
Nachher: `Prämie: {metadata.reward}{String(metadata.reward || "").includes("€") ? "" : " €"}`

## Keine weiteren Aenderungen

Nur Textformatierung, keine Logik- oder Datenbank-Aenderungen.
