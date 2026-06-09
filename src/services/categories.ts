import { requireSupabase } from "@/services/supabase/client";
import type { Category, CategoryInput, CashflowType } from "@/lib/types";

type CategoryRow = {
  id: string;
  user_id: string;
  name: string;
  type: CashflowType;
  color: string;
  created_at: string;
};

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    color: row.color,
    createdAt: row.created_at,
  };
}

export async function listCategories() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("categories")
    .select("id,user_id,name,type,color,created_at")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapCategory);
}

export async function createCategory(input: CategoryInput, userId: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: input.name.trim(),
      type: input.type,
      color: input.color,
    })
    .select("id,user_id,name,type,color,created_at")
    .single();
  if (error) throw error;
  return mapCategory(data as CategoryRow);
}

export async function deleteCategory(id: string) {
  const supabase = requireSupabase();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

