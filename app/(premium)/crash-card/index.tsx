import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";

import { supabase } from "../../../src/lib/supabase";
import CrashCardPinScreen from "../../../src/features/crashcard/CrashCardPinScreen";

export default function CrashCardRoute() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (userError || !user) {
        router.replace("/(premium)/paywall");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .single();

      if (!active) return;

      if (profileError || !profile?.is_premium) {
        router.replace("/(premium)/paywall");
        return;
      }

      setAllowed(true);
    }

    checkAccess();

    return () => {
      active = false;
    };
  }, [router]);

  if (allowed !== true) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <CrashCardPinScreen />;
}