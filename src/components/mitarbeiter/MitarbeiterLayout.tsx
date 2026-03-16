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
  const [panelReady, setPanelReady] = useState(false);

  useEffect(() => {
    if (!user) return;

    const preloadImage = (src: string): Promise<void> =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = src;
      });

    const applyBrandColor = (color: string) => {
      const hsl = hexToHSL(color);
      if (hsl) {
        document.documentElement.style.setProperty("--primary", hsl);
        document.documentElement.style.setProperty("--ring", hsl);
      }
    };

    const fetchData = async () => {
      let resolvedBranding: BrandingData | null = null;
      let resolvedContract: ContractData | null = null;

      // 1. Get employment contract
      const { data: contractData } = await supabase
        .from("employment_contracts")
        .select("id, first_name, application_id, status, contract_pdf_url, signed_contract_pdf_url, is_suspended, submitted_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (contractData) {
        resolvedContract = contractData;

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

          if (brandingData) resolvedBranding = brandingData;
        }
      }

      // Fallback: load branding from profile.branding_id
      if (!resolvedBranding) {
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

          if (brandingData) resolvedBranding = brandingData;
        }
      }

      // Apply branding color BEFORE rendering
      if (resolvedBranding?.brand_color) {
        applyBrandColor(resolvedBranding.brand_color);
      }

      // Preload logo BEFORE rendering
      if (resolvedBranding?.logo_url) {
        await preloadImage(resolvedBranding.logo_url);
      }

      // Set state and mark ready
      setContract(resolvedContract);
      setBranding(resolvedBranding);
      setPanelReady(true);
    };

    fetchData();

    return () => {
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--ring");
    };
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (!panelReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground/60" />
      </div>
    );
  }

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
      <div className="min-h-screen flex w-full bg-muted/30" style={{
          '--sidebar-background': '0 0% 100%',
          '--sidebar-foreground': '220 20% 14%',
          '--sidebar-primary': '217 91% 60%',
          '--sidebar-primary-foreground': '0 0% 100%',
          '--sidebar-accent': '220 14% 96%',
          '--sidebar-accent-foreground': '220 20% 14%',
          '--sidebar-border': '220 13% 91%',
          '--sidebar-ring': '217 91% 60%',
          '--sidebar-muted': '220 14% 96%',
        } as React.CSSProperties}>
        <MitarbeiterSidebar branding={branding} brandingLoading={false} contractStatus={contract?.status} />
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

