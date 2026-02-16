import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Linking,
  Animated,
  Easing,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../src/lib/supabase";

type EntryRow = {
  id: string;
  screen: string | null;
  slide_no: number | null;
  sort_order: number | null;
  image_url: string | null;
  headline: string | null;
  body: string | null;
};

const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL;
const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL;

// DEV QUICK LOGIN (paste password locally; do not commit)
const DEV_EMAIL = "zaczek.ak@gmail.com";
const DEV_PASSWORD = "Ania12568";

export default function Index() {
  const router = useRouter();
  const { height, width } = useWindowDimensions();

  const [phase, setPhase] = useState<"splash" | "transition" | "discover">(
    "splash"
  );
  const [loading, setLoading] = useState(true);
  const [sessionExists, setSessionExists] = useState<boolean | null>(null);

  const [splashImageUrl, setSplashImageUrl] = useState<string | null>(null);
  const [discoverSlides, setDiscoverSlides] = useState<EntryRow[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);

  const didNavigateRef = useRef(false);
  const isAdvancingRef = useRef(false);

  const progress = useRef(new Animated.Value(0)).current; // splash->discover
  const pulse = useRef(new Animated.Value(1)).current;

  const slideFade = useRef(new Animated.Value(1)).current; // text fade
  const bgFade = useRef(new Animated.Value(0)).current; // next bg fade-in

  const [currentBgUrl, setCurrentBgUrl] = useState<string | null>(null);
  const [nextBgUrl, setNextBgUrl] = useState<string | null>(null);

  const [currentBgReady, setCurrentBgReady] = useState(false);
  const [nextBgReady, setNextBgReady] = useState(false);

  const [devLoginLoading, setDevLoginLoading] = useState(false);

  const LOGO_H = 44;

  const topHeight = Math.max(260, Math.min(Math.floor(height * 0.58), 520));
  const CONTENT_UP_SHIFT = 60;
  const topHeightDiscover = Math.max(200, topHeight - CONTENT_UP_SHIFT);

  const splashLogoCenterY = height * 0.42;
  const discoverLogoCenterY = topHeightDiscover * 0.45;

  const logoTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [splashLogoCenterY - LOGO_H / 2, discoverLogoCenterY - LOGO_H / 2],
  });

  const discoverOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const slides: EntryRow[] =
    discoverSlides.length > 0
      ? discoverSlides
      : [
          {
            id: "fallback",
            screen: "discover",
            slide_no: 1,
            sort_order: 1,
            image_url: null,
            headline: "Welcome",
            body: "Log in or continue as guest.",
          },
        ];

  const getSlideBg = (idx: number) =>
    slides[idx]?.image_url ?? splashImageUrl ?? null;

  const openUrl = async (url?: string) => {
    if (!url) return;
    if (await Linking.canOpenURL(url)) Linking.openURL(url);
  };

  const onDevQuickLogin = async () => {
    if (devLoginLoading) return;

const DEV_EMAIL = "zaczek.ak@gmail.com";
const DEV_PASSWORD = "Ania12568";

// ...
const onDevQuickLogin = async () => {
  console.log("DEV_PASSWORD_RUNTIME:", DEV_PASSWORD);

  if (!DEV_PASSWORD || DEV_PASSWORD === "Ania12568") {
    console.log("DEV QUICK LOGIN: set DEV_PASSWORD in index.tsx locally.");
    return;
  }

  // ... rest of login
};



    setDevLoginLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: DEV_EMAIL.trim(),
      password: DEV_PASSWORD,
    });

    if (error) {
      console.log("DEV QUICK LOGIN ERROR:", error);
      setDevLoginLoading(false);
      return;
    }

    const user = data.user;

    if (!user) {
      console.log("DEV QUICK LOGIN: no user returned");
      setDevLoginLoading(false);
      return;
    }

    // Enforce email verification (same rule as login screen)
    if (!user.email_confirmed_at) {
      await supabase.auth.signOut();
      console.log("DEV QUICK LOGIN: email not verified");
      setDevLoginLoading(false);
      return;
    }

    setDevLoginLoading(false);
    router.replace("/(tabs)");
  };

  // Fetch session + entry screens
  useEffect(() => {
    let alive = true;

    const fetchData = async () => {
      const sessionRes = await supabase.auth.getSession();
      const entryRes = await supabase
        .from("entry_screens")
        .select("id,screen,slide_no,sort_order,image_url,headline,body");

      if (!alive) return;

      setSessionExists(!!sessionRes.data?.session);

      if (!entryRes.error) {
        const rows = (entryRes.data ?? []) as EntryRow[];

        const splash = rows
          .filter((r) => (r.screen ?? "").toLowerCase() === "splash")
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];

        const discover = rows
          .filter((r) => (r.screen ?? "").toLowerCase() === "discover")
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

        const splashUrl = splash?.image_url ?? null;

        setSplashImageUrl(splashUrl);
        setDiscoverSlides(discover);

        // Ensure splash background is the first background requested
        if (!currentBgUrl) {
          setCurrentBgReady(false);
          setCurrentBgUrl(splashUrl);
        }
      }

      setLoading(false);
    };

    fetchData();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pulse on splash only
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 650,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    if (phase === "splash") loop.start();
    else loop.stop();

    return () => loop.stop();
  }, [phase, pulse]);

  // Splash → discover (logo moves + discover fades in)
  useEffect(() => {
    const t = setTimeout(() => {
      setPhase("transition");
      Animated.timing(progress, {
        toValue: 1,
        duration: 950,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setPhase("discover"));
    }, 3000);

    return () => clearTimeout(t);
  }, [progress]);

  // When we hit discover, crossfade background to first discover slide (if different)
  useEffect(() => {
    if (phase !== "discover") return;

    const firstUrl = getSlideBg(0);
    if (!firstUrl) return;

    if (currentBgUrl && currentBgUrl === firstUrl) return;

    // Prepare next bg; fade it in only after it loads.
    setNextBgReady(false);
    bgFade.setValue(0);
    setNextBgUrl(firstUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Navigation to tabs if logged in (push so app stays in Recents in standalone builds)
  useEffect(() => {
    if (phase === "splash") return;
    if (loading) return;
    if (sessionExists !== true) return;
    if (didNavigateRef.current) return;

    didNavigateRef.current = true;
    router.push("/(tabs)");
  }, [phase, loading, sessionExists, router]);

  // Complete a background crossfade once next bg is ready
  useEffect(() => {
    if (!nextBgUrl) return;
    if (!nextBgReady) return;

    bgFade.stopAnimation();
    Animated.timing(bgFade, {
      toValue: 1,
      duration: 900,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      // IMPORTANT: keep next layer mounted briefly to avoid flash on some devices
      const committedUrl = nextBgUrl;

      setCurrentBgUrl(committedUrl);
      setCurrentBgReady(true);

      setTimeout(() => {
        // Only clear if it’s still the same one we committed
        setNextBgUrl((prev) => (prev === committedUrl ? null : prev));
        setNextBgReady(false);
        bgFade.setValue(0);
      }, 120);

      // If we were advancing a slide, fade text back in after bg commit
      if (isAdvancingRef.current) {
        Animated.timing(slideFade, {
          toValue: 1,
          duration: 750,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start(() => {
          isAdvancingRef.current = false;
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextBgReady, nextBgUrl]);

  // Auto-advance slides every 7 seconds with smooth text + bg transitions
  useEffect(() => {
    if (phase !== "discover") return;
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      if (isAdvancingRef.current) return;
      isAdvancingRef.current = true;

      const nextIndex = (activeSlide + 1) % slides.length;
      const nextUrl = getSlideBg(nextIndex);

      slideFade.stopAnimation();
      Animated.timing(slideFade, {
        toValue: 0,
        duration: 600,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        setActiveSlide(nextIndex);

        // If bg changes, crossfade it; text fades back in when bg commit completes.
        if (nextUrl && currentBgUrl !== nextUrl) {
          setNextBgReady(false);
          bgFade.setValue(0);
          setNextBgUrl(nextUrl);
          return;
        }

        // No bg change: fade text back in immediately
        Animated.timing(slideFade, {
          toValue: 1,
          duration: 750,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start(() => {
          isAdvancingRef.current = false;
        });
      });
    }, 7000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, slides.length, activeSlide, currentBgUrl]);

  const bgReadyForSplash = !!currentBgUrl && currentBgReady;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <View style={{ flex: 1 }}>
        {/* Current background */}
        {currentBgUrl ? (
          <Animated.Image
            source={{ uri: currentBgUrl }}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              width,
              height,
              opacity: 1,
            }}
            resizeMode="cover"
            onLoadEnd={() => setCurrentBgReady(true)}
          />
        ) : null}

        {/* Next background (crossfade in) */}
        {nextBgUrl ? (
          <Animated.Image
            source={{ uri: nextBgUrl }}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              width,
              height,
              opacity: bgFade,
            }}
            resizeMode="cover"
            onLoadEnd={() => setNextBgReady(true)}
          />
        ) : null}

        {/* Overlay */}
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(0,0,0,0.38)",
          }}
        />

        {/* Ensure bg + logo appear together */}
        {!bgReadyForSplash ? (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <ActivityIndicator />
          </View>
        ) : null}

        {/* Logo */}
        {bgReadyForSplash ? (
          <Animated.View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              transform: [{ translateY: logoTranslateY }, { scale: pulse }],
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <View
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderWidth: 3,
                borderColor: "rgba(255,255,255,0.92)",
                backgroundColor: "rgba(0,0,0,0.12)",
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  letterSpacing: 4,
                  fontSize: 18,
                  fontWeight: "600",
                }}
              >
                RIDEHUB
              </Text>
            </View>
          </Animated.View>
        ) : null}

        {/* DEV quick login button (top-right) */}
        {bgReadyForSplash ? (
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              top: 50,
              right: 18,
              zIndex: 50,
            }}
          >
            <Pressable
              onPress={onDevQuickLogin}
              disabled={devLoginLoading}
              style={({ pressed }) => ({
                width: 34,
                height: 34,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
                backgroundColor: "rgba(0,0,0,0.28)",
                alignItems: "center",
                justifyContent: "center",
                opacity: devLoginLoading ? 0.7 : pressed ? 0.8 : 1,
              })}
              hitSlop={10}
            >
              {devLoginLoading ? (
                <ActivityIndicator />
              ) : (
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>
                  ⚡
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {/* Discover content */}
        {bgReadyForSplash ? (
          <Animated.View
            style={{ flex: 1, opacity: discoverOpacity }}
            pointerEvents={phase === "splash" ? "none" : "auto"}
          >
            <View
              style={{
                flex: 1,
                paddingHorizontal: 22,
                paddingTop: topHeightDiscover,
              }}
            >
              <Animated.View style={{ opacity: slideFade }}>
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 26,
                    fontWeight: "700",
                    marginBottom: 10,
                  }}
                >
                  {slides[activeSlide]?.headline}
                </Text>

                <Text
                  numberOfLines={3}
                  style={{
                    color: "rgba(255,255,255,0.78)",
                    fontSize: 15,
                    lineHeight: 22,
                    minHeight: 66,
                  }}
                >
                  {slides[activeSlide]?.body}
                </Text>
              </Animated.View>

              <View
                style={{
                  flexDirection: "row",
                  gap: 8,
                  marginTop: 14,
                  marginBottom: 18,
                }}
              >
                {slides.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      height: 8,
                      width: i === activeSlide ? 26 : 8,
                      borderRadius: 999,
                      backgroundColor:
                        i === activeSlide
                          ? "rgba(255,255,255,0.9)"
                          : "rgba(255,255,255,0.35)",
                    }}
                  />
                ))}
              </View>

              <View style={{ gap: 12 }}>
                <Pressable
                  onPress={() => router.push("/(auth)/login")}
                  style={{
                    paddingVertical: 14,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.5)",
                    alignItems: "center",
                    backgroundColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
                    Log in
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => router.push("/(auth)/signup")}
                  style={{
                    paddingVertical: 14,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.5)",
                    alignItems: "center",
                    backgroundColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
                    Sign up
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => router.push("/(tabs)")}
                  style={{ paddingVertical: 10, alignItems: "center" }}
                >
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                    Continue as guest
                  </Text>
                </Pressable>
              </View>

              <View style={{ marginTop: 18 }}>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    fontSize: 12,
                    textAlign: "center",
                  }}
                >
                  By continuing you agree to our{" "}
                  <Text
                    onPress={() => openUrl(TERMS_URL)}
                    style={{
                      textDecorationLine: "underline",
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    Terms
                  </Text>{" "}
                  &{" "}
                  <Text
                    onPress={() => openUrl(PRIVACY_URL)}
                    style={{
                      textDecorationLine: "underline",
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </View>

              {phase !== "splash" && loading ? (
                <View style={{ flex: 1, justifyContent: "center" }}>
                  <ActivityIndicator />
                </View>
              ) : null}
            </View>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}
