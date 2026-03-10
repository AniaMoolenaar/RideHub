import { View, ActivityIndicator } from "react-native";

type Props = {
  paddingVertical?: number;
};

export default function LoadingBlock({ paddingVertical = 32 }: Props) {
  return (
    <View
      style={{
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical,
      }}
    >
      <ActivityIndicator />
    </View>
  );
}