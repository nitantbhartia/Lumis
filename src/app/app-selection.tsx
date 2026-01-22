import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Instagram,
  Video,
  Twitter,
  Facebook,
  Youtube,
  MessageCircle,
  Ghost,
  Film,
  Check,
  ChevronRight,
  Shield,
} from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';
import { useAuthStore } from '@/lib/state/auth-store';
import { showAppPicker, getScreenTimePermissionStatus } from '@/lib/screen-time';
import { Platform } from 'react-native';

const iconMap: Record<string, React.ReactNode> = {
  instagram: <Instagram size={28} color="#1A1A2E" strokeWidth={1.5} />,
  video: <Video size={28} color="#1A1A2E" strokeWidth={1.5} />,
  twitter: <Twitter size={28} color="#1A1A2E" strokeWidth={1.5} />,
  facebook: <Facebook size={28} color="#1A1A2E" strokeWidth={1.5} />,
  youtube: <Youtube size={28} color="#1A1A2E" strokeWidth={1.5} />,
  'message-circle': <MessageCircle size={28} color="#1A1A2E" strokeWidth={1.5} />,
  ghost: <Ghost size={28} color="#1A1A2E" strokeWidth={1.5} />,
  film: <Film size={28} color="#1A1A2E" strokeWidth={1.5} />,
};

export default function AppSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const blockedApps = useLumisStore((s) => s.blockedApps);
  const toggleAppBlocked = useLumisStore((s) => s.toggleAppBlocked);

  const buttonScale = useSharedValue(1);

  const isPremium = useLumisStore((s) => s.isPremium);
  const isTrialActive = useLumisStore((s) => s.isTrialActive());
  const hasPremiumAccess = isPremium || isTrialActive;

  const selectedCount = blockedApps.filter((app) => app.isBlocked).length;

  const handleToggle = (appId: string) => {
    const app = blockedApps.find((a) => a.id === appId);

    if (!hasPremiumAccess && selectedCount >= 3 && app && !app.isBlocked) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/premium');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleAppBlocked(appId);
  };

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // On iOS, if Screen Time is authorized, suggest selecting apps natively too
    if (Platform.OS === 'ios') {
      try {
        const hasAuth = await getScreenTimePermissionStatus();
        if (hasAuth) {
          // Check if native selection is empty (this is a bit hard to know for sure without checking native count)
          // For UX, just show it anyway to be sure they have what they want
          await showAppPicker();
        }
      } catch (e) {
        console.error('[AppSelection] Error checking ST status:', e);
      }
    }

    router.push('/onboarding-auth');
  };

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#87CEEB', '#B0E0E6', '#FFEB99', '#FFDAB9']}
        locations={[0, 0.3, 0.7, 1]}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, paddingTop: insets.top + 20 }}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Shield size={28} color="#1A1A2E" strokeWidth={1.5} />
              <Text style={styles.headerTitle}>Shield Apps</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Select the apps you want to lock until you get your morning light.
            </Text>
          </View>

          {/* Selection counter */}
          <View style={styles.counterSection}>
            <View style={styles.counterCard}>
              <View style={styles.counterCircle}>
                <Text style={styles.counterValue}>{selectedCount}</Text>
              </View>
              <Text style={styles.counterText}>
                {selectedCount === 1 ? 'app' : 'apps'} will be shielded each morning
              </Text>
            </View>
          </View>

          {/* App list */}
          <ScrollView
            style={styles.appList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {blockedApps.map((app, index) => (
              <Animated.View
                key={app.id}
                entering={FadeInDown.delay(index * 50).duration(400)}
                layout={Layout.springify()}
                style={styles.appItemContainer}
              >
                <Pressable
                  onPress={() => handleToggle(app.id)}
                  style={[
                    styles.appCard,
                    app.isBlocked && styles.appCardSelected
                  ]}
                >
                  <View style={styles.appInfoRow}>
                    <View style={[
                      styles.appIconContainer,
                      app.isBlocked ? styles.iconBgSelected : styles.iconBgDefault
                    ]}>
                      {iconMap[app.icon]}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.appName}>{app.name}</Text>
                      <Text style={[
                        styles.appStatus,
                        app.isBlocked ? styles.statusSelected : styles.statusDefault
                      ]}>
                        {app.isBlocked ? 'Will be shielded' : 'Tap to shield'}
                      </Text>
                    </View>

                    <View style={[
                      styles.checkbox,
                      app.isBlocked && styles.checkboxSelected
                    ]}>
                      {app.isBlocked && <Check size={18} color="#FFF" strokeWidth={3} />}
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </ScrollView>

          {/* Continue button */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
            <Animated.View style={buttonAnimStyle}>
              <Pressable
                onPress={handleContinue}
                onPressIn={() => { buttonScale.value = withSpring(0.95); }}
                onPressOut={() => { buttonScale.value = withSpring(1); }}
                disabled={selectedCount === 0}
                style={styles.buttonWrapper}
              >
                <LinearGradient
                  colors={selectedCount === 0 ? ['#CCC', '#BBB'] : ['#FFB347', '#FF8C00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  <Text style={[
                    styles.buttonText,
                    selectedCount === 0 && { color: '#666' }
                  ]}>
                    {selectedCount === 0 ? 'Select at least 1 app' : 'Continue'}
                  </Text>
                  {selectedCount > 0 && <ChevronRight size={20} color="#1A1A2E" strokeWidth={2.5} />}
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#333',
    lineHeight: 22,
  },
  counterSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  counterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
    padding: 12,
  },
  counterCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFB347',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  counterValue: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
  },
  counterText: {
    fontSize: 15,
    fontFamily: 'Outfit_500Medium',
    color: '#1A1A2E',
  },
  appList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  appItemContainer: {
    marginBottom: 12,
  },
  appCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  appCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderColor: '#FFB347',
  },
  appInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconBgDefault: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconBgSelected: {
    backgroundColor: '#FFB34780',
  },
  appName: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1A2E',
  },
  appStatus: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
  statusDefault: {
    color: '#666',
  },
  statusSelected: {
    color: '#FF8C00',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#FFB347',
    borderColor: '#FFB347',
  },
  footer: {
    paddingHorizontal: 24,
  },
  buttonWrapper: {
    width: '100%',
  },
  button: {
    paddingVertical: 18,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1A2E',
  },
});
