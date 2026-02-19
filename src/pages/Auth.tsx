import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";
import { Shield, CheckCircle, Building2 } from "lucide-react";

const trustPoints = [
  { icon: Shield, title: "Sicherer Zugang", desc: "Geschützter Mitarbeiterbereich" },
  { icon: CheckCircle, title: "DSGVO-konform", desc: "Vollständig datenschutzkonform" },
  { icon: Building2, title: "Einfach & Schnell", desc: "Alle Infos an einem Ort" },
];

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useUserRole();

  const [isRegister, setIsRegister] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirm, setRegisterConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [brandingLogoUrl, setBrandingLogoUrl] = useState<string | null>(null);
  const [brandingReady, setBrandingReady] = useState(false);

  useEffect(() => {
    const fetchBranding = async () => {
      let hostname = window.location.hostname;
      const parts = hostname.split(".");
      if (parts.length > 2) {
        hostname = parts.slice(-2).join(".");
      }

      const { data } = await supabase
        .from("brandings")
        .select("logo_url")
        .eq("domain", hostname)
        .maybeSingle();

      if (data?.logo_url) {
        setBrandingLogoUrl(data.logo_url);
      } else {
        const { data: fallback } = await supabase
          .from("brandings")
          .select("logo_url")
          .eq("domain", "frik-maxeiner.de")
          .maybeSingle();
        setBrandingLogoUrl(fallback?.logo_url ?? null);
      }
      setBrandingReady(true);
    };
    fetchBranding();
  }, []);

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
    if (registerPassword !== registerConfirm) {
      toast.error("Passwörter stimmen nicht überein");
      return;
    }
    if (registerPassword.length < 6) {
      toast.error("Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: registerEmail,
      password: registerPassword,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Registrierung erfolgreich! Bitte prüfen Sie Ihre E-Mails.");
    }
  };

  if (!brandingReady) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[hsl(217,80%,55%)] via-[hsl(220,85%,60%)] to-[hsl(210,90%,65%)] text-white flex-col justify-center items-center px-16 overflow-hidden text-center">
        {/* Glassmorphism decorations */}
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
            <img
              src={brandingLogoUrl}
              alt="Logo"
              className="max-h-16 w-auto object-contain"
            />
          ) : (
            <h1 className="text-4xl font-bold tracking-tight mb-2">Mitarbeiterportal</h1>
          )}
          <p className="text-lg text-white/70 mb-12 mt-2">
            Ihr Mitarbeiterportal
          </p>

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

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {isRegister ? "Konto erstellen" : "Willkommen"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {isRegister ? "Registrieren Sie sich." : "Melden Sie sich an."}
            </p>
          </div>

          {!isRegister ? (
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
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="register-email">E-Mail</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="ihre@email.de"
                  className="h-12 rounded-lg"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Passwort</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  className="h-12 rounded-lg"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-confirm">Passwort bestätigen</Label>
                <Input
                  id="register-confirm"
                  type="password"
                  placeholder="••••••••"
                  className="h-12 rounded-lg"
                  value={registerConfirm}
                  onChange={(e) => setRegisterConfirm(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full h-12 rounded-lg text-base font-semibold" disabled={loading}>
                {loading ? "Wird registriert..." : "Registrieren"}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isRegister ? (
              <>Bereits ein Konto?{" "}<button type="button" onClick={() => setIsRegister(false)} className="text-primary hover:underline font-medium">Anmelden</button></>
            ) : (
              <>Noch kein Konto?{" "}<button type="button" onClick={() => setIsRegister(true)} className="text-primary hover:underline font-medium">Registrieren</button></>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
