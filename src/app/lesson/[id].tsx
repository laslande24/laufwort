import { useEffect, useReducer, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOutUp,
  LinearTransition,
  ZoomIn,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { Lesson, Level, Phrase, lessons, levelColor, levelLabel, mmss, phaseAt, totalSeconds } from '@/data';
import { colors, radius } from '@/theme';
import { Waveform } from '@/components/Waveform';
import { PressableScale, Pulse } from '@/components/motion';

type Stage = 'speaking' | 'countdown' | 'listen';
const rate: Record<Level, number> = { easy: 0.8, medium: 0.85, hard: 0.9 };
const haptic = () => Platform.OS !== 'web' && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

type Session = {
  lesson: Lesson;
  running: boolean;
  elapsed: number;
  stage: Stage;
  count: number;
  spm: number;
  bpm: number;
  done: number;
  cursor: Record<Level, number>;
  phrase: Phrase;
  speakId: number;
};
type Action = { type: 'toggle' } | { type: 'tick' } | { type: 'spoken' };

const init = (lesson: Lesson): Session => ({
  lesson,
  running: false,
  elapsed: 0,
  stage: 'speaking',
  count: 0,
  spm: 120,
  bpm: 95,
  done: 0,
  cursor: { easy: 1, medium: 0, hard: 0 },
  phrase: lesson.phrases.easy[0],
  speakId: 0,
});

function reducer(s: Session, a: Action): Session {
  switch (a.type) {
    case 'toggle':
      return { ...s, running: !s.running, done: Math.max(s.done, 1) };
    case 'spoken':
      return s.running ? { ...s, stage: 'countdown', count: 2 } : s;
    case 'tick': {
      const elapsed = s.elapsed + 1;
      if (elapsed >= totalSeconds) return { ...s, elapsed: totalSeconds, running: false };
      const p = phaseAt(elapsed).phase;
      // ponytail: capteurs simulés (dérive vers la cible + bruit). Remplacer par HealthKit / Health Connect + podomètre.
      const next = {
        ...s,
        elapsed,
        spm: Math.round(s.spm + (p.spm - s.spm) * 0.15 + (Math.random() - 0.5) * 4),
        bpm: Math.round(s.bpm + (p.bpm - s.bpm) * 0.08 + (Math.random() - 0.5) * 3),
      };
      if (s.stage === 'speaking') return next;
      if (s.count > 1) return { ...next, count: s.count - 1 };
      // pause adaptative : plus longue au pic d'effort
      if (s.stage === 'countdown') return { ...next, stage: 'listen', count: p.pause };
      const pool = s.lesson.phrases[p.level];
      return {
        ...next,
        stage: 'speaking',
        phrase: pool[s.cursor[p.level] % pool.length],
        cursor: { ...s.cursor, [p.level]: s.cursor[p.level] + 1 },
        done: s.done + 1,
        speakId: s.speakId + 1,
      };
    }
  }
}

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = lessons.find((l) => l.id === id) ?? lessons[0];

  const [s, dispatch] = useReducer(reducer, lesson, init);
  const { phase, index } = phaseAt(s.elapsed);
  const finished = s.elapsed >= totalSeconds;

  // Horloge 1 s : avance le temps, capteurs simulés, cycle écoute → compte à rebours → répétition.
  useEffect(() => {
    if (!s.running) return;
    const t = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(t);
  }, [s.running]);

  // Voix allemande réelle (TTS de l'appareil). Relancée à chaque nouvelle phrase ou reprise.
  const speaking = s.running && s.stage === 'speaking';
  useEffect(() => {
    if (!speaking) return;
    Speech.speak(s.phrase.de, {
      language: 'de-DE',
      rate: rate[phaseAt(s.elapsed).phase.level],
      onDone: () => dispatch({ type: 'spoken' }),
    });
    return () => void Speech.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- relancer seulement sur nouvelle phrase / reprise
  }, [speaking, s.speakId]);

  // Vibration à chaque changement de phase et en fin de séance.
  useEffect(() => {
    if (index > 0 || finished) haptic();
  }, [index, finished]);

  // Enregistrement réel de la répétition + réécoute.
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);
  const player = useAudioPlayer(null);
  const [recUri, setRecUri] = useState<string | null>(null);
  const [micDenied, setMicDenied] = useState(false);

  async function toggleRecord() {
    if (recState.isRecording) {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      setRecUri(recorder.uri);
      return;
    }
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) return setMicDenied(true);
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  }

  function playRecording() {
    if (!recUri) return;
    player.replace({ uri: recUri });
    player.play();
  }

  const pill = !s.running
    ? finished
      ? 'Séance terminée'
      : s.elapsed === 0
        ? 'Prêt ?'
        : 'En pause'
    : s.stage === 'speaking'
      ? 'Écoute…'
      : s.stage === 'countdown'
        ? `Répète dans ${s.count} s`
        : `À toi ! ${s.count} s`;

  return (
    <LinearGradient colors={['#9CCFB4', '#5FA37F', '#3E8A66']} style={{ flex: 1 }}>
      <PhaseTint index={index} />
      <SafeAreaView style={st.safe}>
        <Animated.View entering={FadeInDown.springify().damping(16)} style={st.top}>
          <PressableScale style={st.iconBtn} onPress={() => router.back()} accessibilityLabel="Quitter">
            <Ionicons name="close" size={22} color={colors.ink} />
          </PressableScale>
          <Animated.View layout={LinearTransition.springify().damping(18)} style={st.pill}>
            <Animated.Text key={pill.replace(/\d/g, '')} entering={FadeIn.duration(250)} style={st.pillText}>
              {pill}
            </Animated.Text>
          </Animated.View>
          <PressableScale
            style={st.iconBtn}
            onPress={() => router.push({ pathname: '/flow', params: { phase: String(index) } })}
            accessibilityLabel="Voir le flux d’effort"
          >
            <Ionicons name="pulse" size={20} color={colors.ink} />
          </PressableScale>
        </Animated.View>

        <Animated.View key={phase.key} entering={FadeInDown.springify()} style={st.phaseRow}>
          <View style={[st.dot, { backgroundColor: levelColor[phase.level] }]} />
          <Text style={st.phaseText}>
            {phase.label} · {levelLabel[phase.level]} · {mmss(s.elapsed)} / {mmss(totalSeconds)}
          </Text>
        </Animated.View>

        <View style={st.center}>
          {/* Nouvelle phrase : elle monte depuis le bas, l'ancienne s'envole vers le haut. */}
          <Animated.View
            key={s.phrase.de + s.speakId}
            entering={FadeInDown.springify().damping(15)}
            exiting={FadeOutUp.duration(250)}
            style={st.phraseBlock}
          >
            <Text style={st.de} adjustsFontSizeToFit numberOfLines={3}>
              {s.phrase.de}
            </Text>
            <Text style={st.fr}>{s.phrase.fr}</Text>
          </Animated.View>
          <PressableScale
            onPress={() => Speech.speak(s.phrase.de, { language: 'de-DE', rate: 0.75 })}
            style={st.replay}
          >
            <Ionicons name="volume-high" size={16} color={colors.ink} />
            <Text style={st.replayText}>Réécouter lentement</Text>
          </PressableScale>
        </View>

        <Waveform active={s.running && s.stage === 'speaking'} listening={s.running && s.stage === 'listen'} />

        <View style={st.metrics}>
          <Metric i={0} icon="walk" label="CADENCE" value={s.running || s.elapsed ? String(s.spm) : '—'} unit="pas/min" />
          <Metric
            i={1}
            icon="heart"
            label="POULS"
            value={s.running || s.elapsed ? String(s.bpm) : '—'}
            unit="bpm"
            beat={s.running ? s.bpm : 0}
          />
          <Metric i={2} icon="sync" label="PROGRÈS" value={`${Math.round((s.elapsed / totalSeconds) * 100)}%`} />
        </View>

        <View style={st.bottom}>
          <PressableScale
            style={st.sideBtn}
            onPress={() => dispatch({ type: 'toggle' })}
            accessibilityLabel={s.running ? 'Pause' : 'Démarrer'}
          >
            <Animated.View key={String(s.running)} entering={ZoomIn.springify()}>
              <Ionicons name={s.running ? 'pause' : 'play'} size={26} color={colors.lime} />
            </Animated.View>
          </PressableScale>
          <View style={st.recWrap}>
            {recState.isRecording && <Pulse color={colors.pink} size={120} duration={1100} />}
            <SpinRing active={!recState.isRecording} />
            <PressableScale style={[st.rec, recState.isRecording && st.recOn]} onPress={toggleRecord} scaleTo={0.9}>
              <Ionicons name={recState.isRecording ? 'stop' : 'mic'} size={30} color={colors.ink} />
              <Text style={st.recText}>
                {recState.isRecording ? `${Math.round(recState.durationMillis / 1000)} s` : 'Enregistrer'}
              </Text>
            </PressableScale>
          </View>
          <PressableScale
            style={[st.sideBtn, !recUri && { opacity: 0.35 }]}
            onPress={playRecording}
            disabled={!recUri}
            accessibilityLabel="Réécouter mon enregistrement"
          >
            <Ionicons name="ear" size={24} color={colors.lime} />
          </PressableScale>
        </View>
        {micDenied && <Text style={st.warn}>Micro refusé : autorise-le dans les réglages.</Text>}
      </SafeAreaView>

      {finished && (
        <Animated.View entering={FadeIn.duration(300)} style={st.overlay}>
          <Animated.View entering={ZoomIn.delay(150).springify().damping(12)} style={st.summary}>
            <Animated.View entering={ZoomIn.delay(450).springify().damping(6)}>
              <Ionicons name="trophy" size={48} color={colors.gold} />
            </Animated.View>
            <Text style={st.sumTitle}>Bravo !</Text>
            <Text style={st.sumText}>
              {s.done} phrases répétées en {mmss(totalSeconds)}
            </Text>
            <PressableScale style={st.sumBtn} onPress={() => router.back()}>
              <Text style={st.sumBtnText}>Terminer</Text>
            </PressableScale>
          </Animated.View>
        </Animated.View>
      )}
    </LinearGradient>
  );
}

// Voile coloré qui glisse d'une teinte à l'autre à chaque phase (vert → jaune → rose → bleu).
const tints = ['rgba(46,114,85,0)', 'rgba(216,224,46,0.35)', 'rgba(242,182,198,0.5)', 'rgba(82,136,148,0.35)'];
function PhaseTint({ index }: { index: number }) {
  const v = useSharedValue(index);
  useEffect(() => {
    v.value = withTiming(index, { duration: 1500 });
  }, [index, v]);
  const a = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(v.value, [0, 1, 2, 3], tints) }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, a]} />;
}

// Anneau pointillé qui tourne lentement autour du micro, en invitation à parler.
function SpinRing({ active }: { active: boolean }) {
  const r = useSharedValue(0);
  useEffect(() => {
    r.value = active ? withRepeat(withTiming(360, { duration: 12000, easing: Easing.linear }), -1, false) : 0;
  }, [active, r]);
  const a = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  return <Animated.View pointerEvents="none" style={[st.ring, a]} />;
}

function Metric({
  i,
  icon,
  label,
  value,
  unit,
  beat = 0,
}: {
  i: number;
  icon: 'walk' | 'heart' | 'sync';
  label: string;
  value: string;
  unit?: string;
  beat?: number;
}) {
  // Le cœur bat au rythme du pouls affiché.
  const b = useSharedValue(1);
  useEffect(() => {
    if (!beat) {
      b.value = withTiming(1);
      return;
    }
    const period = 60000 / beat;
    b.value = withRepeat(
      withSequence(withTiming(1.35, { duration: period * 0.2 }), withTiming(1, { duration: period * 0.8 })),
      -1,
    );
  }, [beat, b]);
  const heart = useAnimatedStyle(() => ({ transform: [{ scale: b.value }] }));

  return (
    <Animated.View entering={FadeInUp.delay(200 + i * 90).springify().damping(15)} style={st.metric}>
      <View style={st.metricHead}>
        <Animated.View style={heart}>
          <Ionicons name={icon} size={13} color={icon === 'heart' && beat ? '#C2185B' : colors.ink} />
        </Animated.View>
        <Text style={st.metricLabel}>{label}</Text>
      </View>
      <View style={st.metricBox}>
        <Animated.Text key={value} entering={FadeInDown.duration(220)} style={st.metricValue}>
          {value}
        </Animated.Text>
        {unit && <Text style={st.metricUnit}>{unit}</Text>}
      </View>
    </Animated.View>
  );
}

const glass = 'rgba(255,255,255,0.28)';
const st = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 16 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: { backgroundColor: colors.ink, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 6 },
  pillText: { color: colors.white, fontSize: 13, fontWeight: '500' },
  phaseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.ink },
  phaseText: { color: colors.ink, fontSize: 13, opacity: 0.8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  phraseBlock: { alignItems: 'center', gap: 12 },
  de: { fontSize: 40, fontWeight: '500', color: colors.ink, textAlign: 'center', letterSpacing: -0.5, lineHeight: 50 },
  fr: { fontSize: 17, color: colors.ink, opacity: 0.75, textAlign: 'center' },
  replay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: glass,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  replayText: { fontSize: 13, color: colors.ink },
  metrics: { flexDirection: 'row', gap: 10, marginTop: 16 },
  metric: { flex: 1, backgroundColor: glass, borderRadius: radius.md, padding: 10, gap: 8 },
  metricHead: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metricLabel: { fontSize: 10, fontWeight: '700', color: colors.ink, letterSpacing: 0.5 },
  metricBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  metricValue: { fontSize: 24, fontWeight: '500', color: colors.ink },
  metricUnit: { fontSize: 11, color: colors.ink, opacity: 0.7 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 24 },
  sideBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rec: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  recWrap: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.lime,
  },
  recOn: { backgroundColor: colors.pink },
  recText: { fontSize: 13, color: colors.ink, fontWeight: '500' },
  warn: { textAlign: 'center', color: colors.ink, marginBottom: 8 },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10,10,10,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  summary: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    padding: 28,
    alignItems: 'center',
    gap: 8,
    alignSelf: 'stretch',
  },
  sumTitle: { fontSize: 28, fontWeight: '700', color: colors.ink },
  sumText: { fontSize: 16, color: colors.muted },
  sumBtn: {
    marginTop: 12,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  sumBtnText: { color: colors.lime, fontWeight: '700', fontSize: 16 },
});
