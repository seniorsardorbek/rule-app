import { useEffect, useRef } from "react";
import { Animated, Dimensions, PanResponder, Platform, Pressable, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { storage } from "../../services/storage";
import { useThemeColors } from "../../theme/colors";

const STORAGE_KEY = "rule_constructor_pos";
const SIZE = 56;
const MARGIN = 16;

interface Pos {
  x: number;
  y: number;
}

interface Props {
  onPress: () => void;
}

export function FloatingButton({ onPress }: Props) {
  const c = useThemeColors();
  const { width, height } = Dimensions.get("window");
  const pos = useRef(
    new Animated.ValueXY({
      x: width - SIZE - MARGIN,
      y: height - SIZE - 140,
    }),
  ).current;
  const dragged = useRef(false);
  const start = useRef<Pos>({ x: width - SIZE - MARGIN, y: height - SIZE - 140 });

  useEffect(() => {
    let cancelled = false;
    storage.getItem(STORAGE_KEY).then((raw) => {
      if (cancelled || !raw) return;
      try {
        const saved = JSON.parse(raw) as Pos;
        const x = clamp(saved.x, MARGIN, width - SIZE - MARGIN);
        const y = clamp(saved.y, 60, height - SIZE - 60);
        pos.setValue({ x, y });
        start.current = { x, y };
      } catch {
        // ignore
      }
    });
    return () => {
      cancelled = true;
    };
  }, [width, height, pos]);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        dragged.current = false;
        pos.extractOffset();
      },
      onPanResponderMove: (_, g) => {
        if (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4) dragged.current = true;
        pos.setValue({ x: g.dx, y: g.dy });
      },
      onPanResponderRelease: (_, g) => {
        pos.flattenOffset();
        const w = Dimensions.get("window").width;
        const h = Dimensions.get("window").height;
        const rawX = start.current.x + g.dx;
        const rawY = start.current.y + g.dy;
        const snapX =
          rawX + SIZE / 2 < w / 2 ? MARGIN : w - SIZE - MARGIN;
        const finalY = clamp(rawY, 80, h - SIZE - 80);
        Animated.spring(pos, {
          toValue: { x: snapX, y: finalY },
          useNativeDriver: false,
          friction: 8,
          tension: 60,
        }).start(() => {
          start.current = { x: snapX, y: finalY };
          storage.setItem(STORAGE_KEY, JSON.stringify({ x: snapX, y: finalY }));
        });
        if (!dragged.current) onPress();
      },
    }),
  ).current;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: SIZE,
          height: SIZE,
          ...(Platform.OS === "web" ? ({ zIndex: 999 } as any) : {}),
        },
        pos.getLayout(),
      ]}
      {...responder.panHandlers}
      pointerEvents="box-none"
    >
      <Pressable onPress={() => !dragged.current && onPress()}>
        <LinearGradient
          colors={[c.primary, c.primaryDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: SIZE,
            height: SIZE,
            borderRadius: SIZE / 2,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: c.primary,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.45,
            shadowRadius: 20,
            elevation: 8,
          }}
        >
          <View
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: c.success,
              borderWidth: 2,
              borderColor: "#fff",
            }}
          />
          <Ionicons name="sparkles" size={26} color="#fff" />
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
