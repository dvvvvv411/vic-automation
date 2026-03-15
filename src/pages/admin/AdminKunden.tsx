import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Settings, Trash2, Users, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { useBrandingFilter } from "@/hooks/useBrandingFilter";

export default function AdminKunden() {
  const queryClient = useQueryClient();
  const { activeBrandingId, ready } = useBrandingFilter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [expandedKunde, setExpandedKunde] = useState<string | null>(null);

  const { data: kunden, isLoading } = useQuery({
    queryKey: ["admin-kunden", activeBrandingId],
    enabled: ready,
    queryFn: async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "kunde" as any);

      if (!roles?.length) return [];

      const userIds = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, display_name")
        .in("id", userIds);

      return userIds.map((uid) => {
        const profile = profiles?.find((p) => p.id === uid);
        return {
          id: uid,
          name: profile?.display_name || profile?.full_name || uid,
        };
      });
    },
  });

  const { data: brandings } = useQuery({
    queryKey: ["admin-all-brandings", activeBrandingId],
    enabled: ready,
    queryFn: async () => {
      const { data } = await supabase.from("brandings").select("id, company_name");
      return data ?? [];
    },
  });

  const { data: kundeAssignments } = useQuery({
    queryKey: ["kunde-brandings", expandedKunde],
    enabled: !!expandedKunde,
    queryFn: async () => {
      const { data } = await supabase
        .from("kunde_brandings" as any)
        .select("branding_id")
        .eq("user_id", expandedKunde!);
      return ((data as any[]) ?? []).map((d: any) => d.branding_id as string);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("create-kunde-account", {
        body: { email, password },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Kundenkonto erstellt" });
      setOpen(false);
      setEmail("");
      setPassword("");
      queryClient.invalidateQueries({ queryKey: ["admin-kunden"] });
    },
    onError: (e: any) => {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    },
  });

  const toggleBranding = useMutation({
    mutationFn: async ({ kundeId, brandingId, assign }: { kundeId: string; brandingId: string; assign: boolean }) => {
      if (assign) {
        const { error } = await supabase.from("kunde_brandings" as any).insert({ user_id: kundeId, branding_id: brandingId } as any);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("kunde_brandings" as any).delete().eq("user_id", kundeId).eq("branding_id", brandingId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kunde-brandings", expandedKunde] });
    },
    onError: (e: any) => {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (kundeId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", kundeId).eq("role", "kunde" as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Kundenzugang entfernt" });
      queryClient.invalidateQueries({ queryKey: ["admin-kunden"] });
    },
    onError: (e: any) => {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    },
  });

  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name[0] || "?").toUpperCase();
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Kunden</h2>
            <p className="text-muted-foreground mt-1">Kundenkonten verwalten und Brandings zuweisen.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Kunde erstellen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neues Kundenkonto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>E-Mail</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="kunde@example.de" type="email" />
                </div>
                <div>
                  <Label>Passwort</Label>
                  <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Passwort" type="text" />
                </div>
                <Button
                  className="w-full shadow-sm hover:shadow-md transition-all"
                  onClick={() => createMutation.mutate()}
                  disabled={!email || !password || createMutation.isPending}
                >
                  {createMutation.isPending ? "Erstelle..." : "Konto erstellen"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laden...</div>
        ) : !kunden?.length ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Noch keine Kunden vorhanden.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {kunden.map((k, i) => (
              <motion.div
                key={k.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="premium-card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                  {/* Avatar */}
                  <div className="flex-shrink-0 h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    {getInitials(k.name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground truncate">{k.name}</span>
                      <Badge variant="secondary" className="text-xs">Kunde</Badge>
                    </div>
                    {expandedKunde === k.id && kundeAssignments && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>{kundeAssignments.length} Branding{kundeAssignments.length !== 1 ? "s" : ""} zugewiesen</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setExpandedKunde(expandedKunde === k.id ? null : k.id)}
                          className={expandedKunde === k.id ? "text-primary" : ""}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Brandings verwalten</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("Kundenzugang wirklich entfernen?")) {
                              deleteMutation.mutate(k.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Zugang entfernen</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Expanded Brandings */}
                {expandedKunde === k.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.2 }}
                    className="bg-muted/30 rounded-lg p-4 mt-2 ml-[60px]"
                  >
                    <p className="text-sm font-medium text-foreground mb-3">Zugewiesene Brandings</p>
                    {!brandings?.length ? (
                      <p className="text-sm text-muted-foreground">Keine Brandings vorhanden.</p>
                    ) : (
                      <div className="space-y-2">
                        {brandings.map((b) => {
                          const isAssigned = kundeAssignments?.includes(b.id) ?? false;
                          return (
                            <label key={b.id} className="flex items-center gap-2.5 cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5 -mx-2 transition-colors">
                              <Checkbox
                                checked={isAssigned}
                                onCheckedChange={(checked) => {
                                  toggleBranding.mutate({
                                    kundeId: k.id,
                                    brandingId: b.id,
                                    assign: !!checked,
                                  });
                                }}
                              />
                              <span className="text-sm text-foreground">{b.company_name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </>
  );
}
