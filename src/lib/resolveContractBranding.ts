import { supabase } from "@/integrations/supabase/client";

/**
 * Resolves the effective branding_id for a contract.
 * Priority: profiles.branding_id > employment_contracts.branding_id
 */
export async function resolveContractBranding(contractId: string): Promise<string | null> {
  const { data: contract } = await supabase
    .from("employment_contracts")
    .select("branding_id, user_id")
    .eq("id", contractId)
    .single();

  if (!contract) return null;

  if (contract.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("branding_id")
      .eq("id", contract.user_id)
      .single();

    if (profile?.branding_id) return profile.branding_id;
  }

  return contract.branding_id ?? null;
}

/**
 * Batch-resolves branding_ids for multiple contracts.
 * Returns a map of contract_id -> effective branding_id.
 */
export async function resolveContractBrandingBatch(
  contracts: { id: string; user_id?: string | null; branding_id?: string | null }[]
): Promise<Record<string, string | null>> {
  const userIds = contracts
    .map((c) => c.user_id)
    .filter((uid): uid is string => !!uid);

  let profileMap: Record<string, string | null> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, branding_id")
      .in("id", userIds);

    profileMap = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, p.branding_id])
    );
  }

  const result: Record<string, string | null> = {};
  for (const c of contracts) {
    const profileBranding = c.user_id ? (profileMap[c.user_id] ?? null) : null;
    result[c.id] = profileBranding ?? c.branding_id ?? null;
  }
  return result;
}
