import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MitarbeiterSidebar } from "./MitarbeiterSidebar";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { ContractSigningView } from "./ContractSigningView";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hexToHSL } from "@/lib/hexToHSL";

interface BrandingData {
  logo_url: string | null;
  company_name: string;
  brand_color: string | null;
  payment_model: string | null;
  salary_minijob: number | null;
  salary_teilzeit: number | null;
  salary_vollzeit: number | null;
}

interface ContractData {
  id: string;
  first_name: string | null;
  application_id: string | null;
  status: string;
  contract_pdf_url: string | null;
  signed_contract_pdf_url: string | null;
  is_suspended: boolean;
  submitted_at: string | null;
}

export default function MitarbeiterLayout() {
  const { user } = useAuth();
  const [branding, setBranding] = useState<BrandingData | null>(null);
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // 1. Get employment contract
      const { data: contractData } = await supabase
        .from("employment_contracts")
        .select("id, first_name, application_id, status, contract_pdf_url, signed_contract_pdf_url, is_suspended, submitted_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (contractData) {
        setContract(contractData);

        // 2. Get application -> branding_id
        const { data: appData } = await supabase
          .from("applications")
          .select("branding_id")
          .eq("id", contractData.application_id)
          .maybeSingle();

        if (appData?.branding_id) {
          const { data: brandingData } = await supabase
            .from("brandings")
            .select("logo_url, company_name, brand_color, payment_model, salary_minijob, salary_teilzeit, salary_vollzeit")
            .eq("id", appData.branding_id)
            .maybeSingle();

          if (brandingData) {
            setBranding(brandingData);
            setLoading(false);
            return;
          }
        }
      }

      // Fallback: load branding from profile.branding_id
      const { data: profileData } = await supabase
        .from("profiles")
        .select("branding_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileData?.branding_id) {
        const { data: brandingData } = await supabase
          .from("brandings")
          .select("logo_url, company_name, brand_color, payment_model, salary_minijob, salary_teilzeit, salary_vollzeit")
          .eq("id", profileData.branding_id)
          .maybeSingle();

        if (brandingData) {
          setBranding(brandingData);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  // Dynamically set brand color as CSS custom property
  useEffect(() => {
    if (branding?.brand_color) {
      const color = branding.brand_color;
      // Convert hex to HSL for CSS variable
      const hsl = hexToHSL(color);
      if (hsl) {
        document.documentElement.style.setProperty("--primary", hsl);
      }
    }
    return () => {
      document.documentElement.style.removeProperty("--primary");
    };
  }, [branding?.brand_color]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (contract?.is_suspended) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <ShieldX className="h-16 w-16 text-destructive mb-6" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Ihr Benutzerkonto wurde gesperrt</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Bitte kontaktieren Sie Ihren Ansprechpartner für weitere Informationen.
        </p>
        <Button variant="outline" onClick={handleLogout}>Abmelden</Button>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <MitarbeiterSidebar branding={branding} brandingLoading={loading} contractStatus={contract?.status} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="border-b border-border/20 bg-background sticky top-0 z-50 h-16 flex items-center justify-between px-5 shadow-sm relative">
            <SidebarTrigger />
            {branding?.logo_url && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none md:hidden">
                <img
                  src={branding.logo_url}
                  alt={branding.company_name}
                  className="max-h-9 w-auto object-contain"
                />
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
              <div className="w-8 h-8 rounded-full bg-primary/10 ring-2 ring-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                {user?.email?.charAt(0).toUpperCase() || "?"}
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 lg:p-8 bg-slate-50">
            <Outlet context={{ contract, branding, loading }} />
          </main>
        </div>
        <ChatWidget contractId={contract?.id ?? null} brandColor={branding?.brand_color} />
      </div>
    </SidebarProvider>
  );
}

