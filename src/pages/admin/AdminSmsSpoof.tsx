import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Send, Search, Loader2, CheckCircle, XCircle, Trash2, Plus, Info, Eye, History } from "lucide-react";
import { format } from "date-fns";

interface HlrResult {
  number_type: string;
  location: string;
  region_code: string;
  is_valid: boolean;
  formatted_international: string;
  carrier: string;
  time_zones: string[];
}

interface SpoofTemplate {
  id: string;
  label: string;
  sender_name: string;
  message: string;
  created_at: string;
}

interface Employee {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company_name: string | null;
}

interface SpoofLog {
  id: string;
  recipient_phone: string;
  recipient_name: string | null;
  sender_name: string;
  message: string;
  template_id: string | null;
  created_at: string;
}

export default function AdminSmsSpoof() {
  const [to, setTo] = useState("");
  const [senderID, setSenderID] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [hlrLoading, setHlrLoading] = useState(false);
  const [hlrResult, setHlrResult] = useState<HlrResult | null>(null);

  // Templates
  const [templates, setTemplates] = useState<SpoofTemplate[]>([]);
  const [tplLabel, setTplLabel] = useState("");
  const [tplSender, setTplSender] = useState("");
  const [tplMessage, setTplMessage] = useState("");
  const [tplSaving, setTplSaving] = useState(false);

  // Send dialog
  const [selectedTemplate, setSelectedTemplate] = useState<SpoofTemplate | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);

  // Confirmation dialog
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmSending, setConfirmSending] = useState(false);

  // History
  const [logs, setLogs] = useState<SpoofLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [previewLog, setPreviewLog] = useState<SpoofLog | null>(null);

  useEffect(() => {
    fetchTemplates();
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLogsLoading(true);
    const { data } = await supabase
      .from("sms_spoof_logs" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setLogs(data as any);
    setLogsLoading(false);
  };

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from("sms_spoof_templates" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setTemplates(data as any);
  };

  const fetchEmployees = async () => {
    setEmployeesLoading(true);
    const { data } = await supabase
      .from("employment_contracts")
      .select("id, first_name, last_name, phone, application_id")
      .neq("status", "offen")
      .eq("is_suspended", false);

    if (!data || data.length === 0) {
      setEmployees([]);
      setEmployeesLoading(false);
      return;
    }

    // Get application_ids to fetch branding info
    const appIds = data.map((d) => d.application_id).filter(Boolean);
    const { data: apps } = await supabase
      .from("applications")
      .select("id, branding_id")
      .in("id", appIds);

    const brandingIds = (apps || []).map((a) => a.branding_id).filter(Boolean) as string[];
    const { data: brandings } = brandingIds.length > 0
      ? await supabase.from("brandings").select("id, company_name").in("id", brandingIds)
      : { data: [] };

    const brandingMap = new Map((brandings || []).map((b) => [b.id, b.company_name]));
    const appBrandingMap = new Map((apps || []).map((a) => [a.id, a.branding_id]));

    const mapped: Employee[] = data.map((ec) => ({
      id: ec.id,
      first_name: ec.first_name,
      last_name: ec.last_name,
      phone: ec.phone,
      company_name: appBrandingMap.get(ec.application_id)
        ? brandingMap.get(appBrandingMap.get(ec.application_id)!) || null
        : null,
    }));

    setEmployees(mapped);
    setEmployeesLoading(false);
  };

  const resolveVariables = (msg: string, emp: Employee) => {
    return msg
      .replace(/%Vorname%/g, emp.first_name || "")
      .replace(/%Nachname%/g, emp.last_name || "");
  };

  // --- Existing manual send ---
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
        fetchLogs();
      }
    } catch (err) {
      toast({ title: "Senden fehlgeschlagen", description: String(err), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  // --- Templates ---
  const handleSaveTemplate = async () => {
    if (!tplLabel.trim() || !tplSender.trim() || !tplMessage.trim()) {
      toast({ title: "Alle Felder ausfüllen", variant: "destructive" });
      return;
    }
    setTplSaving(true);
    const { error } = await supabase
      .from("sms_spoof_templates" as any)
      .insert({ label: tplLabel.trim(), sender_name: tplSender.trim(), message: tplMessage.trim() } as any);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Template gespeichert!" });
      setTplLabel("");
      setTplSender("");
      setTplMessage("");
      fetchTemplates();
    }
    setTplSaving(false);
  };

  const handleDeleteTemplate = async (id: string) => {
    await supabase.from("sms_spoof_templates" as any).delete().eq("id", id);
    fetchTemplates();
  };

  const handleOpenSendDialog = (tpl: SpoofTemplate) => {
    setSelectedTemplate(tpl);
    setShowEmployeeDialog(true);
    fetchEmployees();
  };

  const handleSelectEmployee = (emp: Employee) => {
    if (!emp.phone) {
      toast({ title: "Keine Telefonnummer hinterlegt", variant: "destructive" });
      return;
    }
    setSelectedEmployee(emp);
    setShowEmployeeDialog(false);
    setShowConfirmDialog(true);
  };

  const handleConfirmSend = async () => {
    if (!selectedTemplate || !selectedEmployee?.phone) return;
    setConfirmSending(true);
    const resolvedText = resolveVariables(selectedTemplate.message, selectedEmployee);
    try {
      const { data, error } = await supabase.functions.invoke("sms-spoof", {
        body: {
          action: "send",
          to: selectedEmployee.phone.replace(/[^0-9]/g, ""),
          senderID: selectedTemplate.sender_name,
          text: resolvedText,
          recipientName: `${selectedEmployee.first_name || ""} ${selectedEmployee.last_name || ""}`.trim(),
          templateId: selectedTemplate.id,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Fehler", description: data.error, variant: "destructive" });
      } else {
        toast({ title: "SMS gesendet!", description: `An ${selectedEmployee.first_name} ${selectedEmployee.last_name}` });
        fetchLogs();
      }
    } catch (err) {
      toast({ title: "Senden fehlgeschlagen", description: String(err), variant: "destructive" });
    } finally {
      setConfirmSending(false);
      setShowConfirmDialog(false);
      setSelectedTemplate(null);
      setSelectedEmployee(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">SMS Spoof</h1>

      {/* Existing manual send card */}
      <Card>
        <CardHeader>
          <CardTitle>Nachricht senden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Empfängernummer (international, z.B. 491234567890)</Label>
            <div className="flex gap-2">
              <Input placeholder="491234567890" value={to} onChange={(e) => setTo(e.target.value)} className="flex-1" />
              <Button variant="outline" size="icon" onClick={handleHlr} disabled={hlrLoading || !to.trim()}>
                {hlrLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>

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
              {hlrResult.formatted_international && <p>Formatiert: {hlrResult.formatted_international}</p>}
              {hlrResult.number_type && <p>Typ: {hlrResult.number_type}</p>}
              {hlrResult.location && <p>Ort: {hlrResult.location}</p>}
              {hlrResult.carrier && <p>Carrier: {hlrResult.carrier}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label>Absendername (max. 11 Zeichen)</Label>
            <Input placeholder="MyBrand" maxLength={11} value={senderID} onChange={(e) => setSenderID(e.target.value)} />
            <p className="text-xs text-muted-foreground text-right">{senderID.length}/11</p>
          </div>

          <div className="space-y-2">
            <Label>Nachricht (max. 160 Zeichen)</Label>
            <Textarea placeholder="Deine Nachricht..." maxLength={160} value={text} onChange={(e) => setText(e.target.value)} rows={4} />
            <p className="text-xs text-muted-foreground text-right">{text.length}/160</p>
          </div>

          <Button onClick={handleSend} disabled={sending || !to.trim() || !senderID.trim() || !text.trim()} className="w-full">
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            SMS senden
          </Button>
        </CardContent>
      </Card>

      {/* Template Creator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" /> Template erstellen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
            <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <div>
              <p className="font-medium text-foreground">Verfügbare Variablen:</p>
              <p className="text-muted-foreground">
                <code className="bg-muted px-1 rounded">%Vorname%</code>{" "}
                <code className="bg-muted px-1 rounded">%Nachname%</code>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Template-Name</Label>
            <Input placeholder="z.B. Willkommensnachricht" value={tplLabel} onChange={(e) => setTplLabel(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Absendername (max. 11 Zeichen)</Label>
            <Input placeholder="MyBrand" maxLength={11} value={tplSender} onChange={(e) => setTplSender(e.target.value)} />
            <p className="text-xs text-muted-foreground text-right">{tplSender.length}/11</p>
          </div>

          <div className="space-y-2">
            <Label>Nachricht (max. 160 Zeichen)</Label>
            <Textarea placeholder="Hallo %Vorname%, wie geht es dir?" maxLength={160} value={tplMessage} onChange={(e) => setTplMessage(e.target.value)} rows={3} />
            <p className="text-xs text-muted-foreground text-right">{tplMessage.length}/160</p>
          </div>

          <Button onClick={handleSaveTemplate} disabled={tplSaving || !tplLabel.trim() || !tplSender.trim() || !tplMessage.trim()} className="w-full">
            {tplSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Template speichern
          </Button>
        </CardContent>
      </Card>

      {/* Saved Templates */}
      {templates.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Gespeicherte Templates</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {templates.map((tpl) => (
              <Card key={tpl.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{tpl.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-1">
                    <p className="text-muted-foreground">Absender: <span className="font-medium text-foreground">{tpl.sender_name}</span></p>
                    <p className="text-muted-foreground text-xs break-all">{tpl.message}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDeleteTemplate(tpl.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Löschen
                    </Button>
                    <Button size="sm" onClick={() => handleOpenSendDialog(tpl)} className="flex-1">
                      <Send className="h-3.5 w-3.5 mr-1" /> SMS senden
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Employee Selection Dialog */}
      <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Mitarbeiter auswählen</DialogTitle>
            <DialogDescription>Wähle einen Mitarbeiter als Empfänger für "{selectedTemplate?.label}"</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            {employeesLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : employees.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Keine Mitarbeiter gefunden.</p>
            ) : (
              <div className="space-y-1">
                {employees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => handleSelectEmployee(emp)}
                    className="w-full text-left px-3 py-2.5 rounded-md hover:bg-accent transition-colors flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-medium text-sm">{emp.first_name} {emp.last_name}</p>
                      {emp.company_name && <p className="text-xs text-muted-foreground">{emp.company_name}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono shrink-0">
                      {emp.phone || "Keine Nr."}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>SMS Vorschau</DialogTitle>
            <DialogDescription>Bestätige den Versand dieser SMS.</DialogDescription>
          </DialogHeader>
          {selectedTemplate && selectedEmployee && (
            <div className="space-y-3">
              <div className="rounded-md border p-3 text-sm space-y-2 bg-muted/30">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Empfänger:</span>
                  <span className="font-medium">{selectedEmployee.first_name} {selectedEmployee.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telefon:</span>
                  <span className="font-mono text-xs">{selectedEmployee.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Absender:</span>
                  <span className="font-medium">{selectedTemplate.sender_name}</span>
                </div>
              </div>
              <div className="rounded-md border p-3 bg-muted/20">
                <p className="text-xs text-muted-foreground mb-1">Nachricht:</p>
                <p className="text-sm whitespace-pre-wrap">{resolveVariables(selectedTemplate.message, selectedEmployee)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Abbrechen</Button>
            <Button onClick={handleConfirmSend} disabled={confirmSending}>
              {confirmSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Senden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> Verlauf
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine SMS gesendet.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Empfänger</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Absender</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">{format(new Date(log.created_at), "dd.MM.yyyy HH:mm")}</TableCell>
                      <TableCell className="text-sm">{log.recipient_name || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{log.recipient_phone}</TableCell>
                      <TableCell className="text-sm">{log.sender_name}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setPreviewLog(log)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Preview Dialog */}
      <Dialog open={!!previewLog} onOpenChange={() => setPreviewLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>SMS Vorschau</DialogTitle>
            <DialogDescription>Details der gesendeten SMS.</DialogDescription>
          </DialogHeader>
          {previewLog && (
            <div className="space-y-3">
              <div className="rounded-md border p-3 text-sm space-y-2 bg-muted/30">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Datum:</span>
                  <span>{format(new Date(previewLog.created_at), "dd.MM.yyyy HH:mm:ss")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Empfänger:</span>
                  <span className="font-medium">{previewLog.recipient_name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telefon:</span>
                  <span className="font-mono text-xs">{previewLog.recipient_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Absender:</span>
                  <span className="font-medium">{previewLog.sender_name}</span>
                </div>
              </div>
              <div className="rounded-md border p-3 bg-muted/20">
                <p className="text-xs text-muted-foreground mb-1">Nachricht:</p>
                <p className="text-sm whitespace-pre-wrap">{previewLog.message}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
