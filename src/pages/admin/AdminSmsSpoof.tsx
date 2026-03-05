import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { Send, Search, Loader2, CheckCircle, XCircle, Pencil, Plus, Info, Eye, History, MessageSquare, Zap, Trash2 } from "lucide-react";
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
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Send dialog
  const [selectedTemplate, setSelectedTemplate] = useState<SpoofTemplate | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);

  // Confirmation dialog
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmSending, setConfirmSending] = useState(false);

  // Edit template
  const [editTemplate, setEditTemplate] = useState<SpoofTemplate | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editSender, setEditSender] = useState("");
  const [editMessage, setEditMessage] = useState("");

  // Employee search
  const [employeeSearch, setEmployeeSearch] = useState("");

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
      setShowCreateDialog(false);
      fetchTemplates();
    }
    setTplSaving(false);
  };

  const handleDeleteTemplate = async (id: string) => {
    await supabase.from("sms_spoof_templates" as any).delete().eq("id", id);
    setEditTemplate(null);
    fetchTemplates();
  };

  const handleOpenEdit = (tpl: SpoofTemplate) => {
    setEditTemplate(tpl);
    setEditLabel(tpl.label);
    setEditSender(tpl.sender_name);
    setEditMessage(tpl.message);
  };

  const handleUpdateTemplate = async () => {
    if (!editTemplate || !editLabel.trim() || !editSender.trim() || !editMessage.trim()) return;
    const { error } = await supabase
      .from("sms_spoof_templates" as any)
      .update({ label: editLabel.trim(), sender_name: editSender.trim(), message: editMessage.trim() } as any)
      .eq("id", editTemplate.id);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Template aktualisiert!" });
      setEditTemplate(null);
      fetchTemplates();
    }
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
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SMS Spoof</h1>
            <p className="text-sm text-muted-foreground">Versende SMS mit benutzerdefiniertem Absendernamen</p>
          </div>
        </div>
      </div>

      {/* Templates Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Templates</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Add Template Card - always first */}
          <button
            onClick={() => setShowCreateDialog(true)}
            className="group flex flex-col items-center justify-center min-h-[160px] rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
              <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="mt-2 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
              Neues Template
            </span>
          </button>

          {templates.map((tpl) => (
            <Card key={tpl.id} className="group relative overflow-hidden transition-all hover:shadow-md hover:border-primary/30">
              <CardContent className="p-4 flex flex-col h-full min-h-[160px]">
                <div className="flex-1 space-y-2">
                  <p className="font-semibold text-sm leading-tight line-clamp-2">{tpl.label}</p>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {tpl.sender_name}
                  </Badge>
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{tpl.message}</p>
                </div>
                <div className="flex gap-1.5 pt-3 mt-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(tpl)}
                    className="h-7 px-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleOpenSendDialog(tpl)}
                    className="h-7 flex-1 text-xs"
                  >
                    <Send className="h-3 w-3 mr-1" /> Senden
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Send & History 50/50 Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Send Form */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4 text-primary" /> Nachricht senden
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Empfängernummer (international)</Label>
              <div className="flex gap-2">
                <Input placeholder="491234567890" value={to} onChange={(e) => setTo(e.target.value)} className="flex-1" />
                <Button variant="outline" size="icon" onClick={handleHlr} disabled={hlrLoading || !to.trim()}>
                  {hlrLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {hlrResult && (
              <div className="rounded-lg border p-3 text-sm space-y-1 bg-muted/30">
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
              <Label className="text-xs">Absendername (max. 11 Zeichen)</Label>
              <Input placeholder="MyBrand" maxLength={11} value={senderID} onChange={(e) => setSenderID(e.target.value)} />
              <p className="text-[10px] text-muted-foreground text-right">{senderID.length}/11</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Nachricht (max. 160 Zeichen)</Label>
              <Textarea placeholder="Deine Nachricht..." maxLength={160} value={text} onChange={(e) => setText(e.target.value)} rows={3} />
              <p className="text-[10px] text-muted-foreground text-right">{text.length}/160</p>
            </div>

            <Button onClick={handleSend} disabled={sending || !to.trim() || !senderID.trim() || !text.trim()} className="w-full">
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              SMS senden
            </Button>
          </CardContent>
        </Card>

        {/* Right: History */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-primary" /> Verlauf
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                  <History className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Noch keine SMS gesendet.</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-auto max-h-[420px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Datum</TableHead>
                      <TableHead className="text-xs">Empfänger</TableHead>
                      <TableHead className="text-xs">Absender</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-[11px] text-muted-foreground">{format(new Date(log.created_at), "dd.MM.yy HH:mm")}</TableCell>
                        <TableCell>
                          <p className="text-xs font-medium">{log.recipient_name || "—"}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">{log.recipient_phone}</p>
                        </TableCell>
                        <TableCell className="text-xs">{log.sender_name}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewLog(log)}>
                            <Eye className="h-3.5 w-3.5" />
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
      </div>

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neues Template erstellen</DialogTitle>
            <DialogDescription>Erstelle ein wiederverwendbares SMS-Template mit Variablen.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <div>
                <p className="font-medium text-foreground text-xs">Verfügbare Variablen:</p>
                <p className="text-muted-foreground text-xs">
                  <code className="bg-muted px-1 rounded">%Vorname%</code>{" "}
                  <code className="bg-muted px-1 rounded">%Nachname%</code>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Template-Name</Label>
              <Input placeholder="z.B. Willkommensnachricht" value={tplLabel} onChange={(e) => setTplLabel(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Absendername (max. 11 Zeichen)</Label>
              <Input placeholder="MyBrand" maxLength={11} value={tplSender} onChange={(e) => setTplSender(e.target.value)} />
              <p className="text-[10px] text-muted-foreground text-right">{tplSender.length}/11</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Nachricht (max. 160 Zeichen)</Label>
              <Textarea placeholder="Hallo %Vorname%, wie geht es dir?" maxLength={160} value={tplMessage} onChange={(e) => setTplMessage(e.target.value)} rows={3} />
              <p className="text-[10px] text-muted-foreground text-right">{tplMessage.length}/160</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Abbrechen</Button>
            <Button onClick={handleSaveTemplate} disabled={tplSaving || !tplLabel.trim() || !tplSender.trim() || !tplMessage.trim()}>
              {tplSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={!!editTemplate} onOpenChange={(open) => { if (!open) setEditTemplate(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Template bearbeiten</DialogTitle>
            <DialogDescription>Bearbeite die Werte dieses Templates.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Template-Name</Label>
              <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Absendername (max. 11 Zeichen)</Label>
              <Input maxLength={11} value={editSender} onChange={(e) => setEditSender(e.target.value)} />
              <p className="text-[10px] text-muted-foreground text-right">{editSender.length}/11</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Nachricht (max. 160 Zeichen)</Label>
              <Textarea maxLength={160} value={editMessage} onChange={(e) => setEditMessage(e.target.value)} rows={3} />
              <p className="text-[10px] text-muted-foreground text-right">{editMessage.length}/160</p>
            </div>
          </div>
          <DialogFooter className="flex !justify-between">
            <Button
              variant="destructive"
              onClick={() => editTemplate && handleDeleteTemplate(editTemplate.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Löschen
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditTemplate(null)}>Abbrechen</Button>
              <Button onClick={handleUpdateTemplate} disabled={!editLabel.trim() || !editSender.trim() || !editMessage.trim()}>
                Speichern
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee Selection Dialog */}
      <Dialog open={showEmployeeDialog} onOpenChange={(open) => { setShowEmployeeDialog(open); if (!open) setEmployeeSearch(""); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Mitarbeiter auswählen</DialogTitle>
            <DialogDescription>Wähle einen Mitarbeiter als Empfänger für "{selectedTemplate?.label}"</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Mitarbeiter suchen..."
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="overflow-y-auto max-h-[400px] -mx-6 px-6">
            {employeesLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (() => {
              const filtered = employees.filter((emp) => {
                if (!employeeSearch.trim()) return true;
                const name = `${emp.first_name || ""} ${emp.last_name || ""}`.toLowerCase();
                return name.includes(employeeSearch.toLowerCase());
              });
              return filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Keine Mitarbeiter gefunden.</p>
              ) : (
                <div className="space-y-1">
                  {filtered.map((emp) => (
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
              );
            })()}
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
              <div className="rounded-lg border p-3 text-sm space-y-2 bg-muted/30">
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
              <div className="rounded-lg border p-3 bg-muted/20">
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

      {/* Log Preview Dialog */}
      <Dialog open={!!previewLog} onOpenChange={() => setPreviewLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>SMS Vorschau</DialogTitle>
            <DialogDescription>Details der gesendeten SMS.</DialogDescription>
          </DialogHeader>
          {previewLog && (
            <div className="space-y-3">
              <div className="rounded-lg border p-3 text-sm space-y-2 bg-muted/30">
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
              <div className="rounded-lg border p-3 bg-muted/20">
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
