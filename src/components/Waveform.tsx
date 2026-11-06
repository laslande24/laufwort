import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/theme';

const BARS = 26;
const IDLE = Array.from({ length: BARS }, (_, i) => 6 + ((i * 7) % 5) * 3);

// Onde décorative : les barres rebondissent (ressorts) pendant que la voix parle. Pas d'analyse audio réelle.
export function Waveform({ active, listening }: { active: boolean; listening: boolean }) {
  const [heights, setHeights] = useState(IDLE);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setHeights(Array.from({ length: BARS }, () => 8 + Math.random() * 92)), 140);
    return () => clearInterval(t);
  }, [active]);

  // La tête de lecture flotte doucement ; elle vire au rose quand c'est à toi de parler.
  const f = useSharedValue(0);
  useEffect(() => {
    f.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [f]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateY: f.value * -6 }, { scale: 1 + f.value * 0.25 }] }));

  return (
    <View style={s.row}>
      <View style={s.bars}>
        {(active ? heights : IDLE).map((h, i) => (
          <Bar key={i} h={h} dim={!active} />
        ))}
      </View>
      <View style={s.head}>
        <Animated.View style={[s.knob, listening && { backgroundColor: colors.pink }, knob]} />
        <View style={s.stick} />
      </View>
      <View style={s.dash} />
    </View>
  );
}

function Bar({ h, dim }: { h: number; dim: boolean }) {
  const v = useSharedValue(h);
  useEffect(() => {
    v.value = withSpring(h, { damping: 10, stiffness: 180 });
  }, [h, v]);
  const a = useAnimatedStyle(() => ({ height: v.value, opacity: withTiming(dim ? 0.6 : 1) }));
  return <Animated.View style={[s.bar, a]} />;
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', height: 130 },
  bars: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bar: { width: 2, borderRadius: 1, backgroundColor: colors.white },
  head: { alignItems: 'center', marginHorizontal: 6 },
  knob: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.lime },
  stick: { width: 2, height: 110, backgroundColor: colors.lime },
  dash: { flex: 1, borderTopWidth: 2, borderColor: colors.ink, borderStyle: 'dashed', opacity: 0.6 },
});
