import { supabase } from "../../lib/supabase";
import type { BikeDetailsRPC, BikePillRow, UUID } from "./types";

// -------------------- READS --------------------

export async function fetchBikePills(): Promise<BikePillRow[]> {
  const { data, error } = await supabase
    .from("maintenance_bike_pills_v1")
    .select("*")
    .order("display_name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as BikePillRow[];
}

export async function fetchBikeDetails(bikeId: UUID): Promise<BikeDetailsRPC> {
  const { data, error } = await supabase.rpc("maintenance_get_bike_details_v1", {
    p_bike_id: bikeId,
  });

  if (error) throw error;
  return data as BikeDetailsRPC;
}

// -------------------- WRITES --------------------

// Add Bike
export type AddBikeInput = {
  display_name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  unit: "km" | "miles";
  current_odometer: number;
};

export async function addBike(input: AddBikeInput): Promise<void> {
  const odoKm =
    input.unit === "miles" ? input.current_odometer * 1.60934 : input.current_odometer;

  const now = new Date().toISOString();

  const { error } = await supabase.from("maintenance_bikes").insert({
    display_name: input.display_name,
    make: input.make,
    model: input.model,
    year: input.year,
    unit: input.unit,
    odometer_value: input.current_odometer,
    odometer_km: odoKm,
    last_odometer_at: now,
  });

  if (error) throw error;
}

// Update odometer (updates maintenance_bikes ONLY)
export async function logOdometer(bikeId: UUID, value: number, unit: "km" | "miles") {
  const valueKm = unit === "miles" ? value * 1.60934 : value;
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("maintenance_bikes")
    .update({
      odometer_value: value,
      odometer_km: valueKm,
      last_odometer_at: now,
    })
    .eq("id", bikeId);

  if (error) throw error;
}

// Pin toggle
export async function setServicePinned(serviceId: UUID, pinned: boolean) {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("maintenance_services")
    .update({ pinned, updated_at: now })
    .eq("id", serviceId);

  if (error) throw error;
}

// Mark completed (service history)
export async function markServiceCompleted(serviceId: UUID) {
  // service_name exists in your history table (you hit "already exists"), so we can snapshot it.
  const { data: svc, error: e1 } = await supabase
    .from("maintenance_services")
    .select("id,name")
    .eq("id", serviceId)
    .single();

  if (e1) throw e1;

  const { error: e2 } = await supabase
    .from("maintenance_service_history")
    .insert({ service_id: serviceId, service_name: svc?.name ?? null });

  if (e2) throw e2;
}

// Delete service (hard delete). Try deleting history first to avoid FK failures.
export async function deleteService(serviceId: UUID) {
  await supabase.from("maintenance_service_history").delete().eq("service_id", serviceId);
  const { error } = await supabase.from("maintenance_services").delete().eq("id", serviceId);
  if (error) throw error;
}

// Add / Edit Service (schema-correct)
// - reminder OPTIONAL (null)
// - estimated_cost removed
// - booked removed
export type UpsertServiceInput = {
  bike_id: UUID;
  service_id?: UUID;
  name: string;
  interval_type: "distance" | "time";
  interval_value: number; // km OR months depending on interval_type
  reminder_threshold?: number | null; // OPTIONAL (km OR days)
};

export async function upsertService(input: UpsertServiceInput): Promise<void> {
  const now = new Date().toISOString();
  const isDistance = input.interval_type === "distance";

  const intervalValue = input.interval_value;
  const reminder = input.reminder_threshold ?? null;

  // NOTE: these are the REAL columns you showed in your schema.
  const patch: Record<string, any> = {
    name: input.name,
    interval_type: input.interval_type,
    interval_distance_km: isDistance ? intervalValue : null,
    interval_months: isDistance ? null : Math.trunc(intervalValue),
    reminder_distance_km: isDistance ? reminder : null,
    reminder_days: isDistance ? null : reminder == null ? null : Math.trunc(reminder),
    updated_at: now,
  };

  if (input.service_id) {
    const { error } = await supabase
      .from("maintenance_services")
      .update(patch)
      .eq("id", input.service_id);

    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("maintenance_services").insert({
    bike_id: input.bike_id,
    pinned: false,
    is_booked: false, // DB requires it; UI removed
    created_at: now,
    updated_at: now,
    ...patch,
  });

  if (error) throw error;
}