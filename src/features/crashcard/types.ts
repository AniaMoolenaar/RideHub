export type CrashCardDraft = {
  yourDetails: YourDetails
  accidentDetails: AccidentDetails
  otherParties: OtherParty[]
  witnesses: Witness[]
  photos: PhotoRef[]
}

export type SavedCrashReport = {
  id: string
  ciphertext: string
  nonce: string
  schemaVersion: number

  clientCreatedAt: string
  clientUpdatedAt: string
  deletedAt: string | null

  syncStatus: "pending" | "synced" | "failed"
}

export type YourDetails = {
  fullName: string
  phone: string
  email: string
  bikeDescription: string
  registration: string
}

export type AccidentDetails = {
  date: string
  time: string
  location: string
  weather: WeatherType | ""
  description: string
}

export type OtherParty = {
  id: string
  name: string
  phone: string
  vehicle: string
  registration: string
  insurance: string
}

export type Witness = {
  id: string
  name: string
  phone: string
  notes: string
}

export type PhotoRef = {
  id: string
  uri: string
  createdAt: string
}

export type WeatherType =
  | "clear"
  | "cloudy"
  | "rain"
  | "fog"
  | "wind"
  | "other"