export type UUID = string;

export type ServiceStatus = "ok" | "coming_up" | "due_now" | "setup_needed";

export type BikePillRow = {
  bike_id: UUID;
  display_name: string;
  odometer_display: string; // formatted by maintenance_bike_pills_v1
  due_now_count: number;
  coming_up_count: number;
  most_urgent_service_line: string | null;
};

// RPC: payload.bike
export type BikeDetails = {
  id: UUID;
  display_name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  unit: "km" | "miles";

  // canonical + unit-facing
  odometer_km: number;
  odometer_value: number; // value in bike.unit
  last_odometer_at: string | null;

  created_at: string;
  updated_at: string;
};

// RPC: payload.services[]
export type ServiceRow = {
  id: UUID;
  name: string;
  pinned: boolean;
  status: ServiceStatus;
  is_booked: boolean;

  created_at: string;
  updated_at: string;

  // interval model
  interval_type: "distance" | "time" | null;

  // distance-based
  interval_distance_km: number | null;
  reminder_distance_km: number | null;
  last_done_km: number | null;
  next_due_km: number | null;
  remaining_km: number | null;

  // time-based
  interval_months: number | null;
  reminder_days: number | null;
  last_done_date: string | null;   // YYYY-MM-DD
  next_due_date: string | null;    // YYYY-MM-DD
  remaining_days: number | null;

  // shared / helpers
  urgency_rank: number;
  estimated_cost: number | null;

  // convenience values returned by RPC
  next_due_value: number | null;
  remaining_value: number | null;
};

// RPC: payload.timeline[]
export type TimelineEntry = {
  event_type: "service" | "odometer";
  service_id: UUID | null;

  occurred_at: string; // ISO timestamp
  occurred_date: string; // YYYY-MM-DD
  occurred_year: number;

  odometer_km: number | null;
  odometer_value: number | null;

  service_name: string | null;
  completed_date: string | null;
};

export type BikeDetailsRPC = {
  bike: BikeDetails;
  services: ServiceRow[];
  timeline: TimelineEntry[];
};
