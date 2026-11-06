import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { activity, activityBars, fluency, lessons, stats, week, wordMastery, words } from '@/data';
import { PressableScale, TiltCard, useCountUp } from '@/components/motion';
import { colors, radius } from '@/theme';

const TABS = ['Aperçu', 'Mots', 'Thèmes', 'Activité'] as const;
type Tab = (typeof TABS)[number];

export default function Progress() {
  const [tab, setTab] = useState<Tab>('Aperçu');
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Animated.View entering={FadeInDown.springify()} style={s.header}>
        <Text style={s.h1}>Progrès</Text>
        <View style={s.iconBtn}>
          <Ionicons name="calendar-outline" size={20} color={colors.ink} />
        </View>
      </Animated.View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.tabsScroll}
        contentContainerStyle={s.tabs}
      >
        {TABS.map((t, i) => (
          <Animated.View key={t} entering={FadeInDown.delay(60 + i * 60).springify()}>
            <TabPill label={t} active={t === tab} onPress={() => setTab(t)} />
          </Animated.View>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={s.content}>
        {/* Changer d'onglet remonte le contenu : toutes les animations d'entrée rejouent. */}
        <Animated.View key={tab} entering={FadeIn.duration(250)} style={{ gap: 16 }}>
          {tab === 'Aperçu' && <Overview />}
          {tab === 'Mots' && <Words />}
          {tab === 'Thèmes' && <Themes />}
          {tab === 'Activité' && <ActivityTab />}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Pastille d'onglet : fond noir → rose en fondu de couleur.
function TabPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const v = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    v.value = withTiming(active ? 1 : 0, { duration: 250 });
  }, [active, v]);
  const a = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(v.value, [0, 1], [colors.ink, '#E57EC0']) }));
  return (
    <PressableScale onPress={onPress} accessibilityState={{ selected: active }}>
      <Animated.View style={[s.pill, a]}>
        <Text style={s.pillText}>{label}</Text>
      </Animated.View>
    </PressableScale>
  );
}

function Overview() {
  const pct = useCountUp(fluency, 1300, 200);
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(200, withTiming(fluency, { duration: 1300, easing: Easing.out(Easing.cubic) }));
  }, [w]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value}%` }));

  return (
    <>
      <Animated.View entering={FadeInDown.delay(80).springify().damping(15)}>
        <TiltCard style={s.fluent} max={8}>
          <Animated.View style={[s.fluentFill, fill]}>
            <LinearGradient
              colors={['#5FA37F', '#4E9470', '#2E7255']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <Text style={s.fluentLabel}>ESPRIT FLUIDE</Text>
          <Text style={s.fluentValue}>{Math.round(pct)}%</Text>
        </TiltCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180).springify().damping(15)} style={s.card}>
        <Text style={s.caps}>MAÎTRISE DES MOTS</Text>
        {wordMastery.map((m, i) => (
          <MasteryBar key={m.label} {...m} delay={350 + i * 150} />
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(280).springify().damping(15)} style={s.card}>
        <Text style={s.caps}>ACTIVITÉ CETTE SEMAINE</Text>
        <View style={s.actRow}>
          <Ionicons name="walk" size={16} color={colors.ink} />
          <Text style={s.actText}>{activity.sessions}</Text>
          <Ionicons name="time" size={16} color={colors.ink} style={{ marginLeft: 16 }} />
          <Text style={s.actText}>{activity.time}</Text>
          <Ionicons name="heart" size={16} color={colors.ink} style={{ marginLeft: 16 }} />
          <Text style={s.actText}>{activity.bpm} bpm</Text>
        </View>
        <View style={s.floatChart}>
          {[0, 1, 2].map((g) => (
            <View key={g} style={[s.grid, { top: 20 + g * 50 }]} />
          ))}
          {activityBars.map((b, i) => (
            <FloatBar key={i} {...b} delay={450 + i * 50} />
          ))}
        </View>
      </Animated.View>
    </>
  );
}

// Barre en pilule contournée + point + trait de rappel vers le %, qui s'étire en ressort.
function MasteryBar({ label, value, color, delay }: { label: string; value: number; color: string; delay: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(delay, withSpring(value, { damping: 16, stiffness: 90 }));
  }, [w, value, delay]);
  const a = useAnimatedStyle(() => ({ width: `${w.value * 0.72}%` }));
  const n = useCountUp(value, 1000, delay);
  return (
    <View style={s.mRow} accessibilityLabel={`${label} ${value}%`}>
      <Animated.View style={[s.mPill, a]}>
        <View style={[s.mFill, { backgroundColor: color }]}>
          <View style={s.mDot} />
        </View>
      </Animated.View>
      <View style={s.mLine} />
      <View style={s.mBadge}>
        <Text style={s.mValue}>{Math.round(n)}%</Text>
      </View>
    </View>
  );
}

function FloatBar({ h, y, c, delay }: { h: number; y: number; c: string; delay: number }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delay, withSpring(h, { damping: 12, stiffness: 120 }));
  }, [v, h, delay]);
  const a = useAnimatedStyle(() => ({ height: v.value }));
  return (
    <View style={s.fCol}>
      <Animated.View style={[s.fBar, { backgroundColor: c, transform: [{ translateY: y }] }, a]} />
    </View>
  );
}

function Words() {
  return words.map((w, i) => (
    <Animated.View key={w.de} entering={FadeInDown.delay(i * 70).springify().damping(15)}>
      <PressableScale
        style={s.wordRow}
        onPress={() => Speech.speak(w.de, { language: 'de-DE', rate: 0.8 })}
        accessibilityLabel={`Écouter ${w.de}`}
      >
        <View style={{ flex: 1 }}>
          <Text style={s.wordDe}>{w.de}</Text>
          <Text style={s.muted}>{w.fr}</Text>
        </View>
        <Grow value={w.value} color={w.value >= 90 ? colors.green : w.value >= 60 ? colors.gold : '#E57EC0'} delay={200 + i * 70} width={80} />
        <Ionicons name="volume-medium" size={18} color={colors.muted} />
      </PressableScale>
    </Animated.View>
  ));
}

function Themes() {
  return lessons.map((l, i) => (
    <Animated.View key={l.id} entering={FadeInDown.delay(i * 100).springify().damping(15)}>
      <TiltCard style={s.card} max={6}>
        <View style={s.cardHead}>
          <Text style={s.h2}>{l.title}</Text>
          <Text style={s.value}>{l.done}%</Text>
        </View>
        <Text style={s.muted}>{l.subtitle}</Text>
        <Grow value={l.done} color={colors.teal} delay={250 + i * 100} />
      </TiltCard>
    </Animated.View>
  ));
}

function ActivityTab() {
  const max = Math.max(...week.map((d) => d.minutes));
  const tiles = [
    { icon: 'book' as const, value: stats.words, label: 'mots', dec: 0 },
    { icon: 'repeat' as const, value: stats.sessions, label: 'séances', dec: 0 },
    { icon: 'navigate' as const, value: stats.km, label: 'km', dec: 1 },
    { icon: 'checkmark-done' as const, value: stats.accuracy, label: '% précision', dec: 0 },
  ];
  return (
    <>
      <View style={s.tiles}>
        {tiles.map((t, i) => (
          <Animated.View key={t.label} entering={FadeInDown.delay(i * 80).springify()} style={s.tile}>
            <StatTile {...t} />
          </Animated.View>
        ))}
      </View>
      <Animated.View entering={FadeInDown.delay(300).springify()} style={s.card}>
        <Text style={s.h2}>Minutes par jour</Text>
        <View style={s.chart}>
          {week.map((d, i) => (
            <View key={i} style={s.col}>
              <View style={s.barTrack}>
                <GrowUp pct={(d.minutes / max) * 100} color={i === 5 ? colors.lime : colors.green} delay={400 + i * 70} />
              </View>
              <Text style={s.day}>{d.day}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </>
  );
}

function StatTile({ icon, value, label, dec }: { icon: 'book' | 'repeat' | 'navigate' | 'checkmark-done'; value: number; label: string; dec: number }) {
  const n = useCountUp(value, 1200, 150);
  return (
    <>
      <Ionicons name={icon} size={18} color={colors.green} />
      <Text style={s.statValue}>{n.toFixed(dec)}</Text>
      <Text style={s.muted}>{label}</Text>
    </>
  );
}

// Barre horizontale qui se remplit.
function Grow({ value, color, delay, width }: { value: number; color: string; delay: number; width?: number }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delay, withTiming(value, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [v, value, delay]);
  const a = useAnimatedStyle(() => ({ width: `${v.value}%` }));
  return (
    <View style={[s.track, width ? { width } : null]}>
      <Animated.View style={[s.fill, { backgroundColor: color }, a]} />
    </View>
  );
}

// Colonne verticale qui pousse depuis le bas.
function GrowUp({ pct, color, delay }: { pct: number; color: string; delay: number }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delay, withSpring(pct, { damping: 14, stiffness: 110 }));
  }, [v, pct, delay]);
  const a = useAnimatedStyle(() => ({ height: `${v.value}%` }));
  return <Animated.View style={[s.bar, { backgroundColor: color }, a]} />;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  h1: { fontSize: 32, fontWeight: '700', color: colors.ink },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsScroll: { flexGrow: 0 },
  tabs: { gap: 8, paddingHorizontal: 16, paddingVertical: 14 },
  pill: { borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 10 },
  pillText: { color: colors.white, fontSize: 15, fontWeight: '500' },
  content: { padding: 16, paddingTop: 4, paddingBottom: 32 },
  h2: { fontSize: 18, fontWeight: '700', color: colors.ink },
  caps: { fontSize: 11, fontWeight: '700', color: colors.ink, letterSpacing: 0.5 },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 20, gap: 14 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  muted: { fontSize: 13, color: colors.muted },
  value: { fontSize: 14, fontWeight: '700', color: colors.ink },
  fluent: {
    height: 140,
    borderRadius: radius.lg,
    backgroundColor: '#B5D8C4',
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  fluentFill: { position: 'absolute', top: 0, bottom: 0, left: 0 },
  fluentLabel: { fontSize: 11, fontWeight: '700', color: colors.white, letterSpacing: 0.5 },
  fluentValue: { fontSize: 64, fontWeight: '500', color: colors.white, letterSpacing: -2 },
  mRow: { flexDirection: 'row', alignItems: 'center', height: 40 },
  mPill: { height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: colors.ink, padding: 3, minWidth: 40 },
  mFill: { flex: 1, borderRadius: 15, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 12 },
  mDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.ink },
  mLine: { flex: 1, height: 1, backgroundColor: colors.ink, marginLeft: -12 },
  mBadge: { backgroundColor: colors.paper, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  mValue: { fontSize: 15, color: colors.ink, fontWeight: '500' },
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actText: { fontSize: 16, color: colors.ink },
  floatChart: { height: 150, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grid: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.line },
  fCol: { width: 12, alignItems: 'center', justifyContent: 'center', height: '100%' },
  fBar: { width: 12, borderRadius: 6 },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 16,
  },
  wordDe: { fontSize: 17, fontWeight: '600', color: colors.ink },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48%', flexGrow: 1, backgroundColor: colors.white, borderRadius: radius.md, padding: 14, gap: 4 },
  statValue: { fontSize: 26, fontWeight: '700', color: colors.ink },
  chart: { flexDirection: 'row', height: 140, gap: 8 },
  col: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', backgroundColor: colors.paper, borderRadius: 8 },
  bar: { width: '100%', borderRadius: 8 },
  day: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.paper, flexShrink: 1 },
  fill: { height: 8, borderRadius: 4 },
});
