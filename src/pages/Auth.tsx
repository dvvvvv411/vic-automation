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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Shield, CheckCircle, Building2 } from "lucide-react";

const trustPoints = [
  { icon: Shield, title: "Enterprise Security", desc: "Höchste Sicherheitsstandards" },
  { icon: CheckCircle, title: "DSGVO-konform", desc: "Vollständig datenschutzkonform" },
  { icon: Building2, title: "Seit 2026", desc: "Deutsches Qualitätsunternehmen" },
];

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useUserRole();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: { full_name: regName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Registrierung erfolgreich! Bitte E-Mail bestätigen.");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[hsl(217,91%,25%)] to-[hsl(217,91%,50%)] text-white flex-col justify-center px-16 overflow-hidden">
        {/* Geometric decorations */}
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full border border-white/10" />
        <div className="absolute bottom-32 left-10 w-40 h-40 rounded-full border border-white/10" />
        <div className="absolute top-1/2 right-10 w-24 h-24 rounded-full bg-white/5" />
        <div className="absolute bottom-10 right-32 w-16 h-16 rounded-full bg-white/5" />

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Vic Automation <span className="font-light">2.0</span>
          </h1>
          <p className="text-lg text-white/70 mb-12">
            Professionelle App-Testing Plattform
          </p>

          <div className="space-y-6">
            {trustPoints.map((point, i) => (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.15 }}
                className="flex items-center gap-4"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10">
                  <point.icon className="w-5 h-5" />
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Vic Automation <span className="text-primary">2.0</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">App-Testing Plattform</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Willkommen
            </h2>
            <p className="text-muted-foreground mt-1">
              Melden Sie sich an oder erstellen Sie ein Konto.
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Anmelden</TabsTrigger>
              <TabsTrigger value="register">Registrieren</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-Mail</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="name@unternehmen.de"
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
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Vollständiger Name</Label>
                  <Input
                    id="reg-name"
                    type="text"
                    placeholder="Max Mustermann"
                    className="h-12 rounded-lg"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">E-Mail</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="name@unternehmen.de"
                    className="h-12 rounded-lg"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Passwort</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="Mind. 6 Zeichen"
                    className="h-12 rounded-lg"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full h-12 rounded-lg text-base font-semibold" disabled={loading}>
                  {loading ? "Wird registriert..." : "Registrieren"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
