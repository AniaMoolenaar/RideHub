import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fade = useState(() => new Animated.Value(1))[0];

  const onLogin = async () => {
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error) {
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    const user = data.user;

    if (!user) {
      setError("Login failed. Please try again.");
      setLoading(false);
      return;
    }

    if (!user.email_confirmed_at) {
      await supabase.auth.signOut();
      setError("Please verify your email before logging in.");
      setLoading(false);
      return;
    }

    setLoading(false);
    router.replace("/(tabs)");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Background image (slide 1) */}
      <Animated.Image
        source={{
          uri: "https://olibvhoibsnawrjpubuk.supabase.co/storage/v1/object/public/splash_discover_login/Discover%2001.jpg",
        }}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          opacity: fade,
        }}
        resizeMode="cover"
      />

      {/* Same overlay as discovery */}
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Top-aligned content */}
        <View
          style={{
            paddingHorizontal: 22,
            paddingTop: 60,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 26,
              fontWeight: "700",
              marginBottom: 10,
            }}
          >
            Log in
          </Text>

          <Text
            style={{
              color: "rgba(255,255,255,0.78)",
              fontSize: 15,
              lineHeight: 22,
              marginBottom: 18,
            }}
          >
            Welcome back.
          </Text>

          <Text style={{ fontWeight: "600", marginBottom: 6, color: "#fff" }}>
            Email
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor="rgba(255,255,255,0.55)"
            style={{
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.5)",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 12,
              marginBottom: 12,
              color: "#fff",
              backgroundColor: "rgba(255,255,255,0.06)",
            }}
          />

          <Text style={{ fontWeight: "600", marginBottom: 6, color: "#fff" }}>
            Password
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Your password"
            placeholderTextColor="rgba(255,255,255,0.55)"
            style={{
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.5)",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 12,
              marginBottom: 12,
              color: "#fff",
              backgroundColor: "rgba(255,255,255,0.06)",
            }}
          />

          {error ? (
            <Text style={{ color: "#ffb4b4", marginBottom: 12 }}>
              {error}
            </Text>
          ) : null}

          <Pressable
            onPress={onLogin}
            disabled={loading}
            style={{
              paddingVertical: 14,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.5)",
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0.06)",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
                Log in
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push("/(auth)/reset-password")}
            style={{ paddingVertical: 14, alignItems: "center" }}
          >
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
              Forgot your password?
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace("/(auth)/signup")}
            style={{ paddingVertical: 14, alignItems: "center" }}
          >
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
              Don’t have an account? Sign up
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
