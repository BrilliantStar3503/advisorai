import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SetupScreen, { SETUP_COMPLETE_KEY } from './screens/SetupScreen';
import MainTabs from './navigation/MainTabs';

SplashScreen.preventAutoHideAsync();

export type RootStackParamList = {
  Setup: undefined;
  Main:  undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(SETUP_COMPLETE_KEY).then((value) => {
      setInitialRoute(value === 'true' ? 'Main' : 'Setup');
      // If going to Setup, hide splash immediately; Main hides it after WebView loads
      if (value !== 'true') SplashScreen.hideAsync();
    });
  }, []);

  if (!initialRoute) return null;

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false, animation: 'fade' }}
        >
          <Stack.Screen name="Setup" component={SetupScreen} />
          <Stack.Screen name="Main"  component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </>
  );
}
