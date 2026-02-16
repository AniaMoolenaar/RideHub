import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";

export default function ResetPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onReset = async () => {
    setError(null);
    setMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: undefined, // default Supabase handling
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage("Check your email for a password reset link.");
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: 22, paddingTop: 60 }}>
      <Text style={{ fontSize: 26, fontWeight: "700", marginBottom: 8 }}>
        Reset password
      </Text>

      <Text style={{ color: "rgba(0,0,0,0.6)", marginBottom: 18 }}>
        Enter your email and we’ll send you a reset link.
      </Text>

      <Text style={{ fontWeight: "600", marginBottom: 6 }}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@example.com"
        style={{
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.15)",
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 12,
          marginBottom: 12,
        }}
      />

      {error ? (
        <Text style={{ color: "#b00020", marginBottom: 12 }}>{error}</Text>
      ) : null}

      {message ? (
        <Text style={{ color: "rgba(0,0,0,0.7)", marginBottom: 12 }}>
          {message}
        </Text>
      ) : null}

      <Pressable
        onPress={onReset}
        disabled={loading}
        style={{
          paddingVertical: 14,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.18)",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.04)",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text style={{ fontSize: 15, fontWeight: "600" }}>
            Send reset email
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => router.replace("/(auth)/login")}
        style={{ paddingVertical: 14, alignItems: "center" }}
      >
        <Text style={{ color: "rgba(0,0,0,0.55)" }}>
          Back to login
        </Text>
      </Pressable>
    </View>
  );
}
