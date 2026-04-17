import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  uri: string;
  injectedJavaScript?: string;
  onMessage?: (e: WebViewMessageEvent) => void;
  onLoadEnd?: () => void;
};

export default function WebViewScreen({ uri, injectedJavaScript, onMessage, onLoadEnd }: Props) {
  const webViewRef = useRef<WebView>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const animateProgress = useCallback(
    (toValue: number) => {
      Animated.timing(progressAnim, {
        toValue,
        duration: 200,
        useNativeDriver: false,
      }).start();
    },
    [progressAnim]
  );

  const handleLoadProgress = useCallback(
    (e: { nativeEvent: { progress: number } }) => {
      const p = e.nativeEvent.progress;
      setLoadProgress(p);
      animateProgress(p);
    },
    [animateProgress]
  );

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    animateProgress(0.05);
  }, [animateProgress]);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    animateProgress(1);
    // Fade out bar after completion
    setTimeout(() => {
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }).start(() => setLoadProgress(0));
    }, 300);
    onLoadEnd?.();
  }, [progressAnim, onLoadEnd, animateProgress]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const handleNavStateChange = useCallback((nav: WebViewNavigation) => {
    setCanGoBack(nav.canGoBack);
  }, []);

  const handleRetry = useCallback(() => {
    setHasError(false);
    webViewRef.current?.reload();
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.root}>
      {/* Progress bar */}
      {loadProgress > 0 && loadProgress < 1 && (
        <View style={[styles.progressTrack, { top: insets.top }]}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
      )}

      {/* Back gesture hint bar */}
      {canGoBack && (
        <View style={[styles.navBar, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => webViewRef.current?.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backIcon}>‹</Text>
            <Text style={styles.backLabel}>Back</Text>
          </TouchableOpacity>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri }}
        style={styles.webview}
        injectedJavaScript={injectedJavaScript}
        onLoadStart={handleLoadStart}
        onLoadProgress={handleLoadProgress}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onHttpError={handleError}
        onMessage={onMessage}
        onNavigationStateChange={handleNavStateChange}
        javaScriptEnabled
        domStorageEnabled
        allowsBackForwardNavigationGestures
        renderLoading={() => <View />}
      />

      {/* Full-screen initial loader */}
      {isLoading && loadProgress < 0.3 && (
        <View style={styles.initialLoader}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loaderText}>Loading…</Text>
        </View>
      )}

      {/* Error state */}
      {hasError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠</Text>
          <Text style={styles.errorTitle}>Could not load page</Text>
          <Text style={styles.errorSub}>Check your connection and try again.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F172A' },
  webview: { flex: 1 },

  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    zIndex: 10,
    backgroundColor: '#1E293B',
  },
  progressBar: {
    height: 3,
    backgroundColor: '#DC2626',
    borderRadius: 2,
  },

  navBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9,
    backgroundColor: 'rgba(15,23,42,0.92)',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    gap: 2,
  },
  backIcon: { fontSize: 22, color: '#DC2626', lineHeight: 26 },
  backLabel: { fontSize: 15, color: '#F9FAFB', fontWeight: '500' },

  initialLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: { fontSize: 14, color: '#64748B' },

  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  errorIcon: { fontSize: 40, color: '#DC2626' },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#F9FAFB' },
  errorSub: { fontSize: 14, color: '#94A3B8', textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
