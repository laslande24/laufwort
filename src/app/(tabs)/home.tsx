import { useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import Animated, {
  Extrapolation,
  FadeInDown,
  FadeInRight,
  SharedValue,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { lessons, user } from '@/data';
import { PressableScale, Pulse, TiltCard } from '@/components/motion';
import { colors, radius } from '@/theme';

const modeIcon = { Course: 'walk', Marche: 'footsteps', Vélo: 'bicycle' } as const;
const cardTints = [colors.green, colors.teal, colors.gold, colors.ink];
const daily = lessons.flatMap((l) => [l.phrases.easy[0], l.phrases.medium[0]]).slice(0, 5);

export default function Home() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [today, ...others] = lessons;
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });

  // En-tête compact qui apparaît quand le grand titre sort de l'écran.
  const compact = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [40, 90], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(y.value, [40, 90], [-8, 0], Extrapolation.CLAMP) }],
  }));
  // Grand titre : parallaxe + fondu.
  const bigHeader = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [0, 70], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(y.value, [-100, 0, 100], [-30, 0, 40], Extrapolation.CLAMP) }],
  }));
  // Carte héro : rétrécit et bascule légèrement en arrière au scroll.
  const hero = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { scale: interpolate(y.value, [-120, 0, 220], [1.06, 1, 0.9], Extrapolation.CLAMP) },
      { rotateX: `${interpolate(y.value, [0, 220], [0, 14], Extrapolation.CLAMP)}deg` },
    ],
    opacity: interpolate(y.value, [120, 280], [1, 0.3], Extrapolation.CLAMP),
  }));

  const fill = useSharedValue(0);
  useEffect(() => {
    fill.value = withDelay(400, withTiming(today.done, { duration: 1200, easing: Easing.out(Easing.cubic) }));
  }, [fill, today.done]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value}%` }));

  const cardW = width * 0.62;
  const x = useSharedValue(0);
  const onCarousel = useAnimatedScrollHandler((e) => {
    x.value = e.contentOffset.x;
  });

  return (
    <View style={s.safe}>
      <Animated.View style={[s.compact, { paddingTop: insets.top + 8 }, compact]} pointerEvents="none">
        <Text style={s.compactText}>Hallo, {user.name}</Text>
      </Animated.View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[s.content, { paddingTop: insets.top + 8 }]}
      >
        <Animated.View style={[s.header, bigHeader]}>
          <Animated.View entering={FadeInDown.duration(500)}>
            <Text style={s.hello}>Hallo, {user.name} 👋</Text>
            <Text style={s.sub}>{user.goal}</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(120).springify()} style={s.streak}>
            <Ionicons name="flame" size={18} color={colors.gold} />
            <Text style={s.streakText}>{user.streak} j</Text>
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).springify().damping(15)} style={hero}>
          <TiltCard
            style={s.hero}
            onPress={() => router.push(`/lesson/${today.id}`)}
            accessibilityLabel={`Démarrer ${today.title}`}
          >
            <Text style={s.heroLabel}>SÉANCE DU JOUR</Text>
            <Text style={s.heroTitle}>{today.title}</Text>
            <Text style={s.heroSub}>
              {today.mode} · {today.minutes} min · {today.cefr}
            </Text>
            <View style={s.heroFooter}>
              <View style={s.heroTrack}>
                <Animated.View style={[s.heroFill, fillStyle]} />
              </View>
              <View style={s.playWrap}>
                <Pulse color={colors.ink} size={60} />
                <View style={s.play}>
                  <Ionicons name="play" size={26} color={colors.lime} />
                </View>
              </View>
            </View>
          </TiltCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260).springify()}>
          <PressableScale style={s.flowLink} onPress={() => router.push('/flow')}>
            <Ionicons name="pulse" size={20} color={colors.green} />
            <Text style={s.flowText}>Comment ton effort adapte la leçon</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </PressableScale>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(320)} style={s.section}>
          Phrases du jour
        </Animated.Text>
        <Animated.ScrollView
          horizontal
          onScroll={onCarousel}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardW + 12}
          decelerationRate="fast"
          style={s.carousel}
          contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingVertical: 8 }}
        >
          {daily.map((p, i) => (
            <PhraseCard key={p.de} index={i} x={x} w={cardW} tint={cardTints[i % cardTints.length]} phrase={p} />
          ))}
        </Animated.ScrollView>

        <Animated.Text entering={FadeInDown.delay(420)} style={s.section}>
          Autres leçons
        </Animated.Text>
        {others.map((l, i) => (
          <Animated.View key={l.id} entering={FadeInDown.delay(480 + i * 100).springify().damping(15)}>
            <TiltCard style={s.item} max={6} onPress={() => router.push(`/lesson/${l.id}`)} accessibilityLabel={l.title}>
              <View style={s.itemIcon}>
                <Ionicons name={modeIcon[l.mode]} size={22} color={colors.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.itemTitle}>{l.title}</Text>
                <Text style={s.itemSub}>
                  {l.subtitle} · {l.minutes} min
                </Text>
              </View>
              <View style={s.badge}>
                <Text style={s.badgeText}>{l.cefr}</Text>
              </View>
            </TiltCard>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInDown.delay(700)} style={s.tip}>
          <Ionicons name="headset" size={20} color={colors.teal} />
          <Text style={s.tipText}>Mets tes écouteurs : la leçon continue même écran verrouillé.</Text>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

// Carte du carrousel : pivote en 3D selon sa position dans le défilement horizontal. Toucher = prononciation.
function PhraseCard({
  index,
  x,
  w,
  tint,
  phrase,
}: {
  index: number;
  x: SharedValue<number>;
  w: number;
  tint: string;
  phrase: { de: string; fr: string };
}) {
  const step = w + 12;
  const a = useAnimatedStyle(() => {
    const d = (x.value - index * step) / step; // 0 = carte centrée à gauche
    return {
      transform: [
        { perspective: 700 },
        { rotateY: `${interpolate(d, [-1, 0, 1], [-28, 0, 28], Extrapolation.CLAMP)}deg` },
        { scale: interpolate(d, [-1, 0, 1], [0.88, 1, 0.88], Extrapolation.CLAMP) },
      ],
      opacity: interpolate(d, [-1.5, 0, 1.5], [0.5, 1, 0.5], Extrapolation.CLAMP),
    };
  });
  return (
    <Animated.View entering={FadeInRight.delay(380 + index * 90).springify().damping(16)} style={a}>
      <PressableScale
        style={[s.phrase, { width: w, backgroundColor: tint }]}
        onPress={() => Speech.speak(phrase.de, { language: 'de-DE', rate: 0.85 })}
        accessibilityLabel={`Écouter : ${phrase.de}`}
      >
        <Ionicons name="volume-high" size={20} color={colors.lime} />
        <Text style={s.phraseDe}>{phrase.de}</Text>
        <Text style={s.phraseFr}>{phrase.fr}</Text>
      </PressableScale>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  compact: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    paddingBottom: 10,
    backgroundColor: 'rgba(251,250,247,0.96)',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  compactText: { fontSize: 16, fontWeight: '700', color: colors.ink },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  hello: { fontSize: 28, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 15, color: colors.muted, marginTop: 2 },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  streakText: { fontWeight: '600', color: colors.ink },
  hero: { backgroundColor: colors.lime, borderRadius: radius.lg, padding: 24, gap: 6 },
  heroLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: colors.green },
  heroTitle: { fontSize: 34, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  heroSub: { fontSize: 15, color: colors.ink, opacity: 0.7 },
  heroFooter: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 18 },
  heroTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(10,10,10,0.12)' },
  heroFill: { height: 8, borderRadius: 4, backgroundColor: colors.ink },
  playWrap: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  play: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  flowText: { flex: 1, fontSize: 15, color: colors.ink, fontWeight: '500' },
  section: { fontSize: 20, fontWeight: '700', color: colors.ink, marginTop: 8 },
  carousel: { marginHorizontal: -16 },
  phrase: { height: 150, borderRadius: radius.lg, padding: 18, justifyContent: 'space-between' },
  phraseDe: { fontSize: 20, fontWeight: '600', color: colors.white },
  phraseFr: { fontSize: 13, color: colors.white, opacity: 0.8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 14,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: { fontSize: 17, fontWeight: '600', color: colors.ink },
  itemSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  badge: { backgroundColor: colors.green, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  tip: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 4 },
  tipText: { flex: 1, color: colors.muted, fontSize: 13 },
});
