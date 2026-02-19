import { supabase } from "@/integrations/supabase/client";

export async function uploadChatAttachment(contractId: string, file: File): Promise<string | null> {
  const uuid = crypto.randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${contractId}/${uuid}_${safeName}`;

  const { error } = await supabase.storage
    .from("chat-attachments")
    .upload(path, file);

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const { data } = supabase.storage
    .from("chat-attachments")
    .getPublicUrl(path);

  return data.publicUrl;
}
