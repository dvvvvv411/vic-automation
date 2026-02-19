import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function ShortRedirect() {
  const { code } = useParams<{ code: string }>();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!code) return;
    (async () => {
      const { data, error: err } = await supabase
        .from("short_links" as any)
        .select("target_url")
        .eq("code", code)
        .single();
      if (err || !data) {
        setError(true);
        return;
      }
      window.location.href = (data as any).target_url;
    })();
  }, [code]);

  if (error) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Link nicht gefunden.</div>;
  return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Weiterleitung...</div>;
}
