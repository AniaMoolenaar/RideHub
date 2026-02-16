import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

console.log("SUPABASE_URL =", process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log(
  "SUPABASE_ANON_KEY length =",
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.length
);

console.log(
  "SUPABASE ENV CHECK →",
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 15)
);

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);
