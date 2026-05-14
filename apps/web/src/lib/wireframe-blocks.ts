import { createServiceClient } from "@/lib/supabase/server";

type SupabaseClient = ReturnType<typeof createServiceClient>;

type WireframeBlockPayload = {
  type: string;
  order_index: number;
  props: Record<string, unknown>;
  node_id?: string;
  label?: string | null;
  composition?: unknown[] | null;
};

function isMissingOptionalColumnError(error: { message?: string; details?: string; code?: string } | null) {
  if (!error) return false;
  const haystack = `${error.code ?? ""} ${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  return haystack.includes("label") || haystack.includes("composition");
}

function stripOptionalColumns<T extends Record<string, unknown>>(payload: T): T {
  const next = { ...payload };
  delete next.label;
  delete next.composition;
  return next;
}

export async function insertWireframeBlocks(
  supabase: SupabaseClient,
  payload: WireframeBlockPayload | WireframeBlockPayload[]
) {
  const attempt = async (value: WireframeBlockPayload | WireframeBlockPayload[]) =>
    supabase.from("wireframe_blocks").insert(value).select();

  let result = await attempt(payload);
  if (!result.error || !isMissingOptionalColumnError(result.error)) return result;

  const fallbackPayload = Array.isArray(payload)
    ? payload.map((row) => stripOptionalColumns(row))
    : stripOptionalColumns(payload);

  result = await attempt(fallbackPayload);
  return result;
}

export async function updateWireframeBlock(
  supabase: SupabaseClient,
  blockId: string,
  payload: Partial<WireframeBlockPayload>
) {
  const attempt = async (value: Partial<WireframeBlockPayload>) =>
    supabase.from("wireframe_blocks").update(value).eq("id", blockId).select().single();

  let result = await attempt(payload);
  if (!result.error || !isMissingOptionalColumnError(result.error)) return result;

  const fallbackPayload = stripOptionalColumns(payload);
  if (Object.keys(fallbackPayload).length === 0) {
    return supabase.from("wireframe_blocks").select("*").eq("id", blockId).single();
  }

  result = await attempt(fallbackPayload);
  return result;
}
