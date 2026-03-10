import { View, Text } from "react-native";

type Props = {
  message?: string;
  paddingVertical?: number;
};

export default function EmptyState({
  message = "Nothing here yet.",
  paddingVertical = 32,
}: Props) {
  return (
    <View
      style={{
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical,
        paddingHorizontal: 20,
      }}
    >
      <Text
        style={{
          textAlign: "center",
          opacity: 0.7,
        }}
      >
        {message}
      </Text>
    </View>
  );
}