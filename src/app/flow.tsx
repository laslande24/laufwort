import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { levelColor, levelLabel, mmss, phases } from '@/data';
import { PressableScale, Pulse } from '@/components/motion';
import { colors, radius } from '@/theme';

const hint = {
  easy: 'Phrases complètes, voix lente',
  medium: 'Phrases plus longues',
  hard: 'Mots-clés courts, pauses plus longues',
};
const ROW = 140;

export default function Flow() {
  const { phase } = useLocalSearchParams<{ phase?: string }>();
  const current = phase === undefined ? -1 : Number(phase);

  // La ligne verticale se « dessine » de haut en bas.
  const line = useSharedValue(0);
  useEffect(() => {
    line.value = withDelay(200, withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.cubic) }));
  }, [line]);
  const lineStyle = useAnimatedStyle(() => ({ height: line.value * ROW * (phases.length - 1) }));

  return (
    <SafeAreaView style={s.safe}>
      <Animated.View entering={FadeInDown.springify()} style={s.header}>
        <PressableScale style={s.close} onPress={() => router.back()} accessibilityLabel="Fermer">
          <Ionicons name="close" size={22} color={colors.ink} />
        </PressableScale>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.title}>Flux d’effort</Text>
          <Text style={s.sub}>Ton activité pilote la leçon</Text>
        </View>
        <View style={s.close}>
          <Ionicons name="bar-chart" size={18} color={colors.ink} />
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={s.list}>
        <View>
          <Animated.View style={[s.line, lineStyle]} />
          {phases.map((p, i) => {
            const on = i === current;
            const d = 250 + i * 220; // chaque phase arrive quand la ligne l'atteint
            return (
              <View key={p.key} style={s.row}>
                <Animated.View entering={FadeInLeft.delay(d).springify().damping(16)} style={s.left}>
                  <Text style={s.phaseLabel}>{p.label.toUpperCase()}</Text>
                  <Text style={s.level}>{levelLabel[p.level]}</Text>
                  <Text style={s.hint}>{hint[p.level]}</Text>
                </Animated.View>
                <View style={s.mid}>
                  {on && <Pulse color={levelColor[p.level]} size={96} />}
                  <Animated.View
                    entering={ZoomIn.delay(d).springify().damping(10)}
                    style={[s.bubble, { backgroundColor: levelColor[p.level] }, on && s.bubbleOn]}
                  >
                    <Ionicons name={p.icon} size={on ? 34 : 28} color={colors.ink} />
                  </Animated.View>
                </View>
                <Animated.View entering={FadeInRight.delay(d + 80).springify().damping(16)} style={s.right}>
                  <Text style={s.time}>{mmss(p.seconds)}</Text>
                  <Text style={s.bpm}>{p.bpm} bpm</Text>
                  {on && <Text style={s.now}>EN COURS</Text>}
                </Animated.View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Animated.View entering={FadeInUp.delay(1200).springify()} style={s.footer}>
        <View style={s.autoRow}>
          <Ionicons name="checkmark-circle" size={16} color={colors.green} />
          <Text style={s.auto}>Auto-adaptatif</Text>
        </View>
        <Text style={s.footText}>Difficulté et pauses selon ton pouls</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '600', color: colors.ink },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  list: { paddingVertical: 24 },
  line: { position: 'absolute', top: ROW / 2, left: '50%', marginLeft: -1, width: 2, backgroundColor: colors.line },
  row: { flexDirection: 'row', alignItems: 'center', height: ROW },
  left: { flex: 1, alignItems: 'flex-end', paddingRight: 16 },
  phaseLabel: { fontSize: 11, fontWeight: '700', color: colors.ink, letterSpacing: 0.5 },
  level: { fontSize: 22, fontWeight: '500', color: colors.ink, marginTop: 2 },
  hint: { fontSize: 11, color: colors.muted, textAlign: 'right', marginTop: 2 },
  mid: { width: 96, height: '100%', alignItems: 'center', justifyContent: 'center' },
  bubble: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  bubbleOn: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: colors.ink },
  right: { flex: 1, paddingLeft: 16 },
  time: { fontSize: 22, fontWeight: '500', color: colors.ink },
  bpm: { fontSize: 13, color: colors.muted, marginTop: 2 },
  now: { fontSize: 11, fontWeight: '700', color: colors.green, marginTop: 4, letterSpacing: 0.5 },
  footer: { alignItems: 'center', backgroundColor: colors.paper, borderRadius: radius.md, padding: 16, marginBottom: 16 },
  autoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  auto: { fontSize: 13, color: colors.ink, fontWeight: '600' },
  footText: { fontSize: 15, color: colors.ink, marginTop: 4 },
});
