import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/lib/sendEmail";
import { sendSms } from "@/lib/sendSms";
import { buildBrandingUrl } from "@/lib/buildBrandingUrl";
import { resolveContractBrandingBatch } from "@/lib/resolveContractBranding";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  brandingId?: string;
}

export default function AssignmentDialog({ open, onOpenChange, mode, sourceId, sourceLabel, brandingId }: AssignmentDialogProps) {
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

  // Load assignment counts per contract (for mode="order")
  const { data: assignmentCounts } = useQuery({
    queryKey: ["order_assignments", "counts_by_contract"],
    enabled: open && mode === "order",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_assignments")
        .select("contract_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((a) => {
        counts[a.contract_id] = (counts[a.contract_id] || 0) + 1;
      });
      return counts;
    },
  });

  // Load items to pick from
  const { data: items, isLoading: loadingItems } = useQuery({
    queryKey: [mode === "order" ? "assignable_contracts_v2" : "assignable_orders", brandingId],
    enabled: open,
    queryFn: async () => {
      if (mode === "order") {
        let query = supabase
          .from("employment_contracts")
          .select("id, first_name, last_name, email, employment_type, template_id")
          .in("status", ["offen", "eingereicht", "genehmigt", "unterzeichnet"])
          .not("first_name", "is", null);
        if (brandingId) query = query.eq("branding_id", brandingId);
        const { data, error } = await query;
        if (error) throw error;

        // Batch-load template titles for all contracts that have a template_id
        const templateIds = (data ?? []).map((c) => c.template_id).filter(Boolean) as string[];
        let templateMap: Record<string, string> = {};
        if (templateIds.length > 0) {
          const { data: templates } = await supabase
            .from("contract_templates")
            .select("id, title")
            .in("id", templateIds);
          (templates ?? []).forEach((t) => { templateMap[t.id] = t.title; });
        }

        return (data ?? []).map((c) => {
          const templateTitle = c.template_id ? templateMap[c.template_id] ?? null : null;
          return {
            id: c.id,
            label: `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim(),
            sublabel: c.email ?? "",
            employmentType: c.employment_type ?? null,
            templateTitle,
          };
        });
      } else {
        let query = supabase
          .from("orders")
          .select("id, order_number, title, provider");
        if (brandingId) query = query.eq("branding_id", brandingId);
        const { data, error } = await query;
        if (error) throw error;
        return (data ?? []).map((o) => ({
          id: o.id,
          label: `${o.order_number} – ${o.title}`,
          sublabel: o.provider ?? "",
          employmentType: null as string | null,
          templateTitle: null as string | null,
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

  // Calculate removed count for footer hint
  const existingIds = new Set(existing?.map((a) => (mode === "order" ? a.contract_id : a.order_id)) ?? []);
  const removedCount = Array.from(existingIds).filter((id) => !selected.has(id)).length;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const existingIdSet = new Set(existing?.map((a) => (mode === "order" ? a.contract_id : a.order_id)) ?? []);
      const newlyAdded = Array.from(selected).filter((id) => !existingIdSet.has(id));
      const removed = Array.from(existingIdSet).filter((id) => !selected.has(id));

      // Delete removed assignments — targeted by BOTH order_id AND contract_id
      for (const targetId of removed) {
        const { error: delErr } = await supabase
          .from("order_assignments")
          .delete()
          .eq(mode === "order" ? "order_id" : "contract_id", sourceId)
          .eq(mode === "order" ? "contract_id" : "order_id", targetId);
        if (delErr) throw delErr;
      }

      // Insert newly added assignments
      if (newlyAdded.length > 0) {
        const rows = newlyAdded.map((targetId) =>
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
          .select("id, email, first_name, last_name, phone, user_id, branding_id")
          .in("id", newlyAdded);

        // Resolve branding: profiles.branding_id first, then contract.branding_id
        const brandingMap = await resolveContractBrandingBatch(contracts ?? []);

        const { data: tpl } = await supabase.from("sms_templates" as any).select("message").eq("event_type", "auftrag_zugewiesen").single();

        for (const c of contracts ?? []) {
          const effectiveBrandingId = brandingMap[c.id] ?? null;

          if (c.email) {
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
              button_url: await buildBrandingUrl(effectiveBrandingId, "/mitarbeiter/auftraege"),
              branding_id: effectiveBrandingId,
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
            if (effectiveBrandingId) {
              const { data: branding } = await supabase.from("brandings").select("sms_sender_name" as any).eq("id", effectiveBrandingId).single();
              smsSender = (branding as any)?.sms_sender_name || undefined;
            }
            await sendSms({ to: c.phone, text: smsText, event_type: "auftrag_zugewiesen", recipient_name: name, from: smsSender, branding_id: effectiveBrandingId });
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
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary to-primary/60" />
        <div className="px-6 pt-5">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{sourceLabel}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-2">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Laden...</div>
        ) : !items?.length ? (
          <div className="py-8 text-center text-muted-foreground">
            {mode === "order" ? "Keine Mitarbeiter für dieses Branding vorhanden." : "Keine Aufträge vorhanden."}
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
            <div className="rounded-lg border mt-2">
              <ScrollArea className={filteredItems.length > 5 ? "h-[340px]" : ""}>
                <div className="space-y-2 p-2">
                  {filteredItems.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">Keine Ergebnisse für „{search}"</div>
                  ) : (
                    filteredItems.map((item) => {
                      const wasExisting = existingIds.has(item.id);
                      const isMarkedForRemoval = wasExisting && !selected.has(item.id);
                      return (
                      <label
                        key={item.id}
                        className={`flex items-center gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                          isMarkedForRemoval
                            ? "border-destructive bg-destructive/10 hover:bg-destructive/15"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <Checkbox
                          checked={selected.has(item.id)}
                          onCheckedChange={() => toggle(item.id)}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{item.label}</span>
                            {mode === "order" && assignmentCounts && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                                {assignmentCounts[item.id] || 0} {(assignmentCounts[item.id] || 0) === 1 ? "Auftrag" : "Aufträge"}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {item.sublabel && <span className="truncate">{item.sublabel}</span>}
                            {item.employmentType && (() => {
                              // Parse hours from template title (e.g. "Minijob 5 Stunden" → 5)
                              let hoursLabel: string | null = null;
                              if (item.templateTitle) {
                                const match = item.templateTitle.match(/(\d+)\s*Stunden/i);
                                if (match) hoursLabel = `${match[1]}h/Woche`;
                              }
                              const typeLabel = item.employmentType!.charAt(0).toUpperCase() + item.employmentType!.slice(1).toLowerCase();
                              return (
                                <>
                                  {item.sublabel && <span>·</span>}
                                  <span className="shrink-0">
                                    {hoursLabel ? `${typeLabel} · ${hoursLabel}` : typeLabel}
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </label>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
        </div>

        <DialogFooter className="px-6 pb-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button 
            className="shadow-sm hover:shadow-md transition-all"
            disabled={isLoading || saveMutation.isPending} 
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? "Speichern..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
