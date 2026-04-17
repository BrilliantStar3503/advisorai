import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebViewMessageEvent } from 'react-native-webview';

import WebViewScreen from '../components/WebViewScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { SETUP_DATA_KEY, SetupData } from '../screens/SetupScreen';
import { appendLead, buildWebViewInjection, ensureSheetHeaders, LeadData } from '../lib/sheets';
import { submitTestLead } from '../utils/testLead';
import * as SplashScreen from 'expo-splash-screen';

// ── Tab param list ────────────────────────────────────────────────────────────
export type MainTabParamList = {
  Home:       undefined;
  Assessment: undefined;
  Results:    undefined;
  Settings:   undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// ── Tab icon (text-based, no extra icon lib needed) ───────────────────────────
const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  Home:       '⌂',
  Assessment: '◫',
  Results:    '▦',
  Settings:   '⚙',
};

function TabIcon({ name, focused }: { name: keyof MainTabParamList; focused: boolean }) {
  return (
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      {TAB_ICONS[name]}
    </Text>
  );
}

// ── URL map ───────────────────────────────────────────────────────────────────
const URLS: Record<Exclude<keyof MainTabParamList, 'Settings'>, string> = {
  Home:       'https://www.prubsq.com',
  Assessment: 'https://www.prubsq.com/assessment',
  Results:    'https://www.prubsq.com/results',
};

// ── Main tab component ────────────────────────────────────────────────────────
export default function MainTabs() {
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [injectionJS, setInjectionJS] = useState('');
  const headersEnsured = useRef(false);
  const splashHidden = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(SETUP_DATA_KEY).then((raw) => {
      if (!raw) return;
      try {
        const data: SetupData = JSON.parse(raw);
        setSetupData(data);
        setInjectionJS(buildWebViewInjection(data.sheetId, data.agentName, data.branchName));
      } catch (e) {
        console.warn('[MainTabs] parse error', e);
      }
    });
  }, []);

  useEffect(() => {
    if (!setupData?.sheetId || !setupData?.accessToken || headersEnsured.current) return;
    headersEnsured.current = true;
    ensureSheetHeaders(setupData.sheetId, setupData.accessToken).catch(console.warn);
  }, [setupData]);

  const hideSplash = useCallback(() => {
    if (splashHidden.current) return;
    splashHidden.current = true;
    SplashScreen.hideAsync();
  }, []);

  const onMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      if (!setupData?.sheetId || !setupData?.accessToken) return;
      try {
        const msg = JSON.parse(event.nativeEvent.data) as {
          type: string;
          data: Record<string, string>;
        };

        if (msg.type === 'TEST_LEAD') {
          const r = await submitTestLead(
            setupData.sheetId, setupData.accessToken,
            setupData.agentName, setupData.branchName
          );
          Alert.alert(r.success ? 'Test Lead Sent ✓' : 'Test Lead Failed',
            r.success ? 'Check your Sheet.' : r.error ?? 'Unknown');
          return;
        }

        if (msg.type !== 'LEAD_SUBMISSION') return;

        const raw = msg.data;
        const lead: LeadData = {
          timestamp:  new Date().toISOString(),
          firstName:  raw.firstName  ?? raw.first_name ?? raw.name?.split(' ')[0] ?? '',
          lastName:   raw.lastName   ?? raw.last_name  ?? raw.name?.split(' ').slice(1).join(' ') ?? '',
          email:      raw.email      ?? '',
          phone:      raw.phone      ?? raw.phoneNumber ?? raw.mobile ?? '',
          agentName:  setupData.agentName,
          branchName: setupData.branchName,
          source:     'prubsq.com',
          notes:      raw.notes ?? raw.message ?? '',
        };

        const result = await appendLead(setupData.sheetId, setupData.accessToken, lead);
        if (!result.success) console.warn('[onMessage] append failed:', result.error);
        else console.log('[onMessage] lead saved:', lead.email);
      } catch (e) {
        console.warn('[onMessage] error', e);
      }
    },
    [setupData]
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: { name: keyof MainTabParamList } }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#DC2626',
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }: { focused: boolean }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Home">
        {() => (
          <WebViewScreen
            uri={URLS.Home}
            injectedJavaScript={injectionJS || undefined}
            onMessage={onMessage}
            onLoadEnd={hideSplash}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="Assessment">
        {() => (
          <WebViewScreen
            uri={URLS.Assessment}
            injectedJavaScript={injectionJS || undefined}
            onMessage={onMessage}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="Results">
        {() => (
          <WebViewScreen
            uri={URLS.Results}
            injectedJavaScript={injectionJS || undefined}
            onMessage={onMessage}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingBottom: Platform.OS === 'ios' ? 0 : 4,
    height: Platform.OS === 'ios' ? 82 : 62,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: -2,
  },
  tabIcon: {
    fontSize: 20,
    color: '#475569',
    marginBottom: -2,
  },
  tabIconFocused: {
    color: '#DC2626',
  },
});
