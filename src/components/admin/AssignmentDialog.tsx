import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/lib/sendEmail";
import { sendSms } from "@/lib/sendSms";
import { buildBrandingUrl } from "@/lib/buildBrandingUrl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";

interface AssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "order" | "contract";
  sourceId: string;
  sourceLabel: string;
}

export default function AssignmentDialog({ open, onOpenChange, mode, sourceId, sourceLabel }: AssignmentDialogProps) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  // Reset search when dialog opens/closes
  useEffect(() => { setSearch(""); }, [open]);

  // Load existing assignments
  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ["order_assignments", mode, sourceId],
    enabled: open,
    queryFn: async () => {
      const col = mode === "order" ? "order_id" : "contract_id";
      const { data, error } = await supabase
        .from("order_assignments")
        .select("order_id, contract_id")
        .eq(col, sourceId);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Load items to pick from
  const { data: items, isLoading: loadingItems } = useQuery({
    queryKey: [mode === "order" ? "assignable_contracts" : "assignable_orders"],
    enabled: open,
    queryFn: async () => {
      if (mode === "order") {
        const { data, error } = await supabase
          .from("employment_contracts")
          .select("id, first_name, last_name, email")
          .eq("status", "unterzeichnet");
        if (error) throw error;
        return (data ?? []).map((c) => ({
          id: c.id,
          label: `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim(),
          sublabel: c.email ?? "",
        }));
      } else {
        const { data, error } = await supabase
          .from("orders")
          .select("id, order_number, title, provider");
        if (error) throw error;
        return (data ?? []).map((o) => ({
          id: o.id,
          label: `${o.order_number} – ${o.title}`,
          sublabel: o.provider ?? "",
        }));
      }
    },
  });

  // Seed selected from existing assignments
  useEffect(() => {
    if (existing) {
      const ids = existing.map((a) => (mode === "order" ? a.contract_id : a.order_id));
      setSelected(new Set(ids));
    }
  }, [existing, mode]);

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (!search.trim()) return items;
    const term = search.toLowerCase().trim();
    return items.filter((item) =>
      item.label.toLowerCase().includes(term) || item.sublabel.toLowerCase().includes(term)
    );
  }, [items, search]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const col = mode === "order" ? "order_id" : "contract_id";
      const existingIds = new Set(existing?.map((a) => (mode === "order" ? a.contract_id : a.order_id)) ?? []);
      const newlyAdded = Array.from(selected).filter((id) => !existingIds.has(id));

      const { error: delErr } = await supabase
        .from("order_assignments")
        .delete()
        .eq(col, sourceId);
      if (delErr) throw delErr;

      if (selected.size > 0) {
        const rows = Array.from(selected).map((targetId) =>
          mode === "order"
            ? { order_id: sourceId, contract_id: targetId }
            : { order_id: targetId, contract_id: sourceId }
        );
        const { error: insErr } = await supabase
          .from("order_assignments")
          .insert(rows);
        if (insErr) throw insErr;
      }

      // Send emails for newly assigned employees
      if (mode === "order" && newlyAdded.length > 0) {
        const { data: order } = await supabase
          .from("orders")
          .select("title, order_number, reward")
          .eq("id", sourceId)
          .single();

        const { data: contracts } = await supabase
          .from("employment_contracts")
          .select("id, email, first_name, last_name, phone, applications(branding_id)")
          .in("id", newlyAdded);

        const { data: tpl } = await supabase.from("sms_templates" as any).select("message").eq("event_type", "auftrag_zugewiesen").single();

        for (const c of contracts ?? []) {
          if (c.email) {
            const brandingId = (c as any)?.applications?.branding_id;
            await sendEmail({
              to: c.email,
              recipient_name: `${c.first_name || ""} ${c.last_name || ""}`.trim(),
              subject: "Neuer Auftrag zugewiesen",
              body_title: "Sie haben einen neuen Auftrag erhalten",
              body_lines: [
                `Sehr geehrte/r ${c.first_name || ""} ${c.last_name || ""},`,
                `Ihnen wurde der Auftrag "${order?.title || ""}" (Nr. ${order?.order_number || ""}) zugewiesen.`,
                `Prämie: ${order?.reward || ""}`,
                "Bitte loggen Sie sich in Ihr Mitarbeiterkonto ein, um die Details einzusehen.",
              ],
              button_text: "Zum Mitarbeiterportal",
              button_url: await buildBrandingUrl(brandingId, "/mitarbeiter/auftraege"),
              branding_id: brandingId || null,
              event_type: "auftrag_zugewiesen",
              metadata: { order_id: sourceId, contract_id: c.id },
            });
          }
          if (c.phone) {
            const name = `${c.first_name || ""} ${c.last_name || ""}`.trim();
            const smsText = (tpl as any)?.message
              ? (tpl as any).message.replace("{name}", name).replace("{auftrag}", order?.title || "")
              : `Hallo ${name}, Ihnen wurde ein neuer Auftrag zugewiesen: ${order?.title || ""}`;
            let smsSender: string | undefined;
            const brandingId = (c as any)?.applications?.branding_id;
            if (brandingId) {
              const { data: branding } = await supabase.from("brandings").select("sms_sender_name" as any).eq("id", brandingId).single();
              smsSender = (branding as any)?.sms_sender_name || undefined;
            }
            await sendSms({ to: c.phone, text: smsText, event_type: "auftrag_zugewiesen", recipient_name: name, from: smsSender });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["mitarbeiter"] });
      queryClient.invalidateQueries({ queryKey: ["order_assignments"] });
      toast({ title: "Zuweisungen gespeichert" });
      onOpenChange(false);
    },
    onError: (e: Error) => {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    },
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const isLoading = loadingExisting || loadingItems;
  const title = mode === "order" ? "Mitarbeiter zuweisen" : "Aufträge zuweisen";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{sourceLabel}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Laden...</div>
        ) : !items?.length ? (
          <div className="py-8 text-center text-muted-foreground">
            {mode === "order" ? "Keine unterzeichneten Mitarbeiter vorhanden." : "Keine Aufträge vorhanden."}
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={mode === "order" ? "Name oder E-Mail suchen..." : "Auftragsnr., Titel oder Anbieter suchen..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="max-h-[50vh]">
              <div className="space-y-2 pr-3">
                {filteredItems.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">Keine Ergebnisse für „{search}"</div>
                ) : (
                  filteredItems.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 rounded-md border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={selected.has(item.id)}
                        onCheckedChange={() => toggle(item.id)}
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{item.label}</div>
                        {item.sublabel && (
                          <div className="text-xs text-muted-foreground truncate">{item.sublabel}</div>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button disabled={isLoading || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? "Speichern..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
