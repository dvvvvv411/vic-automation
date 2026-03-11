import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Star, ChevronDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "–";
  try {
    return format(parseISO(dateStr), "dd. MMMM yyyy", { locale: de });
  } catch {
    return "–";
  }
}

const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-foreground text-right max-w-[60%] break-all">{value || "–"}</span>
  </div>
);

const statusBadge = (status: string, isSuspended: boolean) => {
  const badges = [];
  switch (status) {
    case "unterzeichnet":
      badges.push(<Badge key="s" variant="outline" className="text-green-600 border-green-300 bg-green-50">Unterzeichnet</Badge>);
      break;
    case "genehmigt":
      badges.push(<Badge key="s" className="bg-green-600 text-white border-green-600">Genehmigt</Badge>);
      break;
    case "eingereicht":
      badges.push(<Badge key="s" className="bg-yellow-500 text-white border-yellow-500">Eingereicht</Badge>);
      break;
    default:
      badges.push(<Badge key="s" variant="outline">Offen</Badge>);
  }
  if (isSuspended) {
    badges.push(<Badge key="x" variant="outline" className="text-red-600 border-red-300 bg-red-50">Gesperrt</Badge>);
  }
  return <div className="flex gap-1.5">{badges}</div>;
};

const assignmentStatusBadge = (status: string) => {
  switch (status) {
    case "erfolgreich":
      return <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">Erfolgreich</Badge>;
    case "in_pruefung":
      return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">In Prüfung</Badge>;
    case "fehlgeschlagen":
      return <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">Fehlgeschlagen</Badge>;
    default:
      return <Badge variant="outline">Offen</Badge>;
  }
};

interface MitarbeiterDetailPopupProps {
  contractId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MitarbeiterDetailPopup({ contractId, open, onOpenChange }: MitarbeiterDetailPopupProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: contract, isLoading } = useQuery({
    queryKey: ["popup-contract-detail", contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employment_contracts")
        .select("*, applications(brandings(company_name))")
        .eq("id", contractId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: open && !!contractId,
  });

  const { data: assignments } = useQuery({
    queryKey: ["popup-contract-assignments", contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_assignments")
        .select("*, orders(order_number, title, provider, reward, is_placeholder)")
        .eq("contract_id", contractId)
        .order("assigned_at", { ascending: false });
      if (error) throw error;

      const { data: appointments } = await supabase
        .from("order_appointments")
        .select("*")
        .eq("contract_id", contractId);

      return (data ?? []).map((a: any) => ({
        ...a,
        appointment: (appointments ?? []).find((ap: any) => ap.order_id === a.order_id),
      }));
    },
    enabled: open && !!contractId,
  });

  const { data: reviews } = useQuery({
    queryKey: ["popup-contract-reviews", contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_reviews")
        .select("*, orders(order_number, title)")
        .eq("contract_id", contractId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: open && !!contractId,
  });

  const reviewsByOrder = (reviews ?? []).reduce((acc: Record<string, { order: any; items: any[] }>, r: any) => {
    if (!acc[r.order_id]) {
      acc[r.order_id] = { order: r.orders, items: [] };
    }
    acc[r.order_id].items.push(r);
    return acc;
  }, {});

  const fullName = contract ? `${contract.first_name ?? ""} ${contract.last_name ?? ""}`.trim() || "Unbekannt" : "";
  const branding = (contract as any)?.applications?.brandings?.company_name ?? "–";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[85vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <DialogTitle className="flex items-center gap-3">
              <span className="text-xl">{fullName || "Mitarbeiter Details"}</span>
              {contract && statusBadge(contract.status, contract.is_suspended)}
              <span className="text-sm text-muted-foreground font-normal">{branding}</span>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-6 space-y-6">
              {isLoading ? (
                <p className="text-center text-muted-foreground py-8">Laden...</p>
              ) : !contract ? (
                <p className="text-center text-muted-foreground py-8">Nicht gefunden.</p>
              ) : (
                <>
                  {/* Personal Data + Contact */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Persönliche Daten</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-0 pt-0">
                        <InfoRow label="Vorname" value={contract.first_name} />
                        <InfoRow label="Nachname" value={contract.last_name} />
                        <InfoRow label="Geburtsdatum" value={formatDate(contract.birth_date)} />
                        <InfoRow label="Geburtsort" value={contract.birth_place} />
                        <InfoRow label="Nationalität" value={contract.nationality} />
                        <InfoRow label="Familienstand" value={contract.marital_status} />
                        <InfoRow label="Beschäftigungsart" value={contract.employment_type} />
                        <InfoRow label="Gewünschtes Startdatum" value={formatDate(contract.desired_start_date)} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Kontakt & Finanzen</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-0 pt-0">
                        <InfoRow label="E-Mail" value={contract.email} />
                        <InfoRow label="Telefon" value={contract.phone} />
                        <InfoRow label="Straße" value={contract.street} />
                        <InfoRow label="PLZ / Ort" value={contract.zip_code && contract.city ? `${contract.zip_code} ${contract.city}` : contract.city || contract.zip_code} />
                        <InfoRow label="SV-Nr" value={contract.social_security_number} />
                        <InfoRow label="Steuer-ID" value={contract.tax_id} />
                        <InfoRow label="Krankenkasse" value={contract.health_insurance} />
                        <InfoRow label="IBAN" value={contract.iban} />
                        <InfoRow label="BIC" value={contract.bic} />
                        <InfoRow label="Bank" value={contract.bank_name} />
                        <InfoRow label="Guthaben" value={contract.balance != null ? `${Number(contract.balance).toFixed(2)} €` : "–"} />
                        <InfoRow label="Temp. Passwort" value={contract.temp_password} />
                      </CardContent>
                    </Card>
                  </div>

                  {/* ID Images */}
                  {(contract.id_front_url || contract.id_back_url) && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Personalausweis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-4 flex-wrap">
                          {contract.id_front_url && (
                            <div className="cursor-pointer" onClick={() => setImagePreview(contract.id_front_url)}>
                              <p className="text-xs text-muted-foreground mb-1">Vorderseite</p>
                              <img src={contract.id_front_url} alt="Ausweis Vorderseite" className="h-28 rounded-lg border border-border object-cover hover:opacity-80 transition-opacity" />
                            </div>
                          )}
                          {contract.id_back_url && (
                            <div className="cursor-pointer" onClick={() => setImagePreview(contract.id_back_url)}>
                              <p className="text-xs text-muted-foreground mb-1">Rückseite</p>
                              <img src={contract.id_back_url} alt="Ausweis Rückseite" className="h-28 rounded-lg border border-border object-cover hover:opacity-80 transition-opacity" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Orders */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Aufträge ({(assignments ?? []).length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!(assignments ?? []).length ? (
                        <p className="text-sm text-muted-foreground py-3 text-center">Keine Aufträge zugewiesen.</p>
                      ) : (
                        <div className="border border-border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Auftragsnr.</TableHead>
                                <TableHead>Titel</TableHead>
                                <TableHead>Anbieter</TableHead>
                                <TableHead>Prämie</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Termin</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(assignments ?? []).map((a: any) => (
                                <TableRow key={a.id}>
                                  <TableCell className="font-mono text-xs">{a.orders?.order_number ?? "–"}</TableCell>
                                  <TableCell className="font-medium">{a.orders?.title ?? "–"}</TableCell>
                                  <TableCell className="text-muted-foreground">{a.orders?.provider ?? "–"}</TableCell>
                                  <TableCell className="text-muted-foreground">{a.orders?.reward ?? "–"}</TableCell>
                                  <TableCell>{assignmentStatusBadge(a.status)}</TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {a.appointment
                                      ? `${format(parseISO(a.appointment.appointment_date), "dd.MM.yyyy")} ${a.appointment.appointment_time?.slice(0, 5)}`
                                      : "–"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Reviews */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Bewertungen ({(reviews ?? []).length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!Object.keys(reviewsByOrder).length ? (
                        <p className="text-sm text-muted-foreground py-3 text-center">Keine Bewertungen vorhanden.</p>
                      ) : (
                        <div className="space-y-3">
                          {Object.entries(reviewsByOrder).map(([orderId, group]: [string, any]) => {
                            const avg = group.items.reduce((s: number, r: any) => s + r.rating, 0) / group.items.length;
                            return (
                              <Collapsible key={orderId}>
                                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <span className="font-medium text-sm">{group.order?.title ?? "Auftrag"}</span>
                                    <span className="text-xs text-muted-foreground">{group.order?.order_number}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                                      <span className="text-sm font-medium">{avg.toFixed(1)}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">({group.items.length} Fragen)</span>
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2 space-y-2 pl-3">
                                  {group.items.map((r: any) => (
                                    <div key={r.id} className="border border-border/50 rounded-lg p-3">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium">{r.question}</span>
                                        <div className="flex items-center gap-1">
                                          {Array.from({ length: 5 }).map((_, i) => (
                                            <Star key={i} className={`h-3 w-3 ${i < r.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`} />
                                          ))}
                                        </div>
                                      </div>
                                      {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                                    </div>
                                  ))}
                                </CollapsibleContent>
                              </Collapsible>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Image Preview */}
      <Dialog open={!!imagePreview} onOpenChange={(v) => { if (!v) setImagePreview(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Personalausweis</DialogTitle>
          </DialogHeader>
          {imagePreview && <img src={imagePreview} alt="Ausweis" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
