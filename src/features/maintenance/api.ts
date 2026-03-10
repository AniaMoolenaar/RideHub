import { supabase } from "../../lib/supabase";

export type BikePillRow = {
  bike_id: string;
  display_name: string;
  odometer_display: string;
  due_now_count: number;
  coming_up_count: number;
  most_urgent_service_line: string | null;
};

export async function fetchBikePills(): Promise<BikePillRow[]> {
  const { data, error } = await supabase
    .from("maintenance_bikes")
    .select("id, display_name, unit, odometer_value")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((bike) => ({
    bike_id: bike.id,
    display_name: bike.display_name,
    odometer_display: `${Number(bike.odometer_value ?? 0).toLocaleString()} ${bike.unit}`,
    due_now_count: 0,
    coming_up_count: 0,
    most_urgent_service_line: null,
  }));
}