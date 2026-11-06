// Données statiques — seront remplacées par Supabase plus tard.
import { colors } from './theme';

export type Level = 'easy' | 'medium' | 'hard';

export type Phrase = { de: string; fr: string };

export type Phase = {
  key: string;
  label: string;
  level: Level;
  seconds: number;
  spm: number; // cadence cible (pas/min)
  bpm: number; // fréquence cardiaque cible
  pause: number; // secondes laissées pour répéter
  icon: 'walk' | 'trending-up' | 'flash' | 'leaf';
};

export const user = { name: 'Romaric', streak: 6, goal: 'Allemand · A2' };

export const levelLabel: Record<Level, string> = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
};

export const levelColor: Record<Level, string> = {
  easy: colors.greenSoft,
  medium: colors.lime,
  hard: colors.pink,
};

// ponytail: durées de démo en secondes (~4 min au total), passer en minutes pour une vraie séance.
export const phases: Phase[] = [
  { key: 'warmup', label: 'Échauffement', level: 'easy', seconds: 60, spm: 150, bpm: 115, pause: 4, icon: 'walk' },
  { key: 'build', label: 'Montée', level: 'medium', seconds: 70, spm: 165, bpm: 135, pause: 4, icon: 'trending-up' },
  { key: 'peak', label: 'Pic', level: 'hard', seconds: 60, spm: 175, bpm: 158, pause: 6, icon: 'flash' },
  { key: 'recover', label: 'Récupération', level: 'easy', seconds: 50, spm: 140, bpm: 110, pause: 5, icon: 'leaf' },
];

export const mmss = (t: number) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;

export const totalSeconds = phases.reduce((s, p) => s + p.seconds, 0);

export function phaseAt(elapsed: number): { phase: Phase; index: number } {
  let t = 0;
  for (let i = 0; i < phases.length; i++) {
    t += phases[i].seconds;
    if (elapsed < t) return { phase: phases[i], index: i };
  }
  return { phase: phases[phases.length - 1], index: phases.length - 1 };
}

export type Lesson = {
  id: string;
  title: string;
  subtitle: string;
  cefr: string;
  minutes: number;
  mode: 'Course' | 'Marche' | 'Vélo';
  done: number; // % déjà maîtrisé
  phrases: Record<Level, Phrase[]>;
};

export const lessons: Lesson[] = [
  {
    id: 'alltag',
    title: 'Mon quotidien',
    subtitle: 'Routines, horaires, habitudes',
    cefr: 'A2',
    minutes: 20,
    mode: 'Course',
    done: 68,
    phrases: {
      easy: [
        { de: 'Ich laufe jeden Morgen.', fr: 'Je cours tous les matins.' },
        { de: 'Ich trinke viel Wasser.', fr: "Je bois beaucoup d'eau." },
        { de: 'Heute ist es sonnig.', fr: 'Aujourd’hui il fait beau.' },
      ],
      medium: [
        { de: 'Nach dem Sport dusche ich immer.', fr: 'Après le sport, je me douche toujours.' },
        { de: 'Am Wochenende schlafe ich länger.', fr: 'Le week-end, je dors plus longtemps.' },
        { de: 'Ich fahre mit dem Bus zur Arbeit.', fr: 'Je vais au travail en bus.' },
      ],
      hard: [
        { de: 'Laufen.', fr: 'Courir.' },
        { de: 'Schneller!', fr: 'Plus vite !' },
        { de: 'Weiter so!', fr: 'Continue comme ça !' },
      ],
    },
  },
  {
    id: 'reise',
    title: 'En voyage',
    subtitle: 'Gare, hôtel, directions',
    cefr: 'A2',
    minutes: 25,
    mode: 'Marche',
    done: 34,
    phrases: {
      easy: [
        { de: 'Wo ist der Bahnhof?', fr: 'Où est la gare ?' },
        { de: 'Ein Ticket, bitte.', fr: 'Un billet, s’il vous plaît.' },
      ],
      medium: [
        { de: 'Wann fährt der nächste Zug?', fr: 'Quand part le prochain train ?' },
        { de: 'Ich habe ein Zimmer reserviert.', fr: "J'ai réservé une chambre." },
      ],
      hard: [
        { de: 'Links.', fr: 'À gauche.' },
        { de: 'Geradeaus.', fr: 'Tout droit.' },
      ],
    },
  },
  {
    id: 'beruf',
    title: 'Au travail',
    subtitle: 'Ausbildung, entretien, collègues',
    cefr: 'B1',
    minutes: 30,
    mode: 'Vélo',
    done: 12,
    phrases: {
      easy: [
        { de: 'Ich mache eine Ausbildung.', fr: 'Je fais une formation en alternance.' },
        { de: 'Mein Chef ist nett.', fr: 'Mon chef est sympa.' },
      ],
      medium: [
        { de: 'Ich interessiere mich für diesen Beruf.', fr: 'Je m’intéresse à ce métier.' },
        { de: 'Könnten Sie das bitte wiederholen?', fr: 'Pourriez-vous répéter, s’il vous plaît ?' },
      ],
      hard: [
        { de: 'Pünktlich sein.', fr: 'Être ponctuel.' },
        { de: 'Teamarbeit.', fr: 'Travail d’équipe.' },
      ],
    },
  },
];

export const week = [
  { day: 'L', minutes: 22, km: 3.4 },
  { day: 'M', minutes: 0, km: 0 },
  { day: 'M', minutes: 31, km: 5.1 },
  { day: 'J', minutes: 18, km: 2.6 },
  { day: 'V', minutes: 0, km: 0 },
  { day: 'S', minutes: 42, km: 7.2 },
  { day: 'D', minutes: 25, km: 4.0 },
];

export const stats = { words: 184, sessions: 23, km: 61.8, accuracy: 82 };


export const fluency = 75; // « esprit fluide » : score global

export const wordMastery = [
  { label: 'Maîtrisés', value: 100, color: colors.green },
  { label: 'En cours', value: 80, color: colors.pink },
  { label: 'À revoir', value: 60, color: colors.lime },
];

export const activity = { sessions: 7, time: '5 h 23', bpm: 134 };

// Barres flottantes du graphique d'activité : hauteur + décalage vertical.
export const activityBars = [
  { h: 40, y: 0, c: colors.lime },
  { h: 26, y: -6, c: colors.lime },
  { h: 30, y: 10, c: colors.pink },
  { h: 70, y: -10, c: colors.pink },
  { h: 48, y: 18, c: colors.lime },
  { h: 44, y: -4, c: colors.lime },
  { h: 110, y: 0, c: colors.green },
  { h: 110, y: -4, c: colors.green },
  { h: 80, y: 8, c: colors.pink },
  { h: 80, y: 6, c: colors.pink },
  { h: 44, y: -8, c: colors.lime },
  { h: 22, y: -16, c: colors.lime },
  { h: 20, y: -4, c: colors.lime },
  { h: 18, y: 2, c: colors.lime },
];

export const words = [
  { de: 'laufen', fr: 'courir', value: 100 },
  { de: 'der Morgen', fr: 'le matin', value: 95 },
  { de: 'das Wasser', fr: "l'eau", value: 90 },
  { de: 'der Bahnhof', fr: 'la gare', value: 72 },
  { de: 'die Ausbildung', fr: 'la formation', value: 64 },
  { de: 'pünktlich', fr: 'ponctuel', value: 48 },
  { de: 'geradeaus', fr: 'tout droit', value: 35 },
];
