import { ReactNode, useEffect, useState } from 'react';
import { Platform, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

const spring = { damping: 14, stiffness: 220, mass: 0.6 };
const tap = () => Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

const APressable = Animated.createAnimatedComponent(Pressable);

// Bouton qui s'enfonce avec un ressort au toucher.
export function PressableScale({
  style,
  children,
  scaleTo = 0.95,
  onPressIn,
  onPressOut,
  ...rest
}: PressableProps & { style?: StyleProp<ViewStyle>; children?: ReactNode; scaleTo?: number }) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <APressable
      accessibilityRole="button"
      {...rest}
      onPressIn={(e) => {
        s.set(withSpring(scaleTo, spring));
        tap();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.set(withSpring(1, spring));
        onPressOut?.(e);
      }}
      style={[style, a]}
    >
      {children}
    </APressable>
  );
}

// Carte qui s'incline en 3D sous le doigt (rotateX/rotateY + perspective), puis revient en ressort.
export function TiltCard({
  style,
  children,
  onPress,
  max = 10,
  accessibilityLabel,
}: {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  onPress?: () => void;
  max?: number;
  accessibilityLabel?: string;
}) {
  const w = useSharedValue(1);
  const h = useSharedValue(1);
  const rx = useSharedValue(0);
  const ry = useSharedValue(0);
  const sc = useSharedValue(1);

  const tilt = (x: number, y: number) => {
    'worklet';
    ry.value = withSpring(interpolate(x, [0, w.value], [-max, max]), spring);
    rx.value = withSpring(interpolate(y, [0, h.value], [max, -max]), spring);
  };
  const reset = () => {
    'worklet';
    rx.value = withSpring(0, spring);
    ry.value = withSpring(0, spring);
    sc.value = withSpring(1, spring);
  };

  // Le pan laisse passer le scroll vertical (failOffsetY) mais incline dès le toucher.
  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-12, 12])
    .onBegin((e) => {
      sc.value = withSpring(0.97, spring);
      tilt(e.x, e.y);
    })
    .onUpdate((e) => tilt(e.x, e.y))
    .onFinalize(reset);
  const press = Gesture.Tap()
    .maxDuration(600)
    .runOnJS(true)
    .onEnd((_e, ok) => {
      if (ok) {
        tap();
        onPress?.();
      }
    });

  const a = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateX: `${rx.value}deg` },
      { rotateY: `${ry.value}deg` },
      { scale: sc.value },
    ],
  }));

  return (
    <GestureDetector gesture={Gesture.Simultaneous(pan, press)}>
      <Animated.View
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onLayout={(e) => {
          w.value = e.nativeEvent.layout.width;
          h.value = e.nativeEvent.layout.height;
        }}
        style={[style, a]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

// Halo qui respire derrière un élément (bouton play, micro, phase en cours).
export function Pulse({ color, size, duration = 1600 }: { color: string; size: number; duration?: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration, easing: Easing.out(Easing.quad) }), -1, false);
  }, [p, duration]);
  const a = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 1], [0.5, 0]),
    transform: [{ scale: interpolate(p.value, [0, 1], [1, 1.6]) }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color }, a]}
    />
  );
}

// Compteur qui monte de 0 à la valeur (ease-out).
export function useCountUp(target: number, duration = 1100, delay = 0) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = Date.now() + delay;
    const step = () => {
      const t = Math.min(1, Math.max(0, (Date.now() - start) / duration));
      setV(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, delay]);
  return v;
}
