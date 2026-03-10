import { View, Text, Pressable } from "react-native";

type Props = {
  message?: string;
  onRetry?: () => void;
  paddingVertical?: number;
};

export default function ErrorBlock({
  message = "Something went wrong.",
  onRetry,
  paddingVertical = 24,
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
          marginBottom: onRetry ? 12 : 0,
          opacity: 0.8,
        }}
      >
        {message}
      </Text>

      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 10,
            borderWidth: 1,
            opacity: 0.9,
          }}
        >
          <Text>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}