import { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";
import { C } from "@/lib/theme";

/**
 * Shay, the Stayshay assistant (same drawing as the website's mascot). Floats, blinks every few seconds,
 * waves its hand now and then (constantly while `waving`), and opens its mouth while `talking`.
 */
export function Shay({ size = 64, waving = false, talking = false }: { size?: number; waving?: boolean; talking?: boolean }) {
  const float = useRef(new Animated.Value(0)).current;
  const [blink, setBlink] = useState(false);
  const [arm, setArm] = useState(0);
  const [mouth, setMouth] = useState(false);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    const b = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 4200);
    return () => {
      loop.stop();
      clearInterval(b);
    };
  }, [float]);

  // Wave: four quick swings every ~6s, or non-stop while `waving`.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    let i = 0;
    const swing = () => {
      const angles = [-22, 14, -22, 14, 0];
      if (i < angles.length) {
        setArm(angles[i++]);
        t = setTimeout(swing, 160);
      } else {
        i = 0;
        t = setTimeout(swing, waving ? 200 : 6000);
      }
    };
    t = setTimeout(swing, waving ? 0 : 1500);
    return () => clearTimeout(t);
  }, [waving]);

  useEffect(() => {
    if (!talking) return setMouth(false);
    const m = setInterval(() => setMouth((v) => !v), 180);
    return () => clearInterval(m);
  }, [talking]);

  const eye = (cx: number) =>
    blink ? (
      <Path d={`M${cx - 10} ${58} Q${cx} ${62} ${cx + 10} ${58}`} stroke={C.white} strokeWidth={3.5} strokeLinecap="round" fill="none" />
    ) : (
      <G>
        <Ellipse cx={cx} cy={58} rx={11} ry={13} fill={C.white} />
        <Circle cx={cx + 2} cy={60} r={6.5} fill={C.ink} />
        <Circle cx={cx + 4.5} cy={56.5} r={2.4} fill={C.white} />
      </G>
    );

  return (
    <Animated.View style={{ transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.04] }) }] }}>
      <Svg width={size} height={(size * 150) / 140} viewBox="0 0 140 150">
        <G rotation={arm} origin="98, 72">
          <Path d="M98 70 Q114 62 120 44" stroke={C.brand} strokeWidth={9} strokeLinecap="round" fill="none" />
          <Circle cx={121} cy={40} r={9.5} fill={C.brand} />
        </G>
        <Path d="M44 98 Q60 120 70 142 Q80 120 96 98Z" fill={C.brand} />
        <Circle cx={70} cy={62} r={44} fill={C.brand} />
        <Ellipse cx={44} cy={76} rx={7} ry={4.5} fill="#F7A8A0" opacity={0.55} />
        <Ellipse cx={96} cy={76} rx={7} ry={4.5} fill="#F7A8A0" opacity={0.55} />
        {eye(53)}
        {eye(87)}
        {talking && mouth ? <Ellipse cx={70} cy={83} rx={7} ry={5} fill="#0C3A2C" /> : <Path d="M60 80 Q70 89 80 80" stroke={C.mint} strokeWidth={4.2} strokeLinecap="round" fill="none" />}
        <Ellipse cx={70} cy={146} rx={15} ry={3} fill={C.ink} opacity={0.14} />
      </Svg>
    </Animated.View>
  );
}
