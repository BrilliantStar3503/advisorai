import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SetupScreen, { SETUP_COMPLETE_KEY, SETUP_DATA_KEY, SetupData } from './screens/SetupScreen';
import { appendLead, buildWebViewInjection, ensureSheetHeaders, LeadData } from './lib/sheets';
import { submitTestLead } from './utils/testLead';
import branchConfig from './branch.config';

SplashScreen.preventAutoHideAsync();

export type RootStackParamList = {
  Setup: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── Home Screen ────────────────────────────────────────────────────────────

function HomeScreen() {
  const webViewRef = useRef<WebView>(null);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [injectionJS, setInjectionJS] = useState<string>('');
  const headersEnsured = useRef(false);

  // Load setup data once
  useEffect(() => {
    AsyncStorage.getItem(SETUP_DATA_KEY).then((raw) => {
      if (!raw) return;
      try {
        const data: SetupData = JSON.parse(raw);
        setSetupData(data);
        setInjectionJS(
          buildWebViewInjection(data.sheetId, data.agentName, data.branchName)
        );
      } catch (e) {
        console.warn('[HomeScreen] failed to parse setup data', e);
      }
    });
  }, []);

  // Ensure Sheet headers once we have credentials
  useEffect(() => {
    if (!setupData?.sheetId || !setupData?.accessToken || headersEnsured.current) return;
    headersEnsured.current = true;
    ensureSheetHeaders(setupData.sheetId, setupData.accessToken).catch(console.warn);
  }, [setupData]);

  const onLoadEnd = useCallback(() => {
    SplashScreen.hideAsync();
  }, []);

  // Handle postMessage from WebView
  const onMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      if (!setupData?.sheetId || !setupData?.accessToken) return;
      try {
        const msg = JSON.parse(event.nativeEvent.data) as {
          type: string;
          data: Record<string, string>;
        };

        if (msg.type !== 'LEAD_SUBMISSION') return;

        const raw = msg.data;
        const lead: LeadData = {
          timestamp: new Date().toISOString(),
          firstName: raw.firstName ?? raw.first_name ?? raw.name?.split(' ')[0] ?? '',
          lastName: raw.lastName ?? raw.last_name ?? raw.name?.split(' ').slice(1).join(' ') ?? '',
          email: raw.email ?? '',
          phone: raw.phone ?? raw.phoneNumber ?? raw.mobile ?? '',
          agentName: setupData.agentName,
          branchName: setupData.branchName,
          source: 'prubsq.com assessment',
          notes: raw.notes ?? raw.message ?? '',
        };

        const result = await appendLead(setupData.sheetId, setupData.accessToken, lead);
        if (!result.success) {
          console.warn('[onMessage] lead append failed:', result.error);
        } else {
          console.log('[onMessage] lead appended:', lead.email);
        }
      } catch (e) {
        console.warn('[onMessage] parse error', e);
      }
    },
    [setupData]
  );

  // Dev helper: fire a test lead (remove for production)
  const fireTestLead = useCallback(async () => {
    if (!setupData?.sheetId || !setupData?.accessToken) {
      Alert.alert('Not ready', 'Setup data or access token missing.');
      return;
    }
    const result = await submitTestLead(
      setupData.sheetId,
      setupData.accessToken,
      setupData.agentName,
      setupData.branchName
    );
    Alert.alert(
      result.success ? 'Test Lead Sent ✓' : 'Test Lead Failed',
      result.success
        ? 'Check your Google Sheet for the dummy row.'
        : result.error ?? 'Unknown error'
    );
  }, [setupData]);

  // Expose test trigger via WebView eval message (type: TEST_LEAD)
  const onMessageWithTest = useCallback(
    async (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === 'TEST_LEAD') {
          await fireTestLead();
          return;
        }
      } catch {}
      await onMessage(event);
    },
    [onMessage, fireTestLead]
  );

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://www.prubsq.com' }}
        style={styles.webview}
        onLoadEnd={onLoadEnd}
        onMessage={onMessageWithTest}
        injectedJavaScript={injectionJS || undefined}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={branchConfig.primaryColor} />
          </View>
        )}
        javaScriptEnabled
        domStorageEnabled
        allowsBackForwardNavigationGestures
      />
      <StatusBar style="light" />
    </View>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────────

export default function App() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(SETUP_COMPLETE_KEY).then((value) => {
      setInitialRoute(value === 'true' ? 'Home' : 'Setup');
      SplashScreen.hideAsync();
    });
  }, []);

  if (!initialRoute) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="Setup" component={SetupScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  webview: { flex: 1 },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
});
