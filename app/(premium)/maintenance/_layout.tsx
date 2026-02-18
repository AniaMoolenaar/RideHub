import React from "react";
import { Stack } from "expo-router";

export default function MaintenanceLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="bike/[bikeId]" />
      <Stack.Screen name="add-bike" />
      <Stack.Screen name="service" />
    </Stack>
  );
}
