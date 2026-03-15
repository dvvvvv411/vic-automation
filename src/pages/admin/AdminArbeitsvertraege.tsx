import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildBrandingUrl } from "@/lib/buildBrandingUrl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FileCheck, ChevronLeft, ChevronRight, Eye, CheckCircle, User, Phone, Mail, Building2, CreditCard, Shield, ImageIcon, Copy, CalendarIcon } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { de } from "date-fns/locale/de";
import { useBrandingFilter } from "@/hooks/useBrandingFilter";

const PAGE_SIZE = 20;

type TabValue = "all" | "offen" | "eingereicht" | "genehmigt" | "unterzeichnet";

export default function AdminArbeitsvertraege() {
  const [page, setPage] = useState(0);
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [startDateDialogOpen, setStartDateDialogOpen] = useState(false);
  const [confirmedStartDate, setConfirmedStartDate] = useState<Date | undefined>(undefined);
  const queryClient = useQueryClient();
  const { brandingIds, ready } = useBrandingFilter();

  const { data, isLoading } = useQuery({
    queryKey: ["arbeitsvertraege", brandingIds],
    enabled: ready,
    queryFn: async () => {
      const { data: appointments, error } = await supabase
        .from("interview_appointments")
        .select("*, applications(id, first_name, last_name, email, phone, branding_id, brandings(id, company_name))")
        .eq("status", "erfolgreich")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const appIds = (appointments || []).map((a: any) => a.applications?.id).filter(Boolean);
      let contracts: any[] = [];
      if (appIds.length > 0) {
        const { data: c } = await supabase
          .from("employment_contracts")
          .select("*")
          .in("application_id", appIds);
        contracts = c || [];
      }

      return (appointments || []).map((apt: any) => {
        const contract = contracts.find((c: any) => c.application_id === apt.applications?.id);
        return { ...apt, contract };
      });
    },
  });

  // Counts per status
  const counts = useMemo(() => {
    if (!data) return { all: 0, offen: 0, eingereicht: 0, genehmigt: 0, unterzeichnet: 0 };
    const c = { all: data.length, offen: 0, eingereicht: 0, genehmigt: 0, unterzeichnet: 0 };
    data.forEach((item: any) => {
      const s = item.contract?.status;
      if (s === "eingereicht") c.eingereicht++;
      else if (s === "genehmigt") c.genehmigt++;
      else if (s === "unterzeichnet") c.unterzeichnet++;
      else c.offen++;
    });
    return c;
  }, [data]);

  const sortedItems = useMemo(() => {
    if (!data) return [];
    const statusOrder: Record<string, number> = { unterzeichnet: 0, genehmigt: 1, eingereicht: 2 };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filtered = activeTab === "all"
      ? data
      : data.filter((item: any) => {
          const s = item.contract?.status;
          if (activeTab === "offen") return !s || s === "offen";
          return s === activeTab;
        });

    return [...filtered].sort((a, b) => {
      const rankA = statusOrder[a.contract?.status] ?? 3;
      const rankB = statusOrder[b.contract?.status] ?? 3;
      if (rankA !== rankB) return rankA - rankB;

      const dateA = a.contract?.desired_start_date ? new Date(a.contract.desired_start_date + "T00:00:00") : null;
      const dateB = b.contract?.desired_start_date ? new Date(b.contract.desired_start_date + "T00:00:00") : null;

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      const futureA = dateA >= today;
      const futureB = dateB >= today;
      if (futureA && !futureB) return -1;
      if (!futureA && futureB) return 1;
      if (futureA && futureB) return dateA.getTime() - dateB.getTime();
      return dateB.getTime() - dateA.getTime();
    });
  }, [data, activeTab]);

  const paginatedItems = sortedItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sortedItems.length / PAGE_SIZE);

  const handleTabChange = (val: string) => {
    setActiveTab(val as TabValue);
    setPage(0);
  };

  const openStartDateDialog = (contract: any) => {
    const dateStr = contract.desired_start_date;
    const parsed = dateStr ? new Date(dateStr + "T00:00:00") : undefined;
    setConfirmedStartDate(parsed);
    setStartDateDialogOpen(true);
  };

  const handleApprove = async (contractId: string) => {
    try {
      if (confirmedStartDate) {
        const formatted = format(confirmedStartDate, "yyyy-MM-dd");
        const { error: updateError } = await supabase
          .from("employment_contracts")
          .update({ desired_start_date: formatted })
          .eq("id", contractId);
        if (updateError) {
          toast.error("Fehler beim Aktualisieren des Startdatums.");
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        "https://luorlnagxpsibarcygjm.supabase.co/functions/v1/create-employee-account",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1b3JsbmFneHBzaWJhcmN5Z2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDI3MTAsImV4cCI6MjA4NjM3ODcxMH0.B0MYZqUChRbyW3ekOR8YI4j7q153ME77qI_LjUUJTqs",
          },
          body: JSON.stringify({ contract_id: contractId }),
        }
      );
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Fehler beim Genehmigen.");
        return;
      }
      toast.success(`Genehmigt! Temporäres Passwort: ${result.temp_password}`, { duration: 15000 });
      setStartDateDialogOpen(false);
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["arbeitsvertraege"] });
    } catch {
      toast.error("Fehler beim Genehmigen.");
    }
  };

  const statusBadge = (contract: any) => {
    if (!contract) return <Badge variant="outline">Offen</Badge>;
    switch (contract.status) {
      case "eingereicht":
        return <Badge className="bg-yellow-500 text-white border-yellow-500">Eingereicht</Badge>;
      case "genehmigt":
        return <Badge className="bg-green-600 text-white border-green-600">Genehmigt</Badge>;
      case "unterzeichnet":
        return <Badge className="bg-blue-600 text-white border-blue-600">Unterzeichnet</Badge>;
      default:
        return <Badge variant="outline">Offen</Badge>;
    }
  };

  const getInitials = (first?: string, last?: string) => {
    return `${(first || "?")[0]}${(last || "?")[0]}`.toUpperCase();
  };

  const openDetails = (contract: any) => {
    setSelectedContract(contract);
    setDialogOpen(true);
  };

  const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value || "–"}</span>
    </div>
  );

  const TabBadge = ({ count }: { count: number }) => (
    <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground min-w-[22px]">
      {count}
    </span>
  );

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Arbeitsverträge</h2>
        <p className="text-muted-foreground mt-1">Bewerber mit erfolgreichem Bewerbungsgespräch.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laden...</div>
        ) : !data?.length ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <FileCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Keine erfolgreichen Bewerbungsgespräche vorhanden.</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-6 bg-muted/50 p-1">
              <TabsTrigger value="all">Alle<TabBadge count={counts.all} /></TabsTrigger>
              <TabsTrigger value="offen">Offen<TabBadge count={counts.offen} /></TabsTrigger>
              <TabsTrigger value="eingereicht">Eingereicht<TabBadge count={counts.eingereicht} /></TabsTrigger>
              <TabsTrigger value="genehmigt">Genehmigt<TabBadge count={counts.genehmigt} /></TabsTrigger>
              <TabsTrigger value="unterzeichnet">Unterzeichnet<TabBadge count={counts.unterzeichnet} /></TabsTrigger>
            </TabsList>

            {/* Single content area for all tabs since filtering is done via sortedItems */}
            <div className="space-y-3">
              {paginatedItems.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-lg">
                  <p className="text-muted-foreground">Keine Einträge in dieser Kategorie.</p>
                </div>
              ) : (
                paginatedItems.map((item: any, i: number) => {
                  const firstName = item.applications?.first_name || "";
                  const lastName = item.applications?.last_name || "";
                  const email = item.applications?.email || "";
                  const phone = item.applications?.phone || "";
                  const branding = item.applications?.brandings?.company_name || "";
                  const startDate = item.contract?.desired_start_date
                    ? format(new Date(item.contract.desired_start_date + "T00:00:00"), "dd. MMM yyyy", { locale: de })
                    : null;
                  const hasData = item.contract?.status === "eingereicht" || item.contract?.status === "genehmigt" || item.contract?.status === "unterzeichnet";

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="premium-card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0 h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                        {getInitials(firstName, lastName)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground truncate">{firstName} {lastName}</span>
                          {statusBadge(item.contract)}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                          {email && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="h-3.5 w-3.5" />{email}
                            </span>
                          )}
                          {phone && (
                            <span
                              className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors"
                              onClick={() => { navigator.clipboard.writeText(phone); toast.success("Telefonnummer kopiert!"); }}
                            >
                              <Phone className="h-3.5 w-3.5" />{phone}
                            </span>
                          )}
                          {branding && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />{branding}
                            </span>
                          )}
                          {startDate && (
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="h-3.5 w-3.5" />{startDate}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={async () => {
                                const brandingId = item.applications?.brandings?.id;
                                const url = await buildBrandingUrl(brandingId, `/arbeitsvertrag/${item.applications?.id}`);
                                navigator.clipboard.writeText(url);
                                toast.success("Link kopiert!");
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Link kopieren</TooltipContent>
                        </Tooltip>

                        {hasData ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetails(item.contract)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Daten ansehen</TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-xs text-muted-foreground px-2">Warten auf Daten</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">Seite {page + 1} von {totalPages} ({sortedItems.length} Einträge)</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Zurück
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                    Weiter <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </Tabs>
        )}
      </motion.div>

      {/* Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Eingereichte Vertragsdaten</DialogTitle>
            <DialogDescription>Übersicht der vom Bewerber eingereichten Informationen.</DialogDescription>
          </DialogHeader>

          {selectedContract && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-sm">Persönliche Informationen</h4>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <InfoRow label="Vorname" value={selectedContract.first_name} />
                  <InfoRow label="Nachname" value={selectedContract.last_name} />
                  <InfoRow label="E-Mail" value={selectedContract.email} />
                  <InfoRow label="Telefon" value={selectedContract.phone} />
                  <InfoRow label="Geburtsdatum" value={selectedContract.birth_date} />
                  <InfoRow label="Geburtsort" value={selectedContract.birth_place} />
                  <InfoRow label="Nationalität" value={selectedContract.nationality} />
                  <InfoRow label="Straße" value={selectedContract.street} />
                  <InfoRow label="PLZ & Stadt" value={`${selectedContract.zip_code || ""} ${selectedContract.city || ""}`} />
                  <InfoRow label="Familienstand" value={selectedContract.marital_status} />
                  <InfoRow label="Art der Beschäftigung" value={selectedContract.employment_type} />
                  <InfoRow label="Gewünschtes Startdatum" value={selectedContract.desired_start_date} />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-sm">Steuerliche Angaben</h4>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <InfoRow label="Sozialversicherungsnr." value={selectedContract.social_security_number} />
                  <InfoRow label="Steuer-ID" value={selectedContract.tax_id} />
                  <InfoRow label="Krankenversicherung" value={selectedContract.health_insurance} />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-sm">Bankverbindung</h4>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <InfoRow label="IBAN" value={selectedContract.iban} />
                  <InfoRow label="BIC" value={selectedContract.bic} />
                  <InfoRow label="Bank" value={selectedContract.bank_name} />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-sm">Ausweisdokumente</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {selectedContract.id_front_url && (
                    <div className="cursor-pointer" onClick={() => setImagePreview(selectedContract.id_front_url)}>
                      <p className="text-xs text-muted-foreground mb-1">Vorderseite</p>
                      <img src={selectedContract.id_front_url} alt="Ausweis Vorderseite" className="rounded-lg border border-border w-full h-32 object-cover hover:opacity-80 transition-opacity" />
                    </div>
                  )}
                  {selectedContract.id_back_url && (
                    <div className="cursor-pointer" onClick={() => setImagePreview(selectedContract.id_back_url)}>
                      <p className="text-xs text-muted-foreground mb-1">Rückseite</p>
                      <img src={selectedContract.id_back_url} alt="Ausweis Rückseite" className="rounded-lg border border-border w-full h-32 object-cover hover:opacity-80 transition-opacity" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                const c = selectedContract;
                if (!c) return;
                const birthParts = c.birth_date?.split("-");
                const birthFormatted = birthParts?.length === 3 ? `${birthParts[2]}.${birthParts[1]}.${birthParts[0]}` : (c.birth_date || "–");
                const address = `${c.street || ""}${c.street ? ", " : ""}${c.zip_code || ""} ${c.city || ""}`.trim() || "–";
                const text = `Vorname: ${c.first_name || ""} ${c.last_name || ""}\n\nGeburtsdatum: ${birthFormatted}\n\nGeburtsort: ${c.birth_place || "–"}\n\nAdresse: ${address}\n\nFamilienstand: ${c.marital_status || "–"}\n\nStaatsangehörigkeit: ${c.nationality || "–"}`;
                navigator.clipboard.writeText(text);
                toast.success("Daten kopiert!");
              }}
            >
              <Copy className="h-4 w-4 mr-1" /> Daten kopieren
            </Button>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Schließen</Button>
            {selectedContract?.status === "eingereicht" && (
              <Button className="bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md transition-all" onClick={() => openStartDateDialog(selectedContract)}>
                <CheckCircle className="h-4 w-4 mr-1" /> Genehmigen
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Dokumentenvorschau</DialogTitle>
            <DialogDescription>Klicken Sie außerhalb zum Schließen.</DialogDescription>
          </DialogHeader>
          {imagePreview && (
            <img src={imagePreview} alt="Dokumentenvorschau" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>

      {/* Start Date Confirmation Dialog */}
      <Dialog open={startDateDialogOpen} onOpenChange={setStartDateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Startdatum bestätigen</DialogTitle>
            <DialogDescription>
              Bitte bestätigen oder ändern Sie das gewünschte Startdatum des Mitarbeiters.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            <div className="text-sm text-muted-foreground">
              Gewähltes Datum:{" "}
              <span className="font-semibold text-foreground">
                {confirmedStartDate ? format(confirmedStartDate, "dd. MMMM yyyy", { locale: de }) : "Kein Datum"}
              </span>
            </div>
            <Calendar
              mode="single"
              selected={confirmedStartDate}
              onSelect={setConfirmedStartDate}
              locale={de}
              className="rounded-md border pointer-events-auto"
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setStartDateDialogOpen(false)}>Abbrechen</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md transition-all"
              disabled={!confirmedStartDate}
              onClick={() => selectedContract && handleApprove(selectedContract.id)}
            >
              <CheckCircle className="h-4 w-4 mr-1" /> Genehmigen & bestätigen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
