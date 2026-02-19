import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Send, Info } from "lucide-react";
import { toast } from "sonner";

const EVENT_TYPES = [
  { key: "gespraech_gebucht", label: "Bewerbungsgespräch gebucht", desc: "Bewerber bucht ein Bewerbungsgespräch" },
  { key: "vertrag_eingereicht", label: "Arbeitsvertrag eingereicht", desc: "Bewerber füllt Arbeitsvertrag aus" },
  { key: "vertrag_unterzeichnet", label: "Vertrag unterzeichnet", desc: "Bewerber/Mitarbeiter unterzeichnet Vertrag" },
  { key: "auftragstermin_gebucht", label: "Auftragstermin gebucht", desc: "Mitarbeiter bucht einen Auftragstermin" },
  { key: "chat_nachricht", label: "Chat-Nachricht", desc: "Mitarbeiter schreibt im Livechat" },
  { key: "bewertung_eingereicht", label: "Bewertung eingereicht", desc: "Mitarbeiter schickt Bewertung ab" },
];

interface TelegramChat {
  id: string;
  chat_id: string;
  label: string;
  events: string[];
  created_at: string;
}

export default function AdminTelegram() {
  const queryClient = useQueryClient();
  const [newChatId, setNewChatId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>([]);

  const { data: chats = [], isLoading } = useQuery({
    queryKey: ["telegram-chats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("telegram_chats" as any)
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as any as TelegramChat[]) ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("telegram_chats" as any).insert({
        chat_id: newChatId.trim(),
        label: newLabel.trim(),
        events: newEvents,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegram-chats"] });
      setNewChatId("");
      setNewLabel("");
      setNewEvents([]);
      toast.success("Chat-ID hinzugefügt");
    },
    onError: () => toast.error("Fehler beim Speichern"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("telegram_chats" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegram-chats"] });
      toast.success("Chat-ID entfernt");
    },
  });

  const toggleEvent = (chatId: string, currentEvents: string[], eventKey: string) => {
    const updated = currentEvents.includes(eventKey)
      ? currentEvents.filter((e) => e !== eventKey)
      : [...currentEvents, eventKey];
    supabase
      .from("telegram_chats" as any)
      .update({ events: updated } as any)
      .eq("id", chatId)
      .then(({ error }) => {
        if (error) toast.error("Fehler");
        else queryClient.invalidateQueries({ queryKey: ["telegram-chats"] });
      });
  };

  const toggleNewEvent = (key: string) => {
    setNewEvents((prev) =>
      prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]
    );
  };

  const testMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("send-telegram", {
        body: { event_type: "_test", message: "🔔 Test-Nachricht von Vic Admin" },
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Testnachricht an alle Chat-IDs gesendet"),
    onError: () => toast.error("Fehler beim Senden"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Telegram-Benachrichtigungen</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Verwalten Sie Telegram Chat-IDs und legen Sie fest, welche Ereignisse eine Nachricht auslösen.
        </p>
      </div>

      {/* Setup instructions */}
      <Accordion type="single" collapsible>
        <AccordionItem value="setup">
          <AccordionTrigger className="text-sm font-medium">
            <span className="flex items-center gap-2">
              <Info className="h-4 w-4" /> Bot einrichten – Anleitung
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <ol className="list-decimal list-inside space-y-2">
                <li>Öffne Telegram und suche nach <strong>@BotFather</strong>.</li>
                <li>Sende <code>/newbot</code> und folge den Anweisungen, um einen neuen Bot zu erstellen.</li>
                <li>Kopiere den <strong>Bot-Token</strong> und speichere ihn als Supabase Secret <code>TELEGRAM_BOT_TOKEN</code>.</li>
                <li>Füge den Bot zur gewünschten Gruppe hinzu oder sende ihm eine Privatnachricht.</li>
                <li>
                  Ermittle die <strong>Chat-ID</strong>: Öffne{" "}
                  <code>https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code> im Browser, nachdem du eine Nachricht an den Bot gesendet hast.
                  Die Chat-ID findest du unter <code>message.chat.id</code>.
                </li>
                <li>Trage die Chat-ID unten ein und wähle die gewünschten Ereignisse.</li>
              </ol>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Add new chat ID */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Neue Chat-ID hinzufügen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Chat-ID</Label>
              <Input
                placeholder="-1001234567890"
                value={newChatId}
                onChange={(e) => setNewChatId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Bezeichnung</Label>
              <Input
                placeholder="z.B. Hauptgruppe"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Ereignisse</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EVENT_TYPES.map((ev) => (
                <label key={ev.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={newEvents.includes(ev.key)}
                    onCheckedChange={() => toggleNewEvent(ev.key)}
                  />
                  {ev.label}
                </label>
              ))}
            </div>
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!newChatId.trim() || !newLabel.trim() || createMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Hinzufügen
          </Button>
        </CardContent>
      </Card>

      {/* Existing chat IDs */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Laden...</p>
      ) : chats.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Noch keine Chat-IDs konfiguriert.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {chats.map((chat) => (
            <Card key={chat.id}>
              <CardContent className="py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{chat.label}</p>
                    <p className="text-xs text-muted-foreground font-mono">{chat.chat_id}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(chat.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EVENT_TYPES.map((ev) => (
                    <label key={ev.key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={chat.events.includes(ev.key)}
                        onCheckedChange={() => toggleEvent(chat.id, chat.events, ev.key)}
                      />
                      {ev.label}
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Event overview table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Event-Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ereignis</TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead>Aktive Chat-IDs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EVENT_TYPES.map((ev) => {
                const activeChats = chats.filter((c) => c.events.includes(ev.key));
                return (
                  <TableRow key={ev.key}>
                    <TableCell className="font-medium text-sm">{ev.label}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{ev.desc}</TableCell>
                    <TableCell>
                      {activeChats.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {activeChats.map((c) => (
                            <Badge key={c.id} variant="secondary" className="text-xs">
                              {c.label}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Test button */}
      <Button variant="outline" onClick={() => testMutation.mutate()} disabled={testMutation.isPending}>
        <Send className="h-4 w-4 mr-1.5" />
        Testnachricht senden
      </Button>
    </div>
  );
}
