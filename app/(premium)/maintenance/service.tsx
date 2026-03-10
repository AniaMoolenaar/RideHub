import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

type Params = {
  bikeId?: string;
  mode?: string;
  serviceId?: string;
};

export default function MaintenanceServiceLegacyRoute() {
  const router = useRouter();
  const { bikeId, mode, serviceId } = useLocalSearchParams<Params>();

  useEffect(() => {
    if (!bikeId) return;

    if (mode === "edit" && serviceId) {
      router.replace(`/(premium)/maintenance/service/${serviceId}`);
      return;
    }

    router.replace({
      pathname: "/(premium)/maintenance/add-service",
      params: { bikeId },
    });
  }, [router, bikeId, mode, serviceId]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Text>Loading…</Text>
    </View>
  );
}