import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MitarbeiterSidebar } from "./MitarbeiterSidebar";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface BrandingData {
  logo_url: string | null;
  company_name: string;
  brand_color: string | null;
}

interface ContractData {
  id: string;
  first_name: string | null;
  application_id: string;
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
        .select("id, first_name, application_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!contractData) {
        setLoading(false);
        return;
      }
      setContract(contractData);

      // 2. Get application -> branding_id
      const { data: appData } = await supabase
        .from("applications")
        .select("branding_id")
        .eq("id", contractData.application_id)
        .maybeSingle();

      if (appData?.branding_id) {
        // 3. Get branding
        const { data: brandingData } = await supabase
          .from("brandings")
          .select("logo_url, company_name, brand_color")
          .eq("id", appData.branding_id)
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <MitarbeiterSidebar branding={branding} brandingLoading={loading} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="border-b border-border/20 bg-background sticky top-0 z-50 h-16 flex items-center justify-between px-5 shadow-sm">
            <SidebarTrigger />
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

function hexToHSL(hex: string): string | null {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  if (hex.length !== 6) return null;

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
