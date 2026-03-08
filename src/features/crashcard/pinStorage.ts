import * as SecureStore from "expo-secure-store";

const PIN_KEY = "crashcard_pin";

/**
 * Returns true if a PIN already exists on this device
 */
export async function hasPin(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(PIN_KEY);
  return !!value;
}

/**
 * Save a new PIN
 */
export async function savePin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, pin, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

/**
 * Verify a PIN
 */
export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  if (!stored) return false;
  return stored === pin;
}

/**
 * Delete PIN (for reset / debugging)
 */
export async function clearPin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
}