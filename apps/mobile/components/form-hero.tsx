import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, R } from "@/lib/theme";
import { FadeIn, Icon, T, type IconName } from "./ui";

/** Photo header with a green tint, shared by the Roommates and List screens. */
export function FormHero({ image, icon, badge, title, text }: { image: string; icon: IconName; badge: string; title: string; text: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.hero, { paddingTop: insets.top + 26 }]}>
      <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(15,74,56,0.78)" }]} />
      <FadeIn>
        <View style={s.badge}>
          <Icon name={icon} size={13} color={C.brand} />
          <T w="semibold" size={12} color={C.brand}>
            {badge}
          </T>
        </View>
        <T w="extrabold" size={32} color={C.white} style={{ marginTop: 14, lineHeight: 36 }}>
          {title}
        </T>
        <T size={15} color="rgba(255,255,255,0.85)" style={{ marginTop: 8, lineHeight: 22 }}>
          {text}
        </T>
      </FadeIn>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingBottom: 28, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: "hidden", backgroundColor: C.brand },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: C.mint, borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 6 },
});
