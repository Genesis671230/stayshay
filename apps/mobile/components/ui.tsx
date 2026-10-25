import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, TextInput, View, type PressableProps, type StyleProp, type TextInputProps, type TextProps, type TextStyle, type ViewStyle } from "react-native";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { C, F, R, shadow } from "@/lib/theme";
import { TYPE_LABEL, type Listing } from "@/lib/core";
import { useData } from "@/lib/data";

/* ---------- type ---------- */

type Weight = keyof typeof F;
export function T({ w = "regular", size = 15, color = C.ink, style, ...rest }: TextProps & { w?: Weight; size?: number; color?: string }) {
  return <Text {...rest} style={[{ fontFamily: F[w], fontSize: size, color, letterSpacing: size >= 24 ? -size * 0.03 : 0 }, style as StyleProp<TextStyle>]} />;
}

export const aed = (n: number) => `AED ${n.toLocaleString("en-US")}`;

/* ---------- brand ---------- */

/** The Stayshay pin-with-a-face mark (static drawing of apps/web/public/brand/stayshay-mark.svg). */
export function Mark({ size = 32, light = false }: { size?: number; light?: boolean }) {
  const body = light ? C.ivory : C.brand;
  const face = light ? C.brand : C.ivory;
  return (
    <Svg width={(size * 120) / 124} height={size} viewBox="0 0 120 124">
      <Ellipse cx={60} cy={119} rx={11} ry={2.6} fill={C.ink} opacity={0.18} />
      <Path d="M41.0 84.9Q54 100.9 60 116Q66 100.9 79.0 84.9Z" fill={body} />
      <Circle cx={60} cy={54} r={38} fill={body} />
      <Path d="M49.87 41.60A5.6 5.6 0 1 0 45 50A5.6 5.6 0 1 1 40.13 58.40" fill="none" stroke={face} strokeWidth={4.4} strokeLinecap="round" />
      <Path d="M79.87 41.60A5.6 5.6 0 1 0 75 50A5.6 5.6 0 1 1 70.13 58.40" fill="none" stroke={face} strokeWidth={4.4} strokeLinecap="round" />
      <Path d="M51 70Q60 77 69 70" fill="none" stroke={light ? C.brand : C.mint} strokeWidth={4} strokeLinecap="round" />
    </Svg>
  );
}

export function Logo({ light = false, size = 26 }: { light?: boolean; size?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
      <Mark size={size} light={light} />
      <T w="extrabold" size={size * 0.82} color={light ? C.white : C.brand} style={{ letterSpacing: -1 }}>
        stayshay
      </T>
    </View>
  );
}

/* ---------- icons (same strokes as the website) ---------- */

const PATHS = {
  search: "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.35-4.35",
  pin: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z",
  users: "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1m6.5-9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM21 19v-1a4 4 0 0 0-3-3.9M16 3.1a3.5 3.5 0 0 1 0 6.8",
  plus: "M12 5v14M5 12h14",
  heart: "M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z",
  check: "m5 12.5 4.5 4.5L19 7.5",
  close: "M6 6l12 12M18 6 6 18",
  back: "m15 5-7 7 7 7",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  train: "M7 3h10a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2Zm-2 8h14M8 21l2-4m6 4-2-4",
  shield: "M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Zm-3.2 9.2 2.3 2.3 4.3-4.6",
  bed: "M3 18V7m0 7h18v4m0-4v-2a3 3 0 0 0-3-3h-7v5M7 11.5a1.5 1.5 0 1 0 0-.01",
  key: "M15.5 8.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-3 3L4 20m3-3 2 2m-4-4 2 2",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5v-4m0-4h.01",
  sliders: "M4 7h10m4 0h2M4 17h4m4 0h8M14 5v4m-6 6v4",
};
export type IconName = keyof typeof PATHS | "whatsapp";

export function Icon({ name, size = 20, color = C.ink, fill = "none" }: { name: IconName; size?: number; color?: string; fill?: string }) {
  if (name === "whatsapp") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          fill={color}
          d="M12 2.2A9.8 9.8 0 0 0 3.6 17l-1.4 4.9 5-1.3A9.8 9.8 0 1 0 12 2.2Zm0 17.9c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.1 8.1 0 1 1 12 20.1Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.5 1 2.7.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
      <Path d={PATHS[name]} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill={fill} />
    </Svg>
  );
}

/* ---------- motion ---------- */

/** Fades + rises in on mount; `delay` staggers lists. */
export function FadeIn({ delay = 0, children, style }: { delay?: number; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 420, delay, useNativeDriver: true }).start();
  }, [v, delay]);
  return <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>{children}</Animated.View>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pressable that springs down a little on touch, with a light haptic. `style` lands on the pressable itself, so absolute positioning works. */
export function Tap({ children, style, onPress, haptic = true, ...rest }: PressableProps & { style?: StyleProp<ViewStyle>; haptic?: boolean; children: React.ReactNode }) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (n: number) => Animated.spring(s, { toValue: n, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={() => to(0.97)}
      onPressOut={() => to(1)}
      onPress={(e) => {
        if (haptic) Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}
      style={[style, { transform: [{ scale: s }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}

/* ---------- controls ---------- */

export function Button({ title, onPress, variant = "primary", icon, disabled, style }: { title: string; onPress: () => void; variant?: "primary" | "whatsapp" | "outline" | "light"; icon?: IconName; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  const bg = { primary: C.brand, whatsapp: C.whatsapp, outline: "transparent", light: C.white }[variant];
  const fg = { primary: C.white, whatsapp: C.white, outline: C.brand, light: C.brand }[variant];
  return (
    <Tap onPress={disabled ? undefined : onPress} style={[styles.btn, { backgroundColor: bg, opacity: disabled ? 0.45 : 1 }, variant === "outline" && { borderWidth: 1.5, borderColor: C.brand }, style]}>
      {icon && <Icon name={icon} size={18} color={fg} />}
      <T w="bold" size={15.5} color={fg}>
        {title}
      </T>
    </Tap>
  );
}

export function Chip({ label, active, onPress, tone = "brand" }: { label: string; active: boolean; onPress: () => void; tone?: "brand" | "mint" }) {
  const on = tone === "mint" ? { backgroundColor: C.mint, borderColor: C.brand } : { backgroundColor: C.brand, borderColor: C.brand };
  return (
    <Tap onPress={onPress} style={[styles.chip, active ? on : null]}>
      <T w="semibold" size={13.5} color={active ? (tone === "mint" ? C.brand : C.white) : C.ink2}>
        {label}
      </T>
    </Tap>
  );
}

export function Field({ label, error, hint, ...props }: TextInputProps & { label: string; error?: string; hint?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <T w="semibold" size={13}>
        {label} {hint ? <T size={13} color={C.muted}>{hint}</T> : null}
      </T>
      <TextInput placeholderTextColor={C.muted} {...props} style={[styles.input, error ? { borderColor: C.warn } : null, props.style]} />
      {error ? (
        <T w="medium" size={12.5} color={C.warn}>
          {error}
        </T>
      ) : null}
    </View>
  );
}

export function Tag({ label, tone = "mint" }: { label: string; tone?: "mint" | "ivory" | "white" }) {
  const bg = { mint: C.mint, ivory: C.ivory, white: "rgba(255,255,255,0.95)" }[tone];
  return (
    <View style={{ backgroundColor: bg, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 5 }}>
      <T w="semibold" size={11.5} color={tone === "mint" ? C.brand : C.ink2}>
        {label}
      </T>
    </View>
  );
}

/* ---------- listing card ---------- */

export function tagsFor(l: Listing): string[] {
  const t: string[] = [];
  if (l.billsIncluded) t.push("Bills included");
  if (!l.deposit) t.push("No deposit");
  if (!l.commission) t.push("No commission");
  return t;
}
const GENDER = { male: "Male only", female: "Female only", any: "Mixed" } as const;

export function ListingCard({ listing, width, delay = 0 }: { listing: Listing; width?: number; delay?: number }) {
  const { areaBySlug, saved, toggleSaved } = useData();
  const area = areaBySlug.get(listing.areaSlug)?.name ?? listing.areaName ?? "";
  const isSaved = saved.has(listing.id);
  return (
    <FadeIn delay={delay} style={width ? { width } : undefined}>
      <Tap onPress={() => router.push(`/listing/${listing.id}`)} style={[styles.card, shadow]}>
        <View>
          <Image source={{ uri: listing.photos[0] }} style={styles.cardImg} contentFit="cover" transition={250} placeholder={{ blurhash: "L6Pj0^jE.AyE_3t7t7R**0o#DgR4" }} />
          <View style={{ position: "absolute", left: 10, top: 10, flexDirection: "row", gap: 6 }}>
            <Tag label={listing.typeName ?? TYPE_LABEL[listing.type]} tone="white" />
            {listing.verifiedLister ? <Tag label="Verified" /> : null}
          </View>
          <Tap onPress={() => toggleSaved(listing.id)} style={styles.heart} hitSlop={8}>
            <Icon name="heart" size={18} color={isSaved ? C.brand : C.ink} fill={isSaved ? C.brand : "none"} />
          </Tap>
          <View style={styles.pricePill}>
            {listing.priceMaxAed ? <T size={13} color={C.muted}>From </T> : null}
            <T w="extrabold" size={15}>
              {aed(listing.priceAed)}
            </T>
            <T w="medium" size={13} color={C.muted}>
              /mo
            </T>
          </View>
        </View>
        <View style={{ padding: 12, paddingTop: 12, gap: 6 }}>
          <T w="bold" size={15.5} numberOfLines={1}>
            {listing.title}
          </T>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Icon name="pin" size={14} color={C.brand} />
            <T size={13} color={C.muted} numberOfLines={1} style={{ flex: 1 }}>
              {area}
              {listing.nearMetroMinutes != null ? ` · ${listing.nearMetroMinutes} min to ${listing.metro ?? "metro"}` : ""}
            </T>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
            {tagsFor(listing)
              .slice(0, 2)
              .map((t) => (
                <Tag key={t} label={t} />
              ))}
            <Tag label={GENDER[listing.gender]} tone="ivory" />
          </View>
        </View>
      </Tap>
    </FadeIn>
  );
}

export const styles = StyleSheet.create({
  btn: { height: 52, borderRadius: R.pill, paddingHorizontal: 22, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  chip: { height: 38, paddingHorizontal: 16, borderRadius: R.pill, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, justifyContent: "center" },
  input: { height: 50, borderRadius: R.md, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, paddingHorizontal: 14, fontFamily: F.regular, fontSize: 15.5, color: C.ink },
  card: { backgroundColor: C.white, borderRadius: R.xl - 4, borderWidth: 1, borderColor: C.line, padding: 6 },
  cardImg: { width: "100%", aspectRatio: 4 / 3, borderRadius: R.lg - 4, backgroundColor: C.ivory },
  heart: { position: "absolute", right: 10, top: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.95)", alignItems: "center", justifyContent: "center" },
  pricePill: { position: "absolute", left: 10, bottom: 10, flexDirection: "row", alignItems: "baseline", backgroundColor: C.white, borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 6 },
});
