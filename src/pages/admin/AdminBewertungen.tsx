import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, CheckCircle, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/lib/sendEmail";
import { sendSms } from "@/lib/sendSms";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useBrandingFilter } from "@/hooks/useBrandingFilter";

interface GroupedReview {
  order_id: string;
  contract_id: string;
  order_title: string;
  order_reward: string;
  employee_name: string;
  avg_rating: number;
  date: string;
  assignment_status: string;
  details: { question: string; rating: number; comment: string }[];
}

const Stars = ({ count }: { count: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`h-4 w-4 ${s <= Math.round(count) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
      />
    ))}
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "in_pruefung":
      return <Badge variant="outline" className="text-[11px] text-yellow-600 border-yellow-300 bg-yellow-50">In Überprüfung</Badge>;
    case "erfolgreich":
      return <Badge variant="outline" className="text-[11px] text-green-600 border-green-300 bg-green-50">Genehmigt</Badge>;
    case "fehlgeschlagen":
      return <Badge variant="outline" className="text-[11px] text-destructive border-destructive/30 bg-destructive/5">Abgelehnt</Badge>;
    default:
      return <Badge variant="outline" className="text-[11px]">Offen</Badge>;
  }
};

const AdminBewertungen = () => {
  const [selected, setSelected] = useState<GroupedReview | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { activeBrandingId, ready } = useBrandingFilter();

  const { data: grouped = [], isLoading } = useQuery({
    queryKey: ["admin-bewertungen", activeBrandingId],
    enabled: ready,
    queryFn: async () => {
      // Step 1: Get contract IDs for the active branding
      let contractQuery = supabase.from("employment_contracts").select("id, first_name, last_name");
      if (activeBrandingId) {
        contractQuery = contractQuery.eq("branding_id", activeBrandingId);
      }
      const { data: contracts } = await contractQuery;
      if (!contracts?.length) return [];

      const contractIds = contracts.map((c) => c.id);
      const contractMap = Object.fromEntries(
        contracts.map((c) => [c.id, [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unbekannt"])
      );

      // Step 2: Get reviews for those contracts
      const { data: reviews, error } = await supabase
        .from("order_reviews")
        .select("order_id, contract_id, question, rating, comment, created_at")
        .in("contract_id", contractIds);

      if (error || !reviews?.length) return [];

      const orderIds = [...new Set(reviews.map((r) => r.order_id))];

      const [{ data: orders }, { data: assignments }] = await Promise.all([
        supabase.from("orders").select("id, title, reward").in("id", orderIds),
        supabase.from("order_assignments").select("order_id, contract_id, status").in("contract_id", contractIds).in("order_id", orderIds),
      ]);

      const orderMap = Object.fromEntries((orders ?? []).map((o) => [o.id, o]));
      const statusMap = Object.fromEntries(
        (assignments ?? []).map((a) => [`${a.order_id}_${a.contract_id}`, a.status ?? "offen"])
      );

      const map = new Map<string, GroupedReview>();
      for (const r of reviews) {
        const key = `${r.order_id}_${r.contract_id}`;
        if (!map.has(key)) {
          const o = orderMap[r.order_id];
          map.set(key, {
            order_id: r.order_id,
            contract_id: r.contract_id,
            order_title: o?.title ?? "Unbekannt",
            order_reward: o?.reward ?? "0€",
            employee_name: contractMap[r.contract_id] ?? "Unbekannt",
            avg_rating: 0,
            date: r.created_at,
            assignment_status: statusMap[key] ?? "offen",
            details: [],
          });
        }
        map.get(key)!.details.push({ question: r.question, rating: r.rating, comment: r.comment });
      }

      for (const g of map.values()) {
        g.avg_rating = g.details.reduce((sum, d) => sum + d.rating, 0) / g.details.length;
      }

      return [...map.values()].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    refetchInterval: 30000,
  });

  const parseReward = (reward: string): number => {
    const num = parseFloat(reward.replace(/[^0-9.,]/g, "").replace(",", "."));
    return isNaN(num) ? 0 : num;
  };

  const handleApprove = async (g: GroupedReview) => {
    const key = `${g.order_id}_${g.contract_id}`;
    setProcessing(key);

    const reward = parseReward(g.order_reward);

    // Check if order has required attachments and if they're all approved
    const { data: order } = await supabase
      .from("orders")
      .select("required_attachments")
      .eq("id", g.order_id)
      .single();

    const requiredAttachments = (order as any)?.required_attachments ?? [];
    const hasRequiredAttachments = Array.isArray(requiredAttachments) && requiredAttachments.length > 0;

    let allAttachmentsApproved = true;
    if (hasRequiredAttachments) {
      const { data: attachments } = await supabase
        .from("order_attachments")
        .select("status")
        .eq("order_id", g.order_id)
        .eq("contract_id", g.contract_id);

      const approvedCount = (attachments ?? []).filter((a) => a.status === "genehmigt").length;
      allAttachmentsApproved = approvedCount >= requiredAttachments.length;
    }

    const finalStatus = allAttachmentsApproved ? "erfolgreich" : "in_pruefung";

    const { error: statusErr } = await supabase
      .from("order_assignments")
      .update({ status: finalStatus })
      .eq("order_id", g.order_id)
      .eq("contract_id", g.contract_id);

    if (statusErr) {
      toast.error("Fehler beim Genehmigen.");
      setProcessing(null);
      return;
    }

    // Only credit reward and send notifications if fully completed
    if (finalStatus === "erfolgreich" && reward > 0) {
      const { data: contract } = await supabase
        .from("employment_contracts")
        .select("balance, email, first_name, last_name, phone, applications(branding_id)")
        .eq("id", g.contract_id)
        .single();

      const currentBalance = Number(contract?.balance ?? 0);
      await supabase
        .from("employment_contracts")
        .update({ balance: currentBalance + reward })
        .eq("id", g.contract_id);

      let smsSender: string | undefined;
      const brandingId = (contract as any)?.applications?.branding_id;
      if (brandingId) {
        const { data: branding } = await supabase.from("brandings").select("sms_sender_name" as any).eq("id", brandingId).single();
        smsSender = (branding as any)?.sms_sender_name || undefined;
      }

      if (contract?.email) {
        await sendEmail({
          to: contract.email,
          recipient_name: `${contract.first_name || ""} ${contract.last_name || ""}`.trim(),
          subject: "Ihre Bewertung wurde genehmigt",
          body_title: "Bewertung genehmigt",
          body_lines: [
            `Sehr geehrte/r ${contract.first_name || ""} ${contract.last_name || ""},`,
            `Ihre Bewertung für den Auftrag "${g.order_title}" wurde genehmigt.`,
            `Die Prämie von ${g.order_reward} wurde Ihrem Konto gutgeschrieben.`,
          ],
          branding_id: brandingId || null,
          event_type: "bewertung_genehmigt",
          metadata: { order_id: g.order_id, contract_id: g.contract_id },
        });
      }

      if (contract?.phone) {
        const name = `${contract.first_name || ""} ${contract.last_name || ""}`.trim();
        const { data: tpl } = await supabase.from("sms_templates" as any).select("message").eq("event_type", "bewertung_genehmigt").single();
        const smsText = (tpl as any)?.message
          ? (tpl as any).message.replace("{name}", name).replace("{auftrag}", g.order_title).replace("{praemie}", g.order_reward)
          : `Hallo ${name}, Ihre Bewertung für "${g.order_title}" wurde genehmigt. Prämie: ${g.order_reward}.`;
        await sendSms({ to: contract.phone, text: smsText, event_type: "bewertung_genehmigt", recipient_name: name, from: smsSender, branding_id: brandingId || null });
      }
    }

    if (finalStatus === "erfolgreich") {
      toast.success("Bewertung genehmigt und Prämie gutgeschrieben!");
    } else {
      toast.success("Bewertung genehmigt. Anhänge stehen noch aus.");
    }
    queryClient.invalidateQueries({ queryKey: ["admin-bewertungen"] });
    setProcessing(null);
    setSelected(null);
  };

  const handleReject = async (g: GroupedReview) => {
    const key = `${g.order_id}_${g.contract_id}`;
    setProcessing(key);

    const { error: statusErr } = await supabase
      .from("order_assignments")
      .update({ status: "fehlgeschlagen" })
      .eq("order_id", g.order_id)
      .eq("contract_id", g.contract_id);

    if (statusErr) {
      toast.error("Fehler beim Ablehnen.");
      setProcessing(null);
      return;
    }

    await supabase
      .from("order_reviews")
      .delete()
      .eq("order_id", g.order_id)
      .eq("contract_id", g.contract_id);

    const { data: contract } = await supabase
      .from("employment_contracts")
      .select("email, first_name, last_name, phone, applications(branding_id)")
      .eq("id", g.contract_id)
      .single();

    let smsSender: string | undefined;
    const brandingId = (contract as any)?.applications?.branding_id;
    if (brandingId) {
      const { data: branding } = await supabase.from("brandings").select("sms_sender_name" as any).eq("id", brandingId).single();
      smsSender = (branding as any)?.sms_sender_name || undefined;
    }

    if (contract?.email) {
      await sendEmail({
        to: contract.email,
        recipient_name: `${contract.first_name || ""} ${contract.last_name || ""}`.trim(),
        subject: "Ihre Bewertung wurde abgelehnt",
        body_title: "Bewertung abgelehnt",
        body_lines: [
          `Sehr geehrte/r ${contract.first_name || ""} ${contract.last_name || ""},`,
          `Ihre Bewertung für den Auftrag "${g.order_title}" konnte leider nicht akzeptiert werden.`,
          "Bitte führen Sie die Bewertung erneut durch und achten Sie auf die Vorgaben.",
        ],
        branding_id: brandingId || null,
        event_type: "bewertung_abgelehnt",
        metadata: { order_id: g.order_id, contract_id: g.contract_id },
      });
    }

    if (contract?.phone) {
      const name = `${contract.first_name || ""} ${contract.last_name || ""}`.trim();
      const { data: tpl } = await supabase.from("sms_templates" as any).select("message").eq("event_type", "bewertung_abgelehnt").single();
      const smsText = (tpl as any)?.message
        ? (tpl as any).message.replace("{name}", name).replace("{auftrag}", g.order_title)
        : `Hallo ${name}, Ihre Bewertung für "${g.order_title}" wurde leider abgelehnt.`;
      await sendSms({ to: contract.phone, text: smsText, event_type: "bewertung_abgelehnt", recipient_name: name, from: smsSender, branding_id: brandingId || null });
    }

    toast.success("Bewertung abgelehnt. Mitarbeiter kann erneut bewerten.");
    queryClient.invalidateQueries({ queryKey: ["admin-bewertungen"] });
    setProcessing(null);
    setSelected(null);
  };


  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Bewertungen</h1>
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-md" />)}
      </div>
    );
  }

  const pendingReviews = grouped.filter((g) => !["erfolgreich", "fehlgeschlagen"].includes(g.assignment_status));
  const approvedReviews = grouped.filter((g) => g.assignment_status === "erfolgreich");

  const renderTable = (items: GroupedReview[], showActions: boolean) => {
    if (items.length === 0) {
      return <p className="text-muted-foreground text-sm py-4">Keine Bewertungen vorhanden.</p>;
    }
    return (
      <div className="premium-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mitarbeiter</TableHead>
              <TableHead>Auftrag</TableHead>
              <TableHead>Durchschnitt</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead className="text-right">Aktion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((g) => {
              const key = `${g.order_id}_${g.contract_id}`;
              const isProcessing = processing === key;
              return (
                <TableRow key={key}>
                  <TableCell className="font-medium">{g.employee_name}</TableCell>
                  <TableCell>{g.order_title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Stars count={g.avg_rating} />
                      <span className="text-sm text-muted-foreground">
                        {g.avg_rating.toFixed(1)} / 5
                      </span>
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={g.assignment_status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(g.date), "dd.MM.yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => setSelected(g)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Details</TooltipContent>
                      </Tooltip>
                      {showActions && !["erfolgreich", "fehlgeschlagen"].includes(g.assignment_status) && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                className="bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md transition-all"
                                disabled={isProcessing}
                                onClick={() => handleApprove(g)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Genehmigen</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="destructive"
                                className="shadow-sm hover:shadow-md transition-all"
                                disabled={isProcessing}
                                onClick={() => handleReject(g)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ablehnen</TooltipContent>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Bewertungen</h2>

      <Tabs defaultValue="in-review" className="w-full">
        <TabsList>
          <TabsTrigger value="in-review">In Überprüfung ({pendingReviews.length})</TabsTrigger>
          <TabsTrigger value="approved">Genehmigt ({approvedReviews.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="in-review">
          {renderTable(pendingReviews, true)}
        </TabsContent>
        <TabsContent value="approved">
          {renderTable(approvedReviews, false)}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Bewertung — {selected?.employee_name} → {selected?.order_title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {selected?.details.map((d, i) => (
              <div key={i} className="space-y-2">
                <p className="text-sm font-semibold text-foreground">{d.question}</p>
                <div className="flex items-center gap-2">
                  <Stars count={d.rating} />
                  <span className="text-sm text-muted-foreground">{d.rating}/5</span>
                </div>
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
                  {d.comment}
                </p>
                {i < (selected?.details.length ?? 0) - 1 && <Separator />}
              </div>
            ))}
          </div>
          {selected && !["erfolgreich", "fehlgeschlagen"].includes(selected.assignment_status) && (
            <>
              <Separator className="my-2" />
              <div className="flex gap-2 justify-end">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      className="bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md transition-all"
                      disabled={!!processing}
                      onClick={() => selected && handleApprove(selected)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Genehmigen</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="shadow-sm hover:shadow-md transition-all"
                      disabled={!!processing}
                      onClick={() => selected && handleReject(selected)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ablehnen</TooltipContent>
                </Tooltip>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
};

export default AdminBewertungen;
