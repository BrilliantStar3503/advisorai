import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SetupScreen, { SETUP_COMPLETE_KEY } from './screens/SetupScreen';
import branchConfig from './branch.config';

SplashScreen.preventAutoHideAsync();

export type RootStackParamList = {
  Setup: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function HomeScreen() {
  const webViewRef = useRef<WebView>(null);

  const onLoadEnd = useCallback(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://www.prubsq.com' }}
        style={styles.webview}
        onLoadEnd={onLoadEnd}
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
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  webview: {
    flex: 1,
  },
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
