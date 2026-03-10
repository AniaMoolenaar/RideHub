import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { createClient } from "@supabase/supabase-js";

const extra = Constants.expoConfig?.extra ?? {};

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  extra.EXPO_PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  extra.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log("SUPABASE_URL =", supabaseUrl);
console.log("SUPABASE_ANON_KEY length =", supabaseAnonKey?.length);
console.log(
  "SUPABASE ENV CHECK →",
  supabaseUrl,
  supabaseAnonKey?.slice(0, 15)
);

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});