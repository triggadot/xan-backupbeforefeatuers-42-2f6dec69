import { supabase } from "@/integrations/supabase/client";
import { Estimate, EstimateFilter, EstimateLine } from "@/types/estimates";

export async function fetchEstimates(
  filters?: EstimateFilter
): Promise<Estimate[]> {
  try {
    let query = supabase
      .from("gl_estimates")
      .select("*")
      .order("estimate_date", { ascending: false });

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.account_id) {
      query = query.eq("account_id", filters.account_id);
    }
    if (filters?.date_from && filters?.date_to) {
      query = query
        .gte("estimate_date", filters.date_from)
        .lte("estimate_date", filters.date_to);
    }
    if (filters?.search) {
      query = query.ilike("estimate_uid", `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []) as Estimate[];
  } catch (error) {
    console.error("Error fetching estimates:", error);
    throw new Error("Failed to fetch estimates");
  }
}

export async function fetchEstimateById(id: string): Promise<Estimate | null> {
  try {
    const { data, error } = await supabase
      .from("gl_estimates")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data as Estimate | null;
  } catch (error) {
    console.error("Error fetching estimate:", error);
    throw new Error("Failed to fetch estimate");
  }
}

export async function fetchEstimateLines(
  estimateId: string
): Promise<EstimateLine[]> {
  try {
    const { data, error } = await supabase
      .from("gl_estimate_lines")
      .select("*")
      .eq("estimate_id", estimateId);

    if (error) throw error;
    return (data || []) as EstimateLine[];
  } catch (error) {
    console.error("Error fetching estimate lines:", error);
    throw new Error("Failed to fetch estimate lines");
  }
}

export async function createEstimate(
  estimateData: Partial<Estimate>
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("gl_estimates")
      .insert(estimateData)
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error("Error creating estimate:", error);
    throw new Error("Failed to create estimate");
  }
}

export async function updateEstimate(
  id: string,
  estimateData: Partial<Estimate>
): Promise<void> {
  try {
    const { error } = await supabase
      .from("gl_estimates")
      .update(estimateData)
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error updating estimate:", error);
    throw new Error("Failed to update estimate");
  }
}

export async function deleteEstimate(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("gl_estimates").delete().eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting estimate:", error);
    throw new Error("Failed to delete estimate");
  }
}
