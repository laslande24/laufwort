import { Platform, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '@/theme';

// On the web the app is a phone app shown in a browser: past phone width it sits
// in a centred column instead of stretching. Phones are narrower than the cap,
// so they see no difference; iOS and Android skip the wrapper entirely.
const PHONE_MAX = 430;

function WebFrame({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return children;
  return (
    <View style={styles.backdrop}>
      <View style={styles.column}>{children}</View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <WebFrame>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: colors.paper },
          }}
        >
          <Stack.Screen name="index" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade_from_bottom' }} />
          <Stack.Screen
            name="lesson/[id]"
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }}
          />
          <Stack.Screen name="flow" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
      </GestureHandlerRootView>
    </WebFrame>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', backgroundColor: colors.line },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: PHONE_MAX,
    overflow: 'hidden',
    backgroundColor: colors.paper,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
  },
});
