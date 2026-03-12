import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ThemeProvider } from "../src/theme/theme";
import { supabase } from "../src/lib/supabase";

type UserEntitlements = {
  is_premium: boolean;
  has_ride: boolean;
  has_maintain: boolean;
  has_learn: boolean;
};

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [, setProfile] = useState<UserEntitlements | null>(null);

  useEffect(() => {
    let alive = true;

    const loadProfile = async (nextUserId: string | null) => {
      if (!nextUserId) {
        if (!alive) return;
        setProfile(null);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("is_premium, has_ride, has_maintain, has_learn")
        .eq("id", nextUserId)
        .maybeSingle();

      if (!alive) return;
      setProfile((data ?? null) as UserEntitlements | null);
    };

    const restoreSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!alive) return;

      const nextUserId = session?.user?.id ?? null;
      setUserId(nextUserId);
      setAuthReady(true);

      await loadProfile(nextUserId);
    };

    restoreSession();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUserId = session?.user?.id ?? null;

      if (!alive) return;

      setUserId(nextUserId);
      setAuthReady(true);

      await loadProfile(nextUserId);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;

    const firstSegment = segments[0];
    const inAuthGroup = firstSegment === "(auth)";
    const inTabsGroup = firstSegment === "(tabs)";

    if (!userId) {
      if (inTabsGroup) {
        router.replace("/");
      }
      return;
    }

    if (inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [authReady, userId, segments, router]);

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}