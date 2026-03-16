import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrandingFilter } from "@/hooks/useBrandingFilter";
import { AvatarUpload } from "@/components/chat/AvatarUpload";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export default function AdminLivechatEinstellungen() {
  const { activeBrandingId, ready } = useBrandingFilter();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [chatOnline, setChatOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!activeBrandingId || !ready) return;
    setLoading(true);
    supabase
      .from("brandings")
      .select("chat_display_name, chat_avatar_url, chat_online")
      .eq("id", activeBrandingId)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setDisplayName(data.chat_display_name ?? "");
          setAvatarUrl(data.chat_avatar_url ?? null);
          setChatOnline(data.chat_online ?? false);
        }
        setLoading(false);
      });
  }, [activeBrandingId, ready]);

  const handleSave = async () => {
    if (!activeBrandingId) return;
    setSaving(true);
    const { error } = await supabase
      .from("brandings")
      .update({
        chat_display_name: displayName || null,
        chat_avatar_url: avatarUrl,
        chat_online: chatOnline,
      } as any)
      .eq("id", activeBrandingId);
    setSaving(false);
    if (error) {
      toast.error("Fehler beim Speichern");
    } else {
      toast.success("Livechat-Einstellungen gespeichert");
    }
  };

  const handleOnlineToggle = async (checked: boolean) => {
    setChatOnline(checked);
    if (!activeBrandingId) return;
    await supabase
      .from("brandings")
      .update({ chat_online: checked } as any)
      .eq("id", activeBrandingId);
  };

  if (!ready || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Livechat-Einstellungen</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Diese Einstellungen gelten für alle Mitarbeiter dieses Brandings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chat-Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="space-y-2">
            <Label>Avatar</Label>
            <div className="flex items-center gap-4">
              <AvatarUpload
                avatarUrl={avatarUrl}
                name={displayName || "Chat"}
                size={64}
                editable
                onUploaded={(url) => setAvatarUrl(url)}
              />
              <p className="text-xs text-muted-foreground">
                Wird den Mitarbeitern im Livechat angezeigt.
              </p>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="chat-name">Anzeigename</Label>
            <Input
              id="chat-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="z.B. Support Team"
              className="max-w-sm"
            />
          </div>

          {/* Online Status */}
          <div className="flex items-center justify-between max-w-sm">
            <div className="space-y-0.5">
              <Label>Online-Status</Label>
              <p className="text-xs text-muted-foreground">
                Mitarbeiter sehen ob der Chat aktiv ist
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${chatOnline ? "bg-green-500" : "bg-muted-foreground/30"}`} />
              <span className="text-sm text-muted-foreground">{chatOnline ? "Online" : "Offline"}</span>
              <Switch checked={chatOnline} onCheckedChange={handleOnlineToggle} />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="mt-2">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Speichern
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
