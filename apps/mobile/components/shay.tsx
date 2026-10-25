import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, RadialGradient, Stop } from "react-native-svg";

export type ShayMood = "idle" | "talking" | "thinking" | "happy";

// Same blob as the website and the app icon (viewBox 120×120).
const BLOB = "M58 4C92 2 116 20 116 56C116 94 94 116 60 116C25 116 4 96 4 60C4 26 24 6 58 4Z";

/**
 * Shay — the Stayshay assistant: a breathing green blob with two glowing capsule eyes.
 * Blinks and glances when idle, bounces its eyes while talking, looks up while thinking,
 * and turns its eyes into happy arches when greeting.
 */
export function Shay({ size = 64, mood = "idle", glow = true }: { size?: number; mood?: ShayMood; glow?: boolean }) {
  const breathe = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(1)).current;
  const look = useRef(new Animated.Value(0)).current;
  const talk = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loops = [
      Animated.loop(Animated.sequence([Animated.timing(breathe, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }), Animated.timing(breathe, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true })])),
      Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true }), Animated.timing(pulse, { toValue: 0, duration: 1600, useNativeDriver: true })])),
      Animated.loop(Animated.sequence([Animated.delay(3800), Animated.timing(blink, { toValue: 0.08, duration: 90, useNativeDriver: true }), Animated.timing(blink, { toValue: 1, duration: 110, useNativeDriver: true })])),
      Animated.loop(
        Animated.sequence([
          Animated.delay(2400),
          Animated.timing(look, { toValue: -1, duration: 350, useNativeDriver: true }),
          Animated.delay(900),
          Animated.timing(look, { toValue: 1, duration: 450, useNativeDriver: true }),
          Animated.delay(900),
          Animated.timing(look, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]),
      ),
    ];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [breathe, pulse, blink, look]);

  useEffect(() => {
    if (mood !== "talking") {
      talk.setValue(0);
      return;
    }
    const l = Animated.loop(Animated.sequence([Animated.timing(talk, { toValue: 1, duration: 200, useNativeDriver: true }), Animated.timing(talk, { toValue: 0, duration: 200, useNativeDriver: true })]));
    l.start();
    return () => l.stop();
  }, [mood, talk]);

  const eyeW = size * 0.12;
  const eyeH = size * 0.27;
  const gap = size * 0.16;
  const shiftX = look.interpolate({ inputRange: [-1, 1], outputRange: [-size * 0.07, size * 0.07] });
  const thinkY = mood === "thinking" ? -size * 0.07 : 0;

  const eye =
    mood === "happy" ? (
      // Happy: glowing arches (^ ^)
      <View style={{ width: size * 0.17, height: size * 0.15, borderTopLeftRadius: 999, borderTopRightRadius: 999, borderWidth: size * 0.05, borderBottomWidth: 0, borderColor: "#F4FFF9", shadowColor: "#6EE7B7", shadowOpacity: 0.9, shadowRadius: size * 0.08, shadowOffset: { width: 0, height: 0 } }} />
    ) : (
      <Animated.View
        style={{
          width: eyeW,
          height: eyeH,
          borderRadius: 999,
          backgroundColor: "#F4FFF9",
          shadowColor: "#6EE7B7",
          shadowOpacity: 0.95,
          shadowRadius: size * 0.1,
          shadowOffset: { width: 0, height: 0 },
          transform: [{ scaleY: Animated.multiply(blink, talk.interpolate({ inputRange: [0, 1], outputRange: [1, 0.62] })) }],
        }}
      />
    );

  return (
    <View style={{ width: size, height: size }}>
      {glow && (
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1.15, 1.4] }) }], opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.95] }) }]}>
          <Svg width={size} height={size} viewBox="0 0 120 120">
            <Defs>
              <RadialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
                <Stop offset="0" stopColor="#6EE7B7" stopOpacity="0.55" />
                <Stop offset="1" stopColor="#6EE7B7" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Path d="M0 60a60 60 0 1 0 120 0a60 60 0 1 0 -120 0" fill="url(#glow)" />
          </Svg>
        </Animated.View>
      )}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scaleX: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] }) }, { scaleY: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 0.975] }) }] }]}>
        <Svg width={size} height={size} viewBox="0 0 120 120">
          <Defs>
            <LinearGradient id="body" x1="0.1" y1="0" x2="0.9" y2="1">
              <Stop offset="0" stopColor="#3FD99A" />
              <Stop offset="0.4" stopColor="#27AE78" />
              <Stop offset="1" stopColor="#145C46" />
            </LinearGradient>
            <RadialGradient id="shine" cx="0.3" cy="0.2" r="0.45">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.5" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Path d={BLOB} fill="url(#body)" />
          <Path d={BLOB} fill="url(#shine)" />
        </Svg>
        <Animated.View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center", flexDirection: "row", gap, paddingTop: size * 0.06, transform: [{ translateX: mood === "thinking" ? size * 0.05 : shiftX }, { translateY: thinkY }] }}>
          {eye}
          {eye}
        </Animated.View>
      </Animated.View>
    </View>
  );
}
