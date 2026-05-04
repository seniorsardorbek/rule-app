import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { storage } from "../../services/storage";
import { useThemeColors } from "../../theme/colors";

const STORAGE_KEY = "rule_constructor_pos";
const SIZE = 56;
const MARGIN = 16;
const DRAG_THRESHOLD = 6;

interface Pos {
  x: number;
  y: number;
}

interface Props {
  onPress: () => void;
}

export function FloatingButton({ onPress }: Props) {
  const c = useThemeColors();
  const { width: initialW, height: initialH } = Dimensions.get("window");
  const initialX = initialW - SIZE - MARGIN;
  const initialY = initialH - SIZE - 140;
  const pos = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;
  const dragged = useRef(false);
  const start = useRef<Pos>({ x: initialX, y: initialY });
  // Re-read onPress on every render via ref so the PanResponder closure stays correct.
  const onPressRef = useRef(onPress);
  useEffect(() => {
    onPressRef.current = onPress;
  }, [onPress]);

  useEffect(() => {
    let cancelled = false;
    storage.getItem(STORAGE_KEY).then((raw) => {
      if (cancelled || !raw) return;
      try {
        const saved = JSON.parse(raw) as Pos;
        const { width, height } = Dimensions.get("window");
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
  }, [pos]);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        dragged.current = false;
        pos.extractOffset();
      },
      onPanResponderMove: (_, g) => {
        if (
          !dragged.current &&
          (Math.abs(g.dx) > DRAG_THRESHOLD || Math.abs(g.dy) > DRAG_THRESHOLD)
        ) {
          dragged.current = true;
        }
        if (dragged.current) {
          pos.setValue({ x: g.dx, y: g.dy });
        }
      },
      onPanResponderRelease: (_, g) => {
        pos.flattenOffset();
        if (!dragged.current) {
          // Pure tap — open the dialog. Do not animate; position is unchanged.
          onPressRef.current();
          return;
        }
        const { width, height } = Dimensions.get("window");
        const rawX = start.current.x + g.dx;
        const rawY = start.current.y + g.dy;
        const snapX =
          rawX + SIZE / 2 < width / 2 ? MARGIN : width - SIZE - MARGIN;
        const finalY = clamp(rawY, 80, height - SIZE - 80);
        Animated.spring(pos, {
          toValue: { x: snapX, y: finalY },
          useNativeDriver: false,
          friction: 8,
          tension: 60,
        }).start(() => {
          start.current = { x: snapX, y: finalY };
          storage.setItem(STORAGE_KEY, JSON.stringify({ x: snapX, y: finalY }));
        });
      },
      onPanResponderTerminate: () => {
        pos.flattenOffset();
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
    >
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
          pointerEvents="none"
        />
        <Ionicons name="sparkles" size={26} color="#fff" />
      </LinearGradient>
    </Animated.View>
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
