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

// -------- WRITES --------

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

  const { error } = await supabase.from("maintenance_bikes").insert({
    display_name: input.display_name,
    make: input.make,
    model: input.model,
    year: input.year,
    unit: input.unit,
    odometer_value: input.current_odometer,
    odometer_km: odoKm,
    last_odometer_at: new Date().toISOString(),
  });

  if (error) throw error;
}

// Update odometer (updates maintenance_bikes ONLY)
export async function logOdometer(bikeId: UUID, value: number, unit: "km" | "miles") {
  const valueKm = unit === "miles" ? value * 1.60934 : value;

  const { error } = await supabase
    .from("maintenance_bikes")
    .update({
      odometer_value: value,
      odometer_km: valueKm,
      last_odometer_at: new Date().toISOString(),
    })
    .eq("id", bikeId);

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

// Mark completed (service history)
export async function markServiceCompleted(serviceId: UUID) {
  const { error } = await supabase
    .from("maintenance_service_history")
    .insert({ service_id: serviceId });

  if (error) throw error;
}

// Add / Edit Service
export type UpsertServiceInput = {
  bike_id: UUID;
  service_id?: UUID;
  name: string;
  interval_type: "distance" | "time";
  interval_value: number;
  reminder_threshold: number;
  estimated_cost: number | null;
  booked: boolean;
};

export async function upsertService(input: UpsertServiceInput): Promise<void> {
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
    return;
  }

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