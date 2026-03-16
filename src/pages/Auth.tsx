import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, CheckCircle, Building2 } from "lucide-react";
import { hexToHSL } from "@/lib/hexToHSL";

const trustPoints = [
  { icon: Shield, title: "Sicherer Zugang", desc: "Geschützter Mitarbeiterbereich" },
  { icon: CheckCircle, title: "DSGVO-konform", desc: "Vollständig datenschutzkonform" },
  { icon: Building2, title: "Einfach & Schnell", desc: "Alle Infos an einem Ort" },
];

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useUserRole();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [brandingLogoUrl, setBrandingLogoUrl] = useState<string | null>(null);
  const [brandingColor, setBrandingColor] = useState<string | null>(null);
  const [brandingId, setBrandingId] = useState<string | null>(null);
  const [brandingReady, setBrandingReady] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("");

  useEffect(() => {
    const fetchBranding = async () => {
      let hostname = window.location.hostname;
      const parts = hostname.split(".");
      if (parts.length > 2) {
        hostname = parts.slice(-2).join(".");
      }

      const { data } = await supabase
        .from("brandings")
        .select("id, logo_url, brand_color")
        .eq("domain", hostname)
        .maybeSingle();

      if (data?.logo_url) {
        setBrandingLogoUrl(data.logo_url);
        setBrandingColor(data.brand_color ?? null);
        setBrandingId(data.id);
      } else {
        const { data: fallback } = await supabase
          .from("brandings")
          .select("id, logo_url, brand_color")
          .eq("domain", "frik-maxeiner.de")
          .maybeSingle();
        setBrandingLogoUrl(fallback?.logo_url ?? null);
        setBrandingColor(fallback?.brand_color ?? null);
        setBrandingId(fallback?.id ?? null);
      }
      setBrandingReady(true);
    };
    fetchBranding();
  }, []);

  // Branding color is applied via inline style on the auth wrapper below,
  // NOT on document.documentElement, to avoid a race condition when
  // navigating from /auth to /mitarbeiter (which would briefly reset --primary).

  useEffect(() => {
    if (user && role) {
      navigate(role === "admin" ? "/admin" : "/mitarbeiter", { replace: true });
    }
  }, [user, role, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Erfolgreich angemeldet!");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regPasswordConfirm) {
      toast.error("Passwörter stimmen nicht überein.");
      return;
    }
    if (regPassword.length < 6) {
      toast.error("Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }
    setLoading(true);
    const { error, data } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: {
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          phone: phone.trim() || null,
        },
      },
    });
    if (!error && data.user && brandingId) {
      // Save branding to profile
      await supabase
        .from("profiles")
        .update({ branding_id: brandingId })
        .eq("id", data.user.id);

      // Create employment contract (triggers auto-assignment of starter jobs)
      await supabase.from("employment_contracts").insert({
        user_id: data.user.id,
        branding_id: brandingId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: regEmail.trim(),
        phone: phone.trim() || null,
        status: "offen",
      });
    }
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Registrierung erfolgreich!");
    }
  };

  if (!brandingReady) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground flex-col justify-center items-center px-16 overflow-hidden text-center">
        <div className="absolute -top-10 -right-10 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-20 -left-16 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute bottom-1/4 right-10 w-32 h-32 rounded-full bg-white/10 blur-xl" />
        <div className="absolute top-2/3 left-1/3 w-24 h-24 rounded-full bg-white/5 blur-lg" />

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex flex-col items-center"
        >
          {brandingLogoUrl ? (
            <img src={brandingLogoUrl} alt="Logo" className="max-h-16 w-auto object-contain" />
          ) : (
            <h1 className="text-4xl font-bold tracking-tight mb-2">Mitarbeiterportal</h1>
          )}
          <p className="text-lg text-white/70 mb-12 mt-2">Ihr Mitarbeiterportal</p>

          <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
            {trustPoints.map((point, i) => (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.15 }}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 hover:bg-white/15 hover:-translate-y-1 transition-all duration-300 cursor-default"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-white/25 to-white/5">
                  <point.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{point.title}</p>
                  <p className="text-sm text-white/60">{point.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-background px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            {brandingLogoUrl ? (
              <img src={brandingLogoUrl} alt="Logo" className="max-h-12 w-auto object-contain mx-auto" />
            ) : (
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Mitarbeiterportal</h1>
            )}
            <p className="text-muted-foreground text-sm mt-1">Mitarbeiterportal</p>
          </div>

          {/* Tab switcher */}
          <div className="flex mb-8 border-b border-border">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${
                mode === "login"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Anmelden
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${
                mode === "register"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Registrieren
            </button>
          </div>

          {mode === "login" ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Willkommen</h2>
                <p className="text-muted-foreground mt-1">Melden Sie sich an.</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-Mail</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="ihre@email.de"
                    className="h-12 rounded-lg"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Passwort</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    className="h-12 rounded-lg"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-12 rounded-lg text-base font-semibold" disabled={loading}>
                  {loading ? "Wird angemeldet..." : "Anmelden"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Konto erstellen</h2>
                <p className="text-muted-foreground mt-1">Registrieren Sie sich für das Portal.</p>
              </div>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="reg-firstname">Vorname</Label>
                    <Input
                      id="reg-firstname"
                      placeholder="Max"
                      className="h-12 rounded-lg"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-lastname">Nachname</Label>
                    <Input
                      id="reg-lastname"
                      placeholder="Mustermann"
                      className="h-12 rounded-lg"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">E-Mail</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="ihre@email.de"
                    className="h-12 rounded-lg"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-phone">Handynummer</Label>
                  <Input
                    id="reg-phone"
                    type="tel"
                    placeholder="+49 170 1234567"
                    className="h-12 rounded-lg"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Passwort</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="••••••••"
                    className="h-12 rounded-lg"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password-confirm">Passwort bestätigen</Label>
                  <Input
                    id="reg-password-confirm"
                    type="password"
                    placeholder="••••••••"
                    className="h-12 rounded-lg"
                    value={regPasswordConfirm}
                    onChange={(e) => setRegPasswordConfirm(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-12 rounded-lg text-base font-semibold" disabled={loading}>
                  {loading ? "Wird registriert..." : "Registrieren"}
                </Button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
