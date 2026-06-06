import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { sendEmail } from "@/lib/sendEmail";
import { sendTelegram } from "@/lib/sendTelegram";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Shield,
  CheckCircle2,
  Sparkles,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { hexToHSL } from "@/lib/hexToHSL";

const trustPoints = [
  {
    icon: Shield,
    title: "Sicherer Zugang",
    desc: "Ende-zu-Ende verschlüsselt",
  },
  {
    icon: CheckCircle2,
    title: "DSGVO-konform",
    desc: "Datenschutz nach EU-Standard",
  },
  {
    icon: Sparkles,
    title: "Alles an einem Ort",
    desc: "Verträge, Aufträge, Auszahlungen",
  },
];

const passwordStrength = (pw: string) => {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 3);
};

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
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Register state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("");
  const [showRegPw, setShowRegPw] = useState(false);

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

  useEffect(() => {
    if (user && role) {
      navigate(role === "admin" || role === "kunde" || role === "caller" ? "/admin" : "/mitarbeiter", { replace: true });
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
      await supabase
        .from("profiles")
        .update({ branding_id: brandingId })
        .eq("id", data.user.id);

      await supabase.from("employment_contracts").insert({
        user_id: data.user.id,
        branding_id: brandingId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: regEmail.trim().toLowerCase(),
        phone: phone.trim() || null,
        status: "offen",
      });
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      await sendEmail({
        to: regEmail,
        recipient_name: fullName,
        subject: "Willkommen – Ihr Konto wurde erstellt",
        body_title: "Willkommen im Mitarbeiterportal",
        body_lines: [
          `Sehr geehrte/r ${fullName},`,
          "Ihr Konto wurde erfolgreich erstellt. Ihnen wurden automatisch Starteraufträge zugewiesen.",
          "Bitte reichen Sie Ihre Vertragsdaten ein, damit Ihr Arbeitsvertrag erstellt werden kann.",
        ],
        button_text: "Zum Mitarbeiterportal",
        button_url: window.location.origin + "/mitarbeiter",
        branding_id: brandingId || null,
        event_type: "konto_erstellt",
        metadata: {},
      });
      await sendTelegram("konto_erstellt", `👤 Neuer Mitarbeiter registriert\n\nName: ${fullName}\nE-Mail: ${regEmail}`);
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

  const authStyle: React.CSSProperties = brandingColor
    ? ({ "--primary": hexToHSL(brandingColor) || undefined } as React.CSSProperties)
    : {};

  const pwScore = passwordStrength(regPassword);

  return (
    <div className="flex min-h-screen bg-background" style={authStyle}>
      {/* ============ LEFT — Branding Panel ============ */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Base dark layer */}
        <div className="absolute inset-0 bg-[#07070d]" />

        {/* Mesh gradient with branding primary */}
        <div
          className="absolute inset-0 animate-mesh-drift opacity-90"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 20%, hsl(var(--primary) / 0.55) 0%, transparent 45%),
              radial-gradient(circle at 80% 70%, hsl(var(--primary) / 0.35) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.25) 0%, transparent 60%)
            `,
            backgroundSize: "200% 200%",
          }}
        />

        {/* Diagonal light beam */}
        <div className="absolute -top-1/2 -left-1/4 w-[150%] h-[200%] rotate-12 bg-gradient-to-b from-transparent via-white/[0.04] to-transparent blur-2xl pointer-events-none" />

        {/* Noise overlay */}
        <div className="absolute inset-0 auth-noise opacity-[0.07] mix-blend-overlay pointer-events-none" />

        {/* Top-left brand mark */}
        <div className="absolute top-10 left-10 z-10 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse" />
          <span className="text-[11px] uppercase tracking-[0.3em] text-white/60 font-medium">
            Live · Secure
          </span>
        </div>

        {/* Bottom-left footer */}
        <div className="absolute bottom-8 left-10 z-10 text-xs text-white/40">
          © {new Date().getFullYear()} Mitarbeiterportal · DSGVO-konform
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-20 w-full">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Logo plaque */}
            {brandingLogoUrl ? (
              <div className="inline-flex items-center bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 mb-10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]">
                <img src={brandingLogoUrl} alt="Logo" className="max-h-10 w-auto object-contain" />
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 mb-10">
                <span className="text-[11px] uppercase tracking-[0.4em] text-white/60">
                  Mitarbeiterportal
                </span>
              </div>
            )}

            <p className="text-[11px] uppercase tracking-[0.35em] text-white/50 mb-4">
              Willkommen
            </p>
            <h1 className="font-serif text-5xl xl:text-6xl leading-[1.05] mb-5 bg-gradient-to-br from-white via-white to-white/50 bg-clip-text text-transparent">
              Ihr Arbeitsplatz.{" "}
              <span className="italic text-white/80">Neu gedacht.</span>
            </h1>
            <p className="text-base text-white/60 max-w-md leading-relaxed mb-12">
              Verträge, Aufträge und Auszahlungen — alles an einem Ort.
              Sicher, schnell und auf jedem Gerät.
            </p>

            {/* Trust bento */}
            <div className="space-y-3 max-w-md">
              {trustPoints.map((p, i) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 + i * 0.12, ease: "easeOut" }}
                  whileHover={{ y: -3 }}
                  className="group relative flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md px-5 py-4 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 cursor-default overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
                  <div className="relative flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br from-white/15 to-white/[0.02] border border-white/10">
                    <p.icon className="h-5 w-5 text-white" strokeWidth={1.75} />
                  </div>
                  <div className="relative flex-1">
                    <p className="text-sm font-medium text-white">{p.title}</p>
                    <p className="text-xs text-white/55 mt-0.5">{p.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ============ RIGHT — Form Panel ============ */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 relative bg-gradient-to-b from-background via-background to-muted/40">
        <div className="absolute inset-0 auth-dot-pattern opacity-60 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            {brandingLogoUrl ? (
              <img src={brandingLogoUrl} alt="Logo" className="max-h-12 w-auto object-contain mx-auto" />
            ) : (
              <h1 className="font-serif text-3xl text-foreground">Mitarbeiterportal</h1>
            )}
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.18)] p-8 sm:p-10">
            {/* Pill tab switcher */}
            <div className="flex p-1 mb-8 bg-muted/70 rounded-full">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${
                  mode === "login"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Anmelden
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${
                  mode === "register"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Registrieren
              </button>
            </div>

            <AnimatePresence mode="wait">
              {mode === "login" ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="mb-7">
                    <h2 className="font-serif text-3xl tracking-tight text-foreground">
                      Willkommen zurück
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1.5">
                      Melden Sie sich an, um fortzufahren.
                    </p>
                  </div>
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        E-Mail
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="ihre@email.de"
                          className="h-12 pl-10 rounded-xl bg-background/60 border-border/80 focus-visible:ring-primary/30 focus-visible:border-primary transition-all"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Passwort
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type={showLoginPw ? "text" : "password"}
                          placeholder="••••••••"
                          className="h-12 pl-10 pr-11 rounded-xl bg-background/60 border-border/80 focus-visible:ring-primary/30 focus-visible:border-primary transition-all"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPw((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showLoginPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="group relative w-full h-12 rounded-xl text-sm font-semibold overflow-hidden shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.5)] hover:shadow-[0_12px_32px_-8px_hsl(var(--primary)/0.6)] transition-all"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Wird angemeldet...
                          </>
                        ) : (
                          <>
                            Anmelden
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </>
                        )}
                      </span>
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </Button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="mb-7">
                    <h2 className="font-serif text-3xl tracking-tight text-foreground">
                      Konto erstellen
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1.5">
                      Registrieren Sie sich für das Portal.
                    </p>
                  </div>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="reg-firstname" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Vorname
                        </Label>
                        <div className="relative">
                          <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="reg-firstname"
                            placeholder="Max"
                            className="h-12 pl-10 rounded-xl bg-background/60 border-border/80 focus-visible:ring-primary/30 focus-visible:border-primary"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-lastname" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Nachname
                        </Label>
                        <Input
                          id="reg-lastname"
                          placeholder="Mustermann"
                          className="h-12 rounded-xl bg-background/60 border-border/80 focus-visible:ring-primary/30 focus-visible:border-primary"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        E-Mail
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reg-email"
                          type="email"
                          placeholder="ihre@email.de"
                          className="h-12 pl-10 rounded-xl bg-background/60 border-border/80 focus-visible:ring-primary/30 focus-visible:border-primary"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-phone" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Handynummer
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reg-phone"
                          type="tel"
                          placeholder="+49 170 1234567"
                          className="h-12 pl-10 rounded-xl bg-background/60 border-border/80 focus-visible:ring-primary/30 focus-visible:border-primary"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Passwort
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reg-password"
                          type={showRegPw ? "text" : "password"}
                          placeholder="Mind. 6 Zeichen"
                          className="h-12 pl-10 pr-11 rounded-xl bg-background/60 border-border/80 focus-visible:ring-primary/30 focus-visible:border-primary"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPw((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showRegPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {regPassword.length > 0 && (
                        <div className="flex gap-1.5 pt-1">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                i < pwScore
                                  ? pwScore === 1
                                    ? "bg-destructive/70"
                                    : pwScore === 2
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                  : "bg-muted"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password-confirm" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Passwort bestätigen
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reg-password-confirm"
                          type={showRegPw ? "text" : "password"}
                          placeholder="••••••••"
                          className="h-12 pl-10 rounded-xl bg-background/60 border-border/80 focus-visible:ring-primary/30 focus-visible:border-primary"
                          value={regPasswordConfirm}
                          onChange={(e) => setRegPasswordConfirm(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="group relative w-full h-12 rounded-xl text-sm font-semibold overflow-hidden mt-2 shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.5)] hover:shadow-[0_12px_32px_-8px_hsl(var(--primary)/0.6)] transition-all"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Wird registriert...
                          </>
                        ) : (
                          <>
                            Konto erstellen
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </>
                        )}
                      </span>
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Durch Anmeldung akzeptieren Sie unsere Nutzungsbedingungen & Datenschutzerklärung.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
