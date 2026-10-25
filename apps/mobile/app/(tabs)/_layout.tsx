import { Tabs } from "expo-router";
import { C, F } from "@/lib/theme";
import { Icon, type IconName } from "@/components/ui";

const tab = (name: IconName) =>
  function TabIcon({ color, focused }: { color: unknown; focused: boolean }) {
    const c = typeof color === "string" ? color : C.muted;
    return <Icon name={name} size={23} color={c} fill={focused && name === "heart" ? c : "none"} />;
  };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.brand,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontFamily: F.semibold, fontSize: 11.5 },
        tabBarStyle: { borderTopColor: C.line, backgroundColor: C.white },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Explore", tabBarIcon: tab("home") }} />
      <Tabs.Screen name="search" options={{ title: "Search", tabBarIcon: tab("search") }} />
      <Tabs.Screen name="roommates" options={{ title: "Roommates", tabBarIcon: tab("users") }} />
      <Tabs.Screen name="list" options={{ title: "List", tabBarIcon: tab("plus") }} />
      <Tabs.Screen name="saved" options={{ title: "Saved", tabBarIcon: tab("heart") }} />
    </Tabs>
  );
}
