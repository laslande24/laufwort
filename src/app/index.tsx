import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { PressableScale } from '@/components/motion';
import { colors, radius } from '@/theme';

// Auth statique : chaque bouton mène à l'accueil. Brancher Supabase Auth ici.
const enter = () => router.replace('/home');

const lines = [
  [
    { w: 'Bouge', c: colors.lime },
    { w: 'ton', c: colors.white },
    { w: 'corps.', c: colors.white },
  ],
  [
    { w: 'Entraîne', c: colors.white },
    { w: 'ton', c: colors.lime },
    { w: 'esprit.', c: colors.lime },
  ],
];

export default function Welcome() {
  // Effet « Ken Burns » : zoom très lent en boucle sur la photo.
  const z = useSharedValue(1);
  useEffect(() => {
    z.value = withRepeat(withTiming(1.12, { duration: 14000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [z]);
  const photo = useAnimatedStyle(() => ({ transform: [{ scale: z.value }] }));

  let i = 0;
  return (
    <View style={s.bg}>
      <Animated.Image
        source={require('../../assets/welcome.jpg')}
        style={[s.photo, photo]}
        resizeMode="cover"
        entering={FadeIn.duration(900)}
      />
      <LinearGradient colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']} style={s.fill} />

      <Animated.Text entering={FadeInDown.duration(600)} style={s.brand}>
        Laufwort
      </Animated.Text>

      <View style={s.slogan}>
        {lines.map((line, li) => (
          <View key={li} style={s.line}>
            {line.map(({ w, c }) => (
              <Animated.Text
                key={w + li}
                entering={FadeInDown.delay(300 + i++ * 140).springify().damping(14)}
                style={[s.word, li === 1 && s.italic, { color: c }]}
              >
                {w}
              </Animated.Text>
            ))}
          </View>
        ))}
      </View>

      <Animated.View entering={SlideInDown.delay(900).springify().damping(16)} style={s.card}>
        <Text style={s.title}>Bouge. Écoute. Apprends.</Text>
        <View style={s.row}>
          <PressableScale style={s.social} onPress={enter} accessibilityLabel="Continuer avec Google">
            <Ionicons name="logo-google" size={22} color="#4285F4" />
          </PressableScale>
          <PressableScale style={s.social} onPress={enter} accessibilityLabel="Continuer avec Apple">
            <Ionicons name="logo-apple" size={24} color={colors.ink} />
          </PressableScale>
        </View>
        <PressableScale style={s.email} onPress={enter}>
          <Ionicons name="mail" size={20} color={colors.ink} />
          <Text style={s.emailText}>S’inscrire avec un e-mail</Text>
        </PressableScale>
        <Text style={s.legal}>
          En t’inscrivant, tu acceptes les Conditions d’utilisation de Laufwort et reconnais avoir lu la Politique de
          confidentialité.
        </Text>
        <PressableScale onPress={enter}>
          <Text style={s.link}>Déjà un compte ? Se connecter</Text>
        </PressableScale>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, justifyContent: 'flex-end', padding: 16, paddingBottom: 32, backgroundColor: colors.ink, overflow: 'hidden' },
  photo: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  brand: { position: 'absolute', top: 56, left: 20, fontSize: 26, fontWeight: '800', color: colors.white, letterSpacing: -0.5 },
  slogan: { flex: 1, justifyContent: 'center' },
  line: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  word: {
    fontSize: 44,
    fontWeight: '500',
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowRadius: 10,
  },
  italic: { fontStyle: 'italic' },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 24, gap: 16, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '600', color: colors.ink },
  row: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
  social: {
    flex: 1,
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  email: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  emailText: { fontSize: 17, fontWeight: '500', color: colors.ink },
  legal: { fontSize: 12, color: colors.muted, textAlign: 'center', lineHeight: 17 },
  link: { fontSize: 14, color: colors.ink, textDecorationLine: 'underline' },
});
