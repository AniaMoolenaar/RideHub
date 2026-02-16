// HomeSearchBar.tsx
import { View, TextInput } from "react-native";
import { Search } from "lucide-react-native";
import { useAppTheme, themeTokens } from "../theme/theme";

export default function HomeSearchBar({
  value,
  onChangeText,
  onFocus,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
}) {
  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);

  return (
    <View style={{ marginTop: 24, marginBottom: 10, marginHorizontal: 20 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          borderRadius: 12,
          borderWidth: 1,
          paddingHorizontal: 12,
          height: 44,
          backgroundColor: t.pillBg,
          borderColor: t.pillBorder,
        }}
      >
        <Search size={18} color={t.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          placeholder="Search topics"
          placeholderTextColor={t.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={{ flex: 1, fontSize: 14, color: t.text }}
          returnKeyType="search"
        />
      </View>
    </View>
  );
}
