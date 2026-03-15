import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { CalendarIcon, Check, CheckCircle2, ChevronLeft, ChevronRight, ChevronsUpDown, Upload, X } from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { sendTelegram } from "@/lib/sendTelegram";

const NATIONALITIES = [
  "Deutsch",
  "Afghanisch", "Ägyptisch", "Albanisch", "Algerisch", "Amerikanisch", "Andorranisch", "Angolanisch",
  "Argentinisch", "Armenisch", "Aserbaidschanisch", "Äthiopisch", "Australisch",
  "Bahamesisch", "Bahrainisch", "Bangladeschisch", "Belgisch", "Beninisch", "Bhutanisch",
  "Bolivianisch", "Bosnisch-herzegowinisch", "Botsuanisch", "Brasilianisch", "Britisch",
  "Bruneiisch", "Bulgarisch", "Burkinisch", "Burundisch",
  "Chilenisch", "Chinesisch", "Costa-ricanisch", "Dänisch", "Dominikanisch",
  "Dschibutisch", "Ecuadorianisch", "Eritreisch", "Estnisch",
  "Fidschi", "Finnisch", "Französisch",
  "Gabunisch", "Gambisch", "Georgisch", "Ghanaisch", "Grenadisch", "Griechisch",
  "Guatemaltekisch", "Guineisch", "Guyanisch",
  "Haitianisch", "Honduranisch",
  "Indisch", "Indonesisch", "Irakisch", "Iranisch", "Irisch", "Isländisch", "Israelisch",
  "Italienisch", "Ivorisch",
  "Jamaikanisch", "Japanisch", "Jemenitisch", "Jordanisch",
  "Kambodschanisch", "Kamerunisch", "Kanadisch", "Kapverdisch", "Kasachisch", "Katarisch",
  "Kenianisch", "Kirgisisch", "Kolumbianisch", "Komorisch", "Kongolesisch",
  "Kosovarisch", "Kroatisch", "Kubanisch", "Kuwaitisch",
  "Laotisch", "Lesothisch", "Lettisch", "Libanesisch", "Liberianisch", "Libysch",
  "Liechtensteinisch", "Litauisch", "Luxemburgisch",
  "Madagassisch", "Malawisch", "Malaysisch", "Maledivisch", "Malisch", "Maltesisch",
  "Marokkanisch", "Mauretanisch", "Mauritisch", "Mexikanisch", "Moldauisch",
  "Monegassisch", "Mongolisch", "Montenegrinisch", "Mosambikanisch", "Myanmarisch",
  "Namibisch", "Nepalesisch", "Neuseeländisch", "Nicaraguanisch", "Niederländisch",
  "Nigerianisch", "Nigrisch", "Nordkoreanisch", "Nordmazedonisch", "Norwegisch",
  "Omanisch", "Österreichisch",
  "Pakistanisch", "Palästinensisch", "Panamaisch", "Papua-neuguineisch", "Paraguayisch",
  "Peruanisch", "Philippinisch", "Polnisch", "Portugiesisch",
  "Ruandisch", "Rumänisch", "Russisch",
  "Salvadorianisch", "Sambisch", "Samoanisch", "Saudi-arabisch", "Schwedisch",
  "Schweizerisch", "Senegalesisch", "Serbisch", "Sierra-leonisch", "Simbabwisch",
  "Singapurisch", "Slowakisch", "Slowenisch", "Somalisch", "Spanisch",
  "Sri-lankisch", "Südafrikanisch", "Sudanesisch", "Südkoreanisch", "Surinamisch",
  "Syrisch",
  "Tadschikisch", "Taiwanesisch", "Tansanisch", "Thailändisch", "Togoisch",
  "Tongaisch", "Tschadisch", "Tschechisch", "Tunesisch", "Türkisch",
  "Turkmenisch", "Tuvaluisch",
  "Ugandisch", "Ukrainisch", "Ungarisch", "Uruguayisch", "Usbekisch",
  "Vanuatuisch", "Vatikanisch", "Venezolanisch", "Vietnamesisch",
  "Weißrussisch",
  "Zentralafrikanisch", "Zyprisch",
];

const STEPS = [
  "Persönliche Informationen",
  "Steuerliche Angaben",
  "Bankverbindung",
  "Ausweisdokumente",
  "Zusammenfassung",
];

interface ContextType {
  contract: { id: string; first_name: string | null; application_id: string | null } | null;
  branding: { brand_color: string | null } | null;
  loading: boolean;
}

export default function MitarbeiterArbeitsvertrag() {
  const { contract } = useOutletContext<ContextType>();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    birth_date: "",
    birth_place: "", nationality: "",
    street: "", zip_code: "", city: "",
    marital_status: "", employment_type: "",
    desired_start_date: null as Date | null,
    social_security_number: "", tax_id: "", health_insurance: "",
    iban: "", bic: "", bank_name: "",
  });

  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
  const [nationalityOpen, setNationalityOpen] = useState(false);

  // Pre-fill from contract data
  useEffect(() => {
    if (!contract) {
      setLoadingData(false);
      return;
    }

    const fetchContract = async () => {
      const { data } = await supabase
        .from("employment_contracts")
        .select("first_name, last_name, email, phone, submitted_at")
        .eq("id", contract.id)
        .maybeSingle();

      if (data?.submitted_at) {
        setAlreadySubmitted(true);
      } else if (data) {
        setForm(prev => ({
          ...prev,
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
        }));
      }
      setLoadingData(false);
    };

    fetchContract();
  }, [contract]);

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground text-sm">Laden...</div>
      </div>
    );
  }

  if (alreadySubmitted || submitted) {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <div className="bg-background rounded-xl border border-border shadow-sm p-8 text-center space-y-4">
          <CheckCircle2 className="h-10 w-10 mx-auto text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Daten erfolgreich eingereicht</h2>
          <p className="text-sm text-muted-foreground">
            Deine Arbeitsvertragsdaten wurden erfolgreich übermittelt. Wir werden uns in Kürze bei dir melden.
          </p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <div className="bg-background rounded-xl border border-border shadow-sm p-8 text-center">
          <p className="text-sm text-muted-foreground">Kein Vertrag gefunden.</p>
        </div>
      </div>
    );
  }

  const updateForm = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const isStepValid = () => {
    if (step === 0) {
      const bdMatch = form.birth_date.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
      const bdValid = bdMatch ? !isNaN(new Date(`${bdMatch[3]}-${bdMatch[2]}-${bdMatch[1]}`).getTime()) : false;
      return form.first_name && form.last_name && form.email && form.phone && bdValid && form.birth_place && form.nationality && form.street && form.zip_code && form.city && form.marital_status && form.employment_type && form.desired_start_date;
    }
    if (step === 1) return form.social_security_number && form.tax_id && form.health_insurance;
    if (step === 2) return form.iban && form.bic && form.bank_name;
    if (step === 3) return idFrontFile && idBackFile;
    return true;
  };

  const handleFileChange = (side: "front" | "back", file: File | null) => {
    if (!file) return;
    if (side === "front") {
      setIdFrontFile(file);
      setIdFrontPreview(URL.createObjectURL(file));
    } else {
      setIdBackFile(file);
      setIdBackPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const uploadFile = async (file: File, prefix: string) => {
        const ext = file.name.split(".").pop();
        const path = `${contract.id}/${prefix}-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("contract-documents").upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("contract-documents").getPublicUrl(path);
        return urlData.publicUrl;
      };

      const frontUrl = await uploadFile(idFrontFile!, "front");
      const backUrl = await uploadFile(idBackFile!, "back");

      const { error: rpcError } = await supabase.rpc("submit_employment_contract", {
        _contract_id: contract.id,
        _first_name: form.first_name,
        _last_name: form.last_name,
        _email: form.email,
        _phone: form.phone,
        _birth_date: (() => { const p = form.birth_date.match(/^(\d{2})\.(\d{2})\.(\d{4})$/); return p ? `${p[3]}-${p[2]}-${p[1]}` : ""; })(),
        _birth_place: form.birth_place,
        _nationality: form.nationality,
        _street: form.street,
        _zip_code: form.zip_code,
        _city: form.city,
        _marital_status: form.marital_status,
        _employment_type: form.employment_type,
        _desired_start_date: format(form.desired_start_date!, "yyyy-MM-dd"),
        _social_security_number: form.social_security_number,
        _tax_id: form.tax_id,
        _health_insurance: form.health_insurance,
        _iban: form.iban,
        _bic: form.bic,
        _bank_name: form.bank_name,
        _id_front_url: frontUrl,
        _id_back_url: backUrl,
      } as any);

      if (rpcError) throw rpcError;

      await sendTelegram("vertrag_eingereicht", `📋 Arbeitsvertrag eingereicht\n\nName: ${form.first_name} ${form.last_name}`);

      setSubmitted(true);
      toast.success("Daten erfolgreich eingereicht!");
    } catch (err: any) {
      toast.error("Fehler beim Einreichen: " + (err.message || "Unbekannter Fehler"));
    } finally {
      setSubmitting(false);
    }
  };

  const employmentLabels: Record<string, string> = {
    minijob: "Minijob", teilzeit: "Teilzeit", vollzeit: "Vollzeit",
  };

  const DatePickerField = ({ label, value, onChange, disablePast = false }: {
    label: string; value: Date | null; onChange: (d: Date | undefined) => void;
    disablePast?: boolean;
  }) => (
    <div className="space-y-2">
      <Label>{label} <span className="text-destructive">*</span></Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", value ? "border-green-500" : "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "dd.MM.yyyy") : "Datum wählen"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value || undefined}
            onSelect={onChange}
            disabled={(date) => disablePast && isBefore(date, startOfDay(new Date()))}
            locale={de}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Stepper */}
        <div className="p-6 pb-4">
          <div className="flex items-center mb-6">
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors shrink-0",
                    i <= step ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 text-muted-foreground bg-background"
                  )}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("h-0.5 flex-1 mx-1", i < step ? "bg-primary" : "bg-border")} />
                )}
              </React.Fragment>
            ))}
          </div>
          <h2 className="text-xl font-semibold text-foreground">{STEPS[step]}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {step === 2 ? "Bitte gib deine Bankverbindung für die Gehaltsauszahlung an." : step < 4 ? "Bitte fülle alle Pflichtfelder aus." : "Bitte überprüfe deine Angaben."}
          </p>
        </div>

        <div className="border-t border-border mx-6" />

        <div className="p-6 space-y-4">
          {/* Step 1: Personal */}
          {step === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vorname <span className="text-destructive">*</span></Label>
                <Input className={cn(form.first_name.trim() && "border-green-500")} value={form.first_name} onChange={e => updateForm("first_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Nachname <span className="text-destructive">*</span></Label>
                <Input className={cn(form.last_name.trim() && "border-green-500")} value={form.last_name} onChange={e => updateForm("last_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>E-Mail <span className="text-destructive">*</span></Label>
                <Input className={cn(form.email.trim() && "border-green-500")} type="email" value={form.email} onChange={e => updateForm("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Telefon <span className="text-destructive">*</span></Label>
                <Input className={cn(form.phone.trim() && "border-green-500")} type="tel" value={form.phone} onChange={e => updateForm("phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Geburtsdatum <span className="text-destructive">*</span></Label>
                <Input
                  className={cn(/^\d{2}\.\d{2}\.\d{4}$/.test(form.birth_date) && "border-green-500")}
                  placeholder="TT.MM.JJJJ"
                  maxLength={10}
                  value={form.birth_date}
                  onChange={e => {
                    let v = e.target.value.replace(/[^\d.]/g, "");
                    const digits = v.replace(/\./g, "");
                    if (digits.length >= 5) v = digits.slice(0, 2) + "." + digits.slice(2, 4) + "." + digits.slice(4, 8);
                    else if (digits.length >= 3) v = digits.slice(0, 2) + "." + digits.slice(2);
                    updateForm("birth_date", v);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Geburtsort <span className="text-destructive">*</span></Label>
                <Input className={cn(form.birth_place.trim() && "border-green-500")} value={form.birth_place} onChange={e => updateForm("birth_place", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Nationalität <span className="text-destructive">*</span></Label>
                <Popover open={nationalityOpen} onOpenChange={setNationalityOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={nationalityOpen}
                      className={cn("w-full justify-between font-normal", form.nationality ? "border-green-500" : "text-muted-foreground")}
                    >
                      {form.nationality || "Nationalität wählen"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Nationalität suchen..." />
                      <CommandList>
                        <CommandEmpty>Keine Nationalität gefunden.</CommandEmpty>
                        <CommandGroup>
                          {NATIONALITIES.map((nat) => (
                            <CommandItem
                              key={nat}
                              value={nat}
                              onSelect={() => {
                                updateForm("nationality", nat);
                                setNationalityOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", form.nationality === nat ? "opacity-100" : "opacity-0")} />
                              {nat}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Straße & Hausnummer <span className="text-destructive">*</span></Label>
                <Input className={cn(form.street.trim() && "border-green-500")} value={form.street} onChange={e => updateForm("street", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>PLZ <span className="text-destructive">*</span></Label>
                <Input className={cn(form.zip_code.trim() && "border-green-500")} value={form.zip_code} onChange={e => updateForm("zip_code", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Stadt <span className="text-destructive">*</span></Label>
                <Input className={cn(form.city.trim() && "border-green-500")} value={form.city} onChange={e => updateForm("city", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Familienstand <span className="text-destructive">*</span></Label>
                <Select value={form.marital_status} onValueChange={v => updateForm("marital_status", v)}>
                  <SelectTrigger className={cn(form.marital_status && "border-green-500")}><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ledig">Ledig</SelectItem>
                    <SelectItem value="verheiratet">Verheiratet</SelectItem>
                    <SelectItem value="geschieden">Geschieden</SelectItem>
                    <SelectItem value="verwitwet">Verwitwet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Art der Beschäftigung <span className="text-destructive">*</span></Label>
                <Select value={form.employment_type} onValueChange={v => updateForm("employment_type", v)}>
                  <SelectTrigger className={cn(form.employment_type && "border-green-500")}><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minijob">Minijob</SelectItem>
                    <SelectItem value="teilzeit">Teilzeit</SelectItem>
                    <SelectItem value="vollzeit">Vollzeit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DatePickerField label="Gewünschtes Startdatum" value={form.desired_start_date} onChange={d => updateForm("desired_start_date", d || null)} disablePast />
            </div>
          )}

          {/* Step 2: Tax */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Sozialversicherungsnummer <span className="text-destructive">*</span></Label>
                <Input className={cn(form.social_security_number.trim() && "border-green-500")} placeholder="z.B. 12 010185 A 123" value={form.social_security_number} onChange={e => updateForm("social_security_number", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Steuerliche Identifikationsnummer <span className="text-destructive">*</span></Label>
                <Input className={cn(form.tax_id.trim() && "border-green-500")} placeholder="z.B. 12345678901" value={form.tax_id} onChange={e => updateForm("tax_id", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Krankenversicherung <span className="text-destructive">*</span></Label>
                <Input className={cn(form.health_insurance.trim() && "border-green-500")} placeholder="z.B. AOK Bayern" value={form.health_insurance} onChange={e => updateForm("health_insurance", e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 3: Bank */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>IBAN <span className="text-destructive">*</span></Label>
                <Input className={cn(form.iban.trim() && "border-green-500")} placeholder="DE89 3704 0044 0532 0130 00" value={form.iban} onChange={e => updateForm("iban", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>BIC <span className="text-destructive">*</span></Label>
                <Input className={cn(form.bic.trim() && "border-green-500")} placeholder="COBADEFFXXX" value={form.bic} onChange={e => updateForm("bic", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Name der Bank <span className="text-destructive">*</span></Label>
                <Input className={cn(form.bank_name.trim() && "border-green-500")} placeholder="z.B. Commerzbank" value={form.bank_name} onChange={e => updateForm("bank_name", e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 4: Documents */}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-4">
              {(["front", "back"] as const).map((side) => {
                const preview = side === "front" ? idFrontPreview : idBackPreview;
                const label = side === "front" ? "Ausweis Vorderseite" : "Ausweis Rückseite";
                return preview ? (
                  <div key={side} className="relative rounded-lg border border-green-500 overflow-hidden aspect-[3/2]">
                    <img src={preview} alt={label} className="w-full h-full object-cover" />
                    <button
                      onClick={() => {
                        if (side === "front") { setIdFrontFile(null); setIdFrontPreview(null); }
                        else { setIdBackFile(null); setIdBackPreview(null); }
                      }}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:bg-destructive/90"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label key={side} className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg aspect-[3/2] cursor-pointer hover:border-muted-foreground/50 transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium text-muted-foreground">{label}</span>
                    <span className="text-xs text-muted-foreground mt-1">Klicken zum Hochladen</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(side, e.target.files?.[0] || null)} />
                  </label>
                );
              })}
            </div>
          )}

          {/* Step 5: Summary */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4 space-y-1">
                <h4 className="font-semibold text-sm mb-2">Persönliche Informationen</h4>
                <SummaryRow label="Name" value={`${form.first_name} ${form.last_name}`} />
                <SummaryRow label="E-Mail" value={form.email} />
                <SummaryRow label="Telefon" value={form.phone} />
                <SummaryRow label="Geburtsdatum" value={form.birth_date} />
                <SummaryRow label="Geburtsort" value={form.birth_place} />
                <SummaryRow label="Nationalität" value={form.nationality} />
                <SummaryRow label="Adresse" value={`${form.street}, ${form.zip_code} ${form.city}`} />
                <SummaryRow label="Familienstand" value={form.marital_status} />
                <SummaryRow label="Beschäftigung" value={employmentLabels[form.employment_type] || form.employment_type} />
                <SummaryRow label="Startdatum" value={form.desired_start_date ? format(form.desired_start_date, "dd.MM.yyyy") : ""} />
              </div>
              <div className="bg-muted/30 rounded-lg p-4 space-y-1">
                <h4 className="font-semibold text-sm mb-2">Steuerliche Angaben</h4>
                <SummaryRow label="Sozialversicherungsnr." value={form.social_security_number} />
                <SummaryRow label="Steuer-ID" value={form.tax_id} />
                <SummaryRow label="Krankenversicherung" value={form.health_insurance} />
              </div>
              <div className="bg-muted/30 rounded-lg p-4 space-y-1">
                <h4 className="font-semibold text-sm mb-2">Bankverbindung</h4>
                <SummaryRow label="IBAN" value={form.iban} />
                <SummaryRow label="BIC" value={form.bic} />
                <SummaryRow label="Bank" value={form.bank_name} />
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">Ausweisdokumente</h4>
                <div className="flex gap-4">
                  {idFrontPreview && <img src={idFrontPreview} alt="Vorderseite" className="h-20 rounded border border-border object-cover" />}
                  {idBackPreview && <img src={idBackPreview} alt="Rückseite" className="h-20 rounded border border-border object-cover" />}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="border-t border-border p-6 flex justify-between">
          <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Zurück
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!isStepValid()}>
              Weiter <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Wird eingereicht..." : "Daten einreichen"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
