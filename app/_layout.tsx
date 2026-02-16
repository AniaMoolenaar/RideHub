import { Stack, usePathname, useRouter } from "expo-router";
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
  const pathname = usePathname();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [profile, setProfile] = useState<UserEntitlements | null>(null);

  useEffect(() => {
    let alive = true;

    const loadProfileAndRoute = async () => {
      setCheckingAuth(true);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (!alive) return;

      if (userErr || !user) {
        setProfile(null);
        setCheckingAuth(false);

        // If user is not logged in, force to discovery OR login.
        // You said: "opened again it goes back to the start to the discovery screen"
        // So we force "/" (your discovery screen).
        if (pathname !== "/") {
          router.dismissAll();
          router.replace("/");
        }
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("is_premium, has_ride, has_maintain, has_learn")
        .eq("id", user.id)
        .single();

      if (!alive) return;

      if (error) {
        setProfile(null);
        setCheckingAuth(false);
        return;
      }

      setProfile((data ?? null) as any);
      setCheckingAuth(false);

      // If logged in but currently sitting on auth screens, force into tabs.
      if (pathname?.startsWith("/(auth)")) {
        router.dismissAll();
        router.replace("/(tabs)");
      }
    };

    loadProfileAndRoute();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadProfileAndRoute();
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [pathname, router]);

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
