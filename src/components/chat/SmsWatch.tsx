import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, RefreshCw, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface AnosimSms {
  messageSender: string;
  messageDate: string;
  messageText: string;
}

interface AnosimData {
  number: string;
  sms: AnosimSms[];
}

interface PhoneEntry {
  id: string;
  api_url: string;
}

export function SmsWatch() {
  const [selectedEntry, setSelectedEntry] = useState<PhoneEntry | null>(null);
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const [open, setOpen] = useState(false);

  const { data: entries = [] } = useQuery<PhoneEntry[]>({
    queryKey: ["phone_numbers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("phone_numbers" as any)
        .select("id, api_url")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any;
    },
  });

  const { data: anosimData, isLoading } = useQuery<AnosimData>({
    queryKey: ["sms-watch", selectedEntry?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("anosim-proxy", {
        body: { url: selectedEntry!.api_url },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedEntry,
    refetchInterval: 5000,
  });

  const sortedSms = anosimData?.sms
    ? [...anosimData.sms]
        .sort((a, b) => new Date(b.messageDate).getTime() - new Date(a.messageDate).getTime())
        .slice(0, 10)
    : [];

  const newCount = sortedSms.length - lastSeenCount;

  useEffect(() => {
    if (open && sortedSms.length > 0) {
      setLastSeenCount(sortedSms.length);
    }
  }, [open, sortedSms.length]);

  const handleSelectEntry = (entry: PhoneEntry) => {
    setSelectedEntry(entry);
    setLastSeenCount(0);
  };

  const handleChangeNumber = () => {
    setSelectedEntry(null);
    setLastSeenCount(0);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 relative">
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">SMS</span>
          {newCount > 0 && !open && (
            <Badge className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 text-[10px] bg-destructive text-destructive-foreground">
              {newCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {!selectedEntry ? (
          <div className="p-3 space-y-2">
            <p className="text-sm font-medium">Telefonnummer wählen</p>
            {entries.length === 0 ? (
              <p className="text-xs text-muted-foreground">Keine Nummern unter /admin/telefonnummern hinzugefügt.</p>
            ) : (
              <div className="space-y-1">
                {entries.map((entry) => (
                  <PhoneOption key={entry.id} entry={entry} onSelect={handleSelectEntry} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{anosimData?.number || "Laden…"}</span>
                {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleChangeNumber}>
                <RefreshCw className="h-3 w-3" /> Ändern
              </Button>
            </div>
            <ScrollArea className="max-h-72">
              {sortedSms.length === 0 ? (
                <p className="p-3 text-xs text-muted-foreground">Keine SMS empfangen.</p>
              ) : (
                <div className="p-2 space-y-2">
                  {sortedSms.map((sms, i) => (
                    <div key={i} className="rounded-md border bg-background p-2 text-xs">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-medium">{sms.messageSender}</span>
                        <span className="text-muted-foreground text-[10px]">
                          {format(new Date(sms.messageDate), "dd.MM. HH:mm")}
                        </span>
                      </div>
                      <p className="text-foreground">{sms.messageText}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function PhoneOption({ entry, onSelect }: { entry: PhoneEntry; onSelect: (e: PhoneEntry) => void }) {
  const { data, isLoading } = useQuery<AnosimData>({
    queryKey: ["anosim", entry.api_url],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("anosim-proxy", {
        body: { url: entry.api_url },
      });
      if (error) throw error;
      return data;
    },
  });

  return (
    <button
      onClick={() => onSelect(entry)}
      className="w-full text-left rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center justify-between"
    >
      {isLoading ? (
        <span className="text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Laden…</span>
      ) : (
        <span>{data?.number || "Unbekannt"}</span>
      )}
    </button>
  );
}
