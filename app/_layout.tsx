import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Colors } from "@/lib/colors";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" backgroundColor={Colors.creamLight} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.creamLight } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
