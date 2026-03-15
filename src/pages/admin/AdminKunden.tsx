import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Settings, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useBrandingFilter } from "@/hooks/useBrandingFilter";

export default function AdminKunden() {
  const queryClient = useQueryClient();
  const { brandingIds, ready } = useBrandingFilter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [expandedKunde, setExpandedKunde] = useState<string | null>(null);

  // Fetch all kunden
  const { data: kunden, isLoading } = useQuery({
    queryKey: ["admin-kunden", userId],
    enabled: !!userId,
    queryFn: async () => {
      // Get all users with rolle 'kunde'
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

  // Fetch all brandings (admin's own)
  const { data: brandings } = useQuery({
    queryKey: ["admin-all-brandings", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("brandings").select("id, company_name");
      return data ?? [];
    },
  });

  // Fetch branding assignments for expanded kunde
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

  // Create kunde account
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

  // Toggle branding assignment
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

  // Delete kunde
  const deleteMutation = useMutation({
    mutationFn: async (kundeId: string) => {
      // We can't delete auth users from client — just remove the role
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

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Kunden</h2>
            <p className="text-muted-foreground">Kundenkonten verwalten und Brandings zuweisen.</p>
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

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : !kunden?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Noch keine Kunden vorhanden.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {kunden.map((k) => (
            <Card key={k.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">{k.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">Kunde</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedKunde(expandedKunde === k.id ? null : k.id)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Brandings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Kundenzugang wirklich entfernen?")) {
                          deleteMutation.mutate(k.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {expandedKunde === k.id && (
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">Zugewiesene Brandings:</p>
                  {!brandings?.length ? (
                    <p className="text-sm text-muted-foreground">Keine Brandings vorhanden.</p>
                  ) : (
                    <div className="space-y-2">
                      {brandings.map((b) => {
                        const isAssigned = kundeAssignments?.includes(b.id) ?? false;
                        return (
                          <div key={b.id} className="flex items-center gap-2">
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
                            <span className="text-sm">{b.company_name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
