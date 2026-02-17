import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { FileCheck, ChevronLeft, ChevronRight, Eye, CheckCircle, User, Phone, Mail, Building2, CreditCard, Shield, ImageIcon, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const PAGE_SIZE = 20;

export default function AdminArbeitsvertraege() {
  const [page, setPage] = useState(0);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch all interview_appointments with status=erfolgreich + their contracts
  const { data, isLoading } = useQuery({
    queryKey: ["arbeitsvertraege", page],
    queryFn: async () => {
      // Get successful interviews with application data
      const { data: appointments, error, count } = await supabase
        .from("interview_appointments")
        .select("*, applications(id, first_name, last_name, email, phone, brandings(company_name))", { count: "exact" })
        .eq("status", "erfolgreich")
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (error) throw error;

      // Get contracts for these application IDs
      const appIds = (appointments || []).map((a: any) => a.applications?.id).filter(Boolean);
      let contracts: any[] = [];
      if (appIds.length > 0) {
        const { data: c } = await supabase
          .from("employment_contracts")
          .select("*")
          .in("application_id", appIds);
        contracts = c || [];
      }

      const items = (appointments || []).map((apt: any) => {
        const contract = contracts.find((c: any) => c.application_id === apt.applications?.id);
        return { ...apt, contract };
      });

      return { items, total: count || 0 };
    },
  });

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  const handleApprove = async (contractId: string) => {
    try {
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
        return <Badge className="bg-yellow-500 text-white border-yellow-500">Daten eingereicht</Badge>;
      case "genehmigt":
        return <Badge className="bg-green-600 text-white border-green-600">Genehmigt</Badge>;
      case "unterzeichnet":
        return <Badge className="bg-blue-600 text-white border-blue-600">Unterzeichnet</Badge>;
      default:
        return <Badge variant="outline">Offen</Badge>;
    }
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

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Arbeitsverträge</h2>
        <p className="text-muted-foreground mt-1">Bewerber mit erfolgreichem Bewerbungsgespräch.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laden...</div>
        ) : !data?.items.length ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <FileCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Keine erfolgreichen Bewerbungsgespräche vorhanden.</p>
          </div>
        ) : (
          <>
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Branding</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Vertragsstatus</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.applications?.first_name} {item.applications?.last_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.applications?.phone || "–"}</TableCell>
                      <TableCell className="text-muted-foreground">{item.applications?.email}</TableCell>
                      <TableCell className="text-muted-foreground">{item.applications?.brandings?.company_name || "–"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            const url = `${window.location.origin}/arbeitsvertrag/${item.applications?.id}`;
                            navigator.clipboard.writeText(url);
                            toast.success("Link kopiert!");
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>{statusBadge(item.contract)}</TableCell>
                      <TableCell>
                        {item.contract?.status === "eingereicht" || item.contract?.status === "genehmigt" ? (
                          <Button variant="outline" size="sm" onClick={() => openDetails(item.contract)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Daten ansehen
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Warten auf Daten</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">Seite {page + 1} von {totalPages} ({data.total} Einträge)</p>
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
          </>
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
              {/* Personal */}
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

              {/* Tax */}
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

              {/* Bank */}
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

              {/* ID Documents */}
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Schließen</Button>
            {selectedContract?.status === "eingereicht" && (
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(selectedContract.id)}>
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
    </>
  );
}
