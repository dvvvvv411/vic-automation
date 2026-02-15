

# Willkommensnachricht mit korrekten Umlauten

## Aenderung

**Datei**: `src/components/chat/ChatWidget.tsx`

Ein neuer `useEffect` wird hinzugefuegt (wie im bereits genehmigten Plan), aber mit korrekten deutschen Umlauten im Nachrichtentext:

### Nachrichtentext

> Herzlich willkommen im Livechat! Mein Name ist **[Name]** und ich bin Ihr persönlicher Ansprechpartner. Wie kann ich Ihnen behilflich sein?

(Ohne Name: *"Herzlich willkommen im Livechat! Ich bin Ihr persönlicher Ansprechpartner. Wie kann ich Ihnen behilflich sein?"*)

### Code

```tsx
const welcomeSentRef = useRef(false);
useEffect(() => {
  if (loading || !contractId || messages.length > 0 || welcomeSentRef.current) return;
  welcomeSentRef.current = true;

  const name = adminProfile.display_name;
  const text = name
    ? `Herzlich willkommen im Livechat! Mein Name ist ${name} und ich bin Ihr persönlicher Ansprechpartner. Wie kann ich Ihnen behilflich sein?`
    : `Herzlich willkommen im Livechat! Ich bin Ihr persönlicher Ansprechpartner. Wie kann ich Ihnen behilflich sein?`;

  sendMessage(text, "admin");
}, [loading, contractId, messages.length, adminProfile.display_name, sendMessage]);
```

Nur `src/components/chat/ChatWidget.tsx` wird angepasst. Keine weiteren Dateien betroffen.

