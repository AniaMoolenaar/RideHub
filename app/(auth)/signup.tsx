import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";

type CountryOption = { name: string; code: string };

const COUNTRIES: CountryOption[] = [
  { name: "Australia", code: "AU" },
  { name: "United States", code: "US" },
  { name: "United Kingdom", code: "GB" },
  { name: "New Zealand", code: "NZ" },
  { name: "Canada", code: "CA" },
];

export default function SignupScreen() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [city, setCity] = useState("");

  const [countryName, setCountryName] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("");

  const [showCountryModal, setShowCountryModal] = useState(false);
  const [useOtherCountry, setUseOtherCountry] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const trimmedDisplayName = useMemo(() => displayName.trim(), [displayName]);
  const trimmedEmail = useMemo(() => email.trim(), [email]);
  const trimmedCity = useMemo(() => city.trim(), [city]);
  const trimmedCountry = useMemo(() => countryName.trim(), [countryName]);
  const trimmedCode = useMemo(() => countryCode.trim().toUpperCase(), [countryCode]);

  const canSubmit = useMemo(() => {
    if (trimmedDisplayName.length < 2) return false;
    if (!trimmedEmail) return false;
    if (!password) return false;
    if (password.length < 6) return false;
    if (trimmedCity.length < 2) return false;
    if (trimmedCountry.length < 2) return false;
    if (!/^[A-Z]{2}$/.test(trimmedCode)) return false;
    return true;
  }, [trimmedDisplayName, trimmedEmail, password, trimmedCity, trimmedCountry, trimmedCode]);

  const chooseCountry = (opt: CountryOption) => {
    setUseOtherCountry(false);
    setCountryName(opt.name);
    setCountryCode(opt.code);
    setShowCountryModal(false);
  };

  const chooseOther = () => {
    setUseOtherCountry(true);
    setCountryName("");
    setCountryCode("");
    setShowCountryModal(false);
  };

  const onSignup = async () => {
    setError(null);
    setSuccessMsg(null);

    if (!canSubmit) {
      setError("Please complete all fields (password must be 6+ characters).");
      return;
    }

    setLoading(true);
    try {
      const signUpRes = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: "http://localhost:8081/(auth)/login",
          data: {
            display_name: trimmedDisplayName,
            city: trimmedCity,
            country: trimmedCountry,
            country_code: trimmedCode,
          },
        },
      });

      if (signUpRes.error) {
        setError(signUpRes.error.message);
        setLoading(false);
        return;
      }

      setSuccessMsg("Account created. Please check your email to verify before logging in.");
      setLoading(false);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: 22, paddingTop: 60 }}>
      <Text style={{ fontSize: 26, fontWeight: "700", marginBottom: 8 }}>Sign up</Text>
      <Text style={{ color: "rgba(0,0,0,0.6)", marginBottom: 18 }}>
        Create your account. You’ll need to verify your email before logging in.
      </Text>

      <Text style={{ fontWeight: "600", marginBottom: 6 }}>Display name</Text>
      <TextInput
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="e.g. Ania"
        style={{
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.15)",
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 12,
          marginBottom: 12,
        }}
      />

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

      <Text style={{ fontWeight: "600", marginBottom: 6 }}>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="6+ characters"
        style={{
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.15)",
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 12,
          marginBottom: 12,
        }}
      />

      <Text style={{ fontWeight: "600", marginBottom: 6 }}>City</Text>
      <TextInput
        value={city}
        onChangeText={setCity}
        placeholder="e.g. Melbourne"
        style={{
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.15)",
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 12,
          marginBottom: 12,
        }}
      />

      <Text style={{ fontWeight: "600", marginBottom: 6 }}>Country</Text>

      <Pressable
        onPress={() => setShowCountryModal(true)}
        style={{
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.15)",
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 12,
          marginBottom: useOtherCountry ? 12 : 18,
        }}
      >
        <Text style={{ color: trimmedCountry ? "#111" : "rgba(0,0,0,0.35)" }}>
          {trimmedCountry ? `${trimmedCountry} (${trimmedCode || "??"})` : "Choose country"}
        </Text>
      </Pressable>

      {useOtherCountry ? (
        <>
          <Text style={{ fontWeight: "600", marginBottom: 6 }}>Country name</Text>
          <TextInput
            value={countryName}
            onChangeText={setCountryName}
            placeholder="e.g. Australia"
            style={{
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.15)",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 12,
              marginBottom: 12,
            }}
          />

          <Text style={{ fontWeight: "600", marginBottom: 6 }}>Country code (ISO-2)</Text>
          <TextInput
            value={countryCode}
            onChangeText={setCountryCode}
            autoCapitalize="characters"
            placeholder="e.g. AU"
            maxLength={2}
            style={{
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.15)",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 12,
              marginBottom: 18,
            }}
          />
        </>
      ) : null}

      {error ? <Text style={{ color: "#b00020", marginBottom: 12 }}>{error}</Text> : null}
      {successMsg ? <Text style={{ color: "rgba(0,0,0,0.7)", marginBottom: 12 }}>{successMsg}</Text> : null}

      <Pressable
        onPress={onSignup}
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
          <Text style={{ fontSize: 15, fontWeight: "600" }}>Create account</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.replace("/(auth)/login")} style={{ paddingVertical: 14, alignItems: "center" }}>
        <Text style={{ color: "rgba(0,0,0,0.55)" }}>Already have an account? Log in</Text>
      </Pressable>

      <Modal visible={showCountryModal} transparent animationType="fade" onRequestClose={() => setShowCountryModal(false)}>
        <Pressable
          onPress={() => setShowCountryModal(false)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", padding: 22, justifyContent: "center" }}
        >
          <Pressable onPress={() => {}} style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, maxHeight: "70%" }}>
            <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 10 }}>Choose country</Text>
            <ScrollView>
              {COUNTRIES.map((c) => (
                <Pressable
                  key={c.code}
                  onPress={() => chooseCountry(c)}
                  style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.08)" }}
                >
                  <Text>{c.name}</Text>
                </Pressable>
              ))}
              <Pressable onPress={chooseOther} style={{ paddingVertical: 12 }}>
                <Text>Other…</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
