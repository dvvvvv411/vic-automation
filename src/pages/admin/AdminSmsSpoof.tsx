import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Send, Search, Loader2, CheckCircle, XCircle } from "lucide-react";

interface HlrResult {
  number_type: string;
  location: string;
  region_code: string;
  is_valid: boolean;
  formatted_international: string;
  carrier: string;
  time_zones: string[];
}

export default function AdminSmsSpoof() {
  const [to, setTo] = useState("");
  const [senderID, setSenderID] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [hlrLoading, setHlrLoading] = useState(false);
  const [hlrResult, setHlrResult] = useState<HlrResult | null>(null);

  const handleHlr = async () => {
    if (!to.trim()) return;
    setHlrLoading(true);
    setHlrResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("sms-spoof", {
        body: { action: "hlr", number: to.trim() },
      });
      if (error) throw error;
      setHlrResult(data);
    } catch (err) {
      toast({ title: "HLR Lookup fehlgeschlagen", description: String(err), variant: "destructive" });
    } finally {
      setHlrLoading(false);
    }
  };

  const handleSend = async () => {
    if (!to.trim() || !senderID.trim() || !text.trim()) {
      toast({ title: "Alle Felder ausfüllen", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("sms-spoof", {
        body: { action: "send", to: to.trim(), senderID: senderID.trim(), text: text.trim() },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Fehler", description: data.error, variant: "destructive" });
      } else {
        toast({ title: "SMS gesendet!", description: `An ${to}` });
        setText("");
      }
    } catch (err) {
      toast({ title: "Senden fehlgeschlagen", description: String(err), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">SMS Spoof</h1>

      <Card>
        <CardHeader>
          <CardTitle>Nachricht senden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Empfängernummer + HLR */}
          <div className="space-y-2">
            <Label>Empfängernummer (international, z.B. 491234567890)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="491234567890"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={handleHlr} disabled={hlrLoading || !to.trim()}>
                {hlrLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* HLR Result */}
          {hlrResult && (
            <div className="rounded-md border p-3 text-sm space-y-1 bg-muted/30">
              <div className="flex items-center gap-2">
                {hlrResult.is_valid ? (
                  <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" /> Gültig</Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Ungültig</Badge>
                )}
                <span className="text-muted-foreground">{hlrResult.region_code}</span>
              </div>
              {hlrResult.formatted_international && (
                <p>Formatiert: {hlrResult.formatted_international}</p>
              )}
              {hlrResult.number_type && <p>Typ: {hlrResult.number_type}</p>}
              {hlrResult.location && <p>Ort: {hlrResult.location}</p>}
              {hlrResult.carrier && <p>Carrier: {hlrResult.carrier}</p>}
            </div>
          )}

          {/* Absendername */}
          <div className="space-y-2">
            <Label>Absendername (max. 11 Zeichen)</Label>
            <Input
              placeholder="MyBrand"
              maxLength={11}
              value={senderID}
              onChange={(e) => setSenderID(e.target.value)}
            />
            <p className="text-xs text-muted-foreground text-right">{senderID.length}/11</p>
          </div>

          {/* Nachricht */}
          <div className="space-y-2">
            <Label>Nachricht (max. 160 Zeichen)</Label>
            <Textarea
              placeholder="Deine Nachricht..."
              maxLength={160}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground text-right">{text.length}/160</p>
          </div>

          {/* Senden */}
          <Button onClick={handleSend} disabled={sending || !to.trim() || !senderID.trim() || !text.trim()} className="w-full">
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            SMS senden
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
