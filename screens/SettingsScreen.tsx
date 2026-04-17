import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SETUP_COMPLETE_KEY, SETUP_DATA_KEY, SetupData } from './SetupScreen';
import { submitTestLead } from '../utils/testLead';

export default function SettingsScreen() {
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [testRunning, setTestRunning] = useState(false);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    AsyncStorage.getItem(SETUP_DATA_KEY).then((raw) => {
      if (raw) setSetupData(JSON.parse(raw));
    });
  }, []);

  const handleTestLead = useCallback(async () => {
    if (!setupData?.sheetId || !setupData?.accessToken) {
      Alert.alert('Not ready', 'No Sheet ID or access token found.');
      return;
    }
    setTestRunning(true);
    const result = await submitTestLead(
      setupData.sheetId,
      setupData.accessToken,
      setupData.agentName,
      setupData.branchName
    );
    setTestRunning(false);
    Alert.alert(
      result.success ? 'Test Lead Sent ✓' : 'Test Lead Failed',
      result.success
        ? 'Check your Google Sheet for the dummy row.'
        : result.error ?? 'Unknown error'
    );
  }, [setupData]);

  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset Setup',
      'This will clear all configuration and show the setup screen on next launch.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(SETUP_COMPLETE_KEY);
            await AsyncStorage.removeItem(SETUP_DATA_KEY);
            Alert.alert('Reset complete', 'Restart the app to re-run setup.');
          },
        },
      ]
    );
  }, []);

  const sheetUrl = setupData?.sheetId
    ? `https://docs.google.com/spreadsheets/d/${setupData.sheetId}`
    : null;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Image source={require('../assets/icon.png')} style={styles.logo} />
        <View>
          <Text style={styles.appName}>AdvisorAI</Text>
          <Text style={styles.version}>v1.0.0</Text>
        </View>
      </View>

      {/* Profile card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>PROFILE</Text>
        <Row label="Branch Name" value={setupData?.branchName ?? '—'} />
        <Row label="Agent Name"  value={setupData?.agentName  ?? '—'} />
        <Row label="Google Account" value={setupData?.googleEmail ?? 'Not signed in'} />
      </View>

      {/* Sheet card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>GOOGLE SHEETS</Text>
        <Row
          label="Sheet ID"
          value={setupData?.sheetId ? `…${setupData.sheetId.slice(-12)}` : 'Not configured'}
          mono
        />
        <Row
          label="Status"
          value={setupData?.accessToken ? '● Connected' : '○ No token'}
          valueStyle={setupData?.accessToken ? styles.connected : styles.disconnected}
        />
        {sheetUrl && (
          <Text style={styles.sheetUrl} numberOfLines={1}>{sheetUrl}</Text>
        )}
      </View>

      {/* Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ACTIONS</Text>
        <TouchableOpacity
          style={[styles.actionBtn, testRunning && styles.actionBtnDisabled]}
          onPress={handleTestLead}
          disabled={testRunning}
        >
          <Text style={styles.actionBtnText}>
            {testRunning ? 'Sending…' : 'Send Test Lead'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Danger zone */}
      <View style={[styles.card, styles.dangerCard]}>
        <Text style={[styles.cardTitle, styles.dangerTitle]}>DANGER ZONE</Text>
        <TouchableOpacity style={styles.dangerBtn} onPress={handleReset}>
          <Text style={styles.dangerBtnText}>Reset Setup</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Row({
  label,
  value,
  mono = false,
  valueStyle,
}: {
  label: string;
  value: string;
  mono?: boolean;
  valueStyle?: object;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[styles.rowValue, mono && styles.mono, valueStyle]}
        numberOfLines={1}
        ellipsizeMode="middle"
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#0F172A' },
  scroll: { paddingHorizontal: 20 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  logo:    { width: 52, height: 52, borderRadius: 12 },
  appName: { fontSize: 22, fontWeight: '800', color: '#F9FAFB' },
  version: { fontSize: 12, color: '#64748B', marginTop: 2 },

  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.5,
    marginBottom: 10,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0F172A',
  },
  rowLabel: { fontSize: 14, color: '#94A3B8', flex: 1 },
  rowValue: { fontSize: 14, color: '#F9FAFB', fontWeight: '500', flex: 2, textAlign: 'right' },
  mono:     { fontFamily: Platform_select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontSize: 12 },

  connected:    { color: '#22C55E' },
  disconnected: { color: '#EF4444' },

  sheetUrl: {
    fontSize: 11,
    color: '#475569',
    marginTop: 8,
    fontFamily: Platform_select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },

  actionBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  actionBtnDisabled: { opacity: 0.5 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  dangerCard:  { borderColor: '#7F1D1D' },
  dangerTitle: { color: '#EF4444' },
  dangerBtn: {
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  dangerBtnText: { color: '#DC2626', fontWeight: '700', fontSize: 15 },
});

// inline platform select to avoid extra import
function Platform_select(obj: { ios: string; android: string; default: string }) {
  const { Platform } = require('react-native');
  return Platform.select(obj) ?? obj.default;
}
