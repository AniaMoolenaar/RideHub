import { supabase } from "../../lib/supabase";
import type { BikeDetailsRPC, BikePillRow, UUID } from "./types";

// -------- READS --------

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

// -------- WRITES (PLACEHOLDERS - wire to your real endpoints) --------

// Add Bike
export type AddBikeInput = {
  display_name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  unit: "km" | "miles";
  current_odometer: number;
};

// NOTE: Replace with your actual insert/RPC.
// This is a generic example.
export async function addBike(input: AddBikeInput): Promise<void> {
  // Example assumes table names; adjust to yours.
  const { error: bikeErr } = await supabase.from("maintenance_bikes").insert({
    display_name: input.display_name,
    make: input.make,
    model: input.model,
    year: input.year,
    unit: input.unit,
  });

  if (bikeErr) throw bikeErr;

  // If odometer is separate, you likely need to log it; swap to your real table/RPC.
  // If your backend automatically logs initial odometer via trigger, remove this.
  // await supabase.from("maintenance_odometer_log").insert({ bike_id, odometer_km: ... })
}

// Update odometer (log entry)
export async function logOdometer(bikeId: UUID, value: number, unit: "km" | "miles") {
  // Replace with your actual table/RPC.
  // If canonical km storage is required, backend should handle conversion;
  // UI sends value in bike unit.
  const { error } = await supabase.from("maintenance_odometer_log").insert({
    bike_id: bikeId,
    value,
    unit,
  });
  if (error) throw error;
}

// Pin toggle
export async function setServicePinned(serviceId: UUID, pinned: boolean) {
  const { error } = await supabase
    .from("maintenance_services")
    .update({ pinned })
    .eq("id", serviceId);

  if (error) throw error;
}

// Mark completed
export async function markServiceCompleted(serviceId: UUID) {
  // Replace with your completion history insert or RPC.
  const { error } = await supabase.from("maintenance_service_completions").insert({
    service_id: serviceId,
  });
  if (error) throw error;
}

// Add / Edit Service
export type UpsertServiceInput = {
  bike_id: UUID;
  service_id?: UUID; // present for edit
  name: string;
  interval_type: "distance" | "time";
  interval_value: number;
  reminder_threshold: number;
  estimated_cost: number | null;
  booked: boolean;
};

export async function upsertService(input: UpsertServiceInput) {
  // Replace with your real table/RPC.
  if (input.service_id) {
    const { error } = await supabase
      .from("maintenance_services")
      .update({
        name: input.name,
        interval_type: input.interval_type,
        interval_value: input.interval_value,
        reminder_threshold: input.reminder_threshold,
        estimated_cost: input.estimated_cost,
        booked: input.booked,
      })
      .eq("id", input.service_id);

    if (error) throw error;
  } else {
    const { error } = await supabase.from("maintenance_services").insert({
      bike_id: input.bike_id,
      name: input.name,
      interval_type: input.interval_type,
      interval_value: input.interval_value,
      reminder_threshold: input.reminder_threshold,
      estimated_cost: input.estimated_cost,
      booked: input.booked,
    });

    if (error) throw error;
  }
}
