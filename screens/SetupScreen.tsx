import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

WebBrowser.maybeCompleteAuthSession();

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Setup'>;
};

export const SETUP_COMPLETE_KEY = '@advisorai_setup_complete';
export const SETUP_DATA_KEY = '@advisorai_setup_data';

export type SetupData = {
  branchName: string;
  agentName: string;
  googleEmail: string | null;
  googleName: string | null;
  sheetId: string;
  accessToken: string | null;
};

export default function SetupScreen({ navigation }: Props) {
  const [branchName, setBranchName] = useState('');
  const [agentName, setAgentName] = useState('');
  const [sheetId, setSheetId] = useState('');
  const [googleUser, setGoogleUser] = useState<{
    email: string;
    name: string;
    accessToken: string;
  } | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const [, , promptAsync] = Google.useAuthRequest({
    clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    redirectUri: makeRedirectUri({ scheme: 'advisorai' }),
    scopes: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      const result = await promptAsync();
      if (result.type === 'success' && result.authentication?.accessToken) {
        const token = result.authentication.accessToken;
        const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = await res.json();
        setGoogleUser({ email: user.email, name: user.name, accessToken: token });
      }
    } catch {
      Alert.alert('Sign-in failed', 'Could not complete Google Sign-In.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleComplete = async () => {
    if (!branchName.trim()) {
      Alert.alert('Required', 'Please enter a Branch Name.');
      return;
    }
    if (!agentName.trim()) {
      Alert.alert('Required', 'Please enter an Agent Name.');
      return;
    }
    if (!sheetId.trim()) {
      Alert.alert('Required', 'Please enter your Google Sheet ID.');
      return;
    }

    const data: SetupData = {
      branchName: branchName.trim(),
      agentName: agentName.trim(),
      googleEmail: googleUser?.email ?? null,
      googleName: googleUser?.name ?? null,
      sheetId: sheetId.trim(),
      accessToken: googleUser?.accessToken ?? null,
    };

    await AsyncStorage.setItem(SETUP_COMPLETE_KEY, 'true');
    await AsyncStorage.setItem(SETUP_DATA_KEY, JSON.stringify(data));

    navigation.replace('Home');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Image source={require('../assets/icon.png')} style={styles.logo} />
        <Text style={styles.title}>Welcome to AdvisorAI</Text>
        <Text style={styles.subtitle}>Set up your advisor profile to get started.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Branch Name</Text>
          <TextInput
            style={styles.input}
            value={branchName}
            onChangeText={setBranchName}
            placeholder="e.g. Sunrise Financial"
            placeholderTextColor="#6B7280"
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={styles.label}>Agent Name</Text>
          <TextInput
            style={styles.input}
            value={agentName}
            onChangeText={setAgentName}
            placeholder="e.g. Jane Smith"
            placeholderTextColor="#6B7280"
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={styles.label}>Google Sheet ID</Text>
          <TextInput
            style={styles.input}
            value={sheetId}
            onChangeText={setSheetId}
            placeholder="Paste Sheet ID from URL"
            placeholderTextColor="#6B7280"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
          />
          <Text style={styles.hint}>
            From the Sheet URL: /spreadsheets/d/<Text style={styles.hintHighlight}>SHEET_ID</Text>/edit
          </Text>

          <TouchableOpacity
            style={[styles.googleBtn, googleUser ? styles.googleBtnDone : null]}
            onPress={handleGoogleSignIn}
            disabled={signingIn || !!googleUser}
            activeOpacity={0.8}
          >
            {signingIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleBtnText}>
                  {googleUser
                    ? `✓  ${googleUser.email}`
                    : 'Sign in with Google (Sheets access)'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.completeBtn}
            onPress={handleComplete}
            activeOpacity={0.85}
          >
            <Text style={styles.completeBtnText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F172A' },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 48,
  },
  logo: { width: 88, height: 88, borderRadius: 20, marginBottom: 24 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    marginBottom: 36,
    textAlign: 'center',
  },
  form: { width: '100%' },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D1D5DB',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#F9FAFB',
  },
  hint: { fontSize: 11, color: '#6B7280', marginTop: 5 },
  hintHighlight: { color: '#DC2626' },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 24,
    gap: 10,
  },
  googleBtnDone: { borderColor: '#16A34A' },
  googleIcon: { fontSize: 16, fontWeight: '700', color: '#DC2626' },
  googleBtnText: { fontSize: 15, fontWeight: '600', color: '#F9FAFB' },
  completeBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  completeBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
