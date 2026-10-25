import { FlatList, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/lib/data";
import { C } from "@/lib/theme";
import { Button, Icon, ListingCard, T } from "@/components/ui";

export default function Saved() {
  const { listings, saved } = useData();
  const insets = useSafeAreaInsets();
  const items = listings.filter((l) => saved.has(l.id));
  return (
    <View style={{ flex: 1, backgroundColor: C.white, paddingTop: insets.top + 14 }}>
      <T w="extrabold" size={28} style={{ paddingHorizontal: 20 }}>
        Saved
      </T>
      <FlatList
        data={items}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ padding: 20, gap: 16, flexGrow: 1 }}
        renderItem={({ item, index }) => <ListingCard listing={item} delay={index * 50} />}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingBottom: 60 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.mint, alignItems: "center", justifyContent: "center" }}>
              <Icon name="heart" size={30} color={C.brand} />
            </View>
            <T w="bold" size={18}>
              Nothing saved yet
            </T>
            <T color={C.muted} style={{ textAlign: "center", maxWidth: 260 }}>
              Tap the heart on any place to keep it here.
            </T>
            <Button title="Explore places" onPress={() => router.push("/search")} style={{ marginTop: 6 }} />
          </View>
        }
      />
    </View>
  );
}
