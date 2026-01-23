import React, { useEffect, useMemo } from 'react';
import { View, Text, Pressable, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/lib/state/auth-store';
import { useLumisStore } from '@/lib/state/lumis-store';
import { Sun, Sparkles, ArrowRight, Shield, Instagram, Video, Twitter, Facebook, Youtube, MessageCircle, Film, Ghost, Lock, Users, Gamepad2, Play, Palette, Clock, GraduationCap, ShoppingBag, Plane, Settings, Activity, BookOpen } from 'lucide-react-native';
import { formatFirstName } from '@/lib/utils/name-utils';

const { width } = Dimensions.get('window');

// Helper to get app icon (dashboard style)
const getAppIcon = (appName: string, size: number = 24, color?: string) => {
  const name = appName.toLowerCase();
  const iconColor = color || '#666';

  // Specific app icons
  if (name.includes('insta')) return <Instagram size={size} color={iconColor} />;
  if (name.includes('tik')) return <Video size={size} color={iconColor} />;
  if (name.includes('twitter') || name.includes('x')) return <Twitter size={size} color={iconColor} />;
  if (name.includes('face')) return <Facebook size={size} color={iconColor} />;
  if (name.includes('you')) return <Youtube size={size} color={iconColor} />;
  if (name.includes('reddit')) return <MessageCircle size={size} color={iconColor} />;
  if (name.includes('snap')) return <Ghost size={size} color={iconColor} />;
  if (name.includes('netflix')) return <Film size={size} color={iconColor} />;

  // Category specific icons
  if (name.includes('social')) return <Users size={size} color={iconColor} />;
  if (name.includes('game')) return <Gamepad2 size={size} color={iconColor} />;
  if (name.includes('entertain')) return <Play size={size} color={iconColor} />;
  if (name.includes('creativ')) return <Palette size={size} color={iconColor} />;
  if (name.includes('productiv') || name.includes('finance')) return <Clock size={size} color={iconColor} />;
  if (name.includes('educat')) return <GraduationCap size={size} color={iconColor} />;
  if (name.includes('shop') || name.includes('food')) return <ShoppingBag size={size} color={iconColor} />;
  if (name.includes('travel')) return <Plane size={size} color={iconColor} />;
  if (name.includes('utilit')) return <Settings size={size} color={iconColor} />;
  if (name.includes('health') || name.includes('fit')) return <Activity size={size} color={iconColor} />;
  if (name.includes('read') || name.includes('info')) return <BookOpen size={size} color={iconColor} />;

  if (name.includes('layer') || name.includes('category')) return <Shield size={size} color={iconColor} />;
  return <Lock size={size} color={iconColor} />;
};

export default function OnboardingSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const userName = useAuthStore((s) => s.userName);
  const setHasCompletedOnboarding = useLumisStore((s) => s.setHasCompletedOnboarding);
  const scheduledWakeTime = useLumisStore((s) => s.scheduledWakeTime);
  const blockedApps = useLumisStore((s) => s.blockedApps);

  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  const isPremium = useLumisStore((s) => s.isPremium);
  const isTrialActive = useLumisStore((s) => s.isTrialActive());
  const hasPremiumAccess = isPremium || isTrialActive;

  // Get shielded apps
  const activeApps = useMemo(() => blockedApps.filter(a => a.isBlocked), [blockedApps]);
  const activeAppsCount = activeApps.length;
  const appsCount = useMemo(() => activeApps.filter(a => !a.isCategory).length, [activeApps]);
  const categoriesCount = useMemo(() => activeApps.filter(a => a.isCategory).length, [activeApps]);

  const shieldedApps = useMemo(() => {
    return activeApps.slice(0, 6);
  }, [activeApps]);

  const getShieldingText = () => {
    const categories = activeApps.filter(a => a.isCategory);
    let categoryPart = '';

    if (categoriesCount === 1) {
      categoryPart = categories[0].name || 'Category';
    } else if (categoriesCount === 2) {
      const name1 = categories[0].name || 'Category';
      const name2 = categories[1].name || 'Category';
      if (name1 === name2) {
        categoryPart = `2 categories`;
      } else {
        categoryPart = `${name1} & ${name2}`;
      }
    } else if (categoriesCount > 2) {
      categoryPart = `${categoriesCount} categories`;
    }

    if (categoriesCount > 0 && appsCount > 0) {
      return `${categoryPart} & ${appsCount} app${appsCount > 1 ? 's' : ''} shielded until protocol complete`;
    } else if (categoriesCount > 0) {
      return `${categoryPart} shielded until protocol complete`;
    } else {
      return `${appsCount} app${appsCount > 1 ? 's' : ''} shielded until protocol complete`;
    }
  };

  // Calculate tomorrow's date
  const tomorrowLabel = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayName = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = tomorrow.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `TOMORROW • ${dayName.toUpperCase()}, ${monthDay.toUpperCase()}`;
  }, []);

  // Calculate hours until wake time
  const hoursUntilWindow = useMemo(() => {
    const now = new Date();
    const [hours, minutes] = (scheduledWakeTime || '07:00').split(':').map(Number);
    const wakeTime = new Date();
    wakeTime.setDate(wakeTime.getDate() + 1);
    wakeTime.setHours(hours, minutes, 0, 0);
    const diffMs = wakeTime.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    return diffHours;
  }, [scheduledWakeTime]);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasCompletedOnboarding(true);

    // Redirect to Paywall if not premium
    if (!hasPremiumAccess) {
      router.replace('/(tabs)/premium');
    } else {
      router.replace('/(tabs)');
    }
  };

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Button fade in
    buttonOpacity.value = withDelay(1200, withTiming(1, { duration: 800 }));
  }, []);

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [
      { translateY: interpolate(buttonOpacity.value, [0, 1], [20, 0]) },
      { scale: buttonScale.value }
    ],
  }));

  const user = useAuthStore((s) => s.user);
  const displayName = formatFirstName(userName) || formatFirstName(user?.name) || 'Nitant';

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#87CEEB', '#B0E0E6', '#FFEB99', '#FFDAB9']}
        locations={[0, 0.3, 0.7, 1]}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 32,
            paddingHorizontal: 24,
          }}
        >
          <View style={{ flex: 1, alignItems: 'center' }}>
            {/* Personalized Headline */}
            <Animated.View entering={FadeIn.delay(200)} style={{ alignItems: 'center', marginBottom: 24 }}>
              <Text style={styles.headline}>
                {displayName
                  ? `Your morning is\nprotected, ${displayName}.`
                  : `Your morning is\nnow protected.`
                }
              </Text>
              <Text style={styles.subheadline}>
                We'll see you at <Text style={{ fontFamily: 'Outfit_700Bold' }}>{scheduledWakeTime || '7:00'} AM</Text> for your first protocol.
              </Text>
            </Animated.View>

            {/* Temporal Label */}
            <Animated.Text entering={FadeInDown.delay(400)} style={styles.temporalLabel}>
              {tomorrowLabel}
            </Animated.Text>

            {/* Dashboard Preview Card (Visual Payoff) */}
            <Animated.View
              entering={FadeInDown.delay(600).duration(800)}
              style={styles.previewCard}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
                style={styles.previewGradient}
              >
                <View style={styles.previewHeader}>
                  <View>
                    <Text style={styles.previewProtocol}>CLOUDY ANCHOR PROTOCOL</Text>
                    <Text style={styles.previewTime}>{scheduledWakeTime || '07:00'} — 11:59 AM</Text>
                  </View>
                  <Sun size={32} color="#FF8C00" fill="#FFB347" />
                </View>

                <View style={styles.previewDivider} />

                <View style={styles.previewBody}>
                  <Text style={styles.previewInstruction}>
                    Total light target: <Text style={{ fontFamily: 'Outfit_700Bold' }}>16 MIN</Text>
                  </Text>
                  <Text style={styles.previewSubtext}>
                    Your optimal circadian window opens in <Text style={{ fontFamily: 'Outfit_600SemiBold', color: '#FF8C00' }}>{hoursUntilWindow} hours</Text>.
                  </Text>
                </View>

                {/* Shielded Apps Confirmation - Dashboard Style */}
                {activeAppsCount > 0 && (
                  <View style={styles.shieldedAppsContainer}>
                    <View style={styles.previewDivider} />
                    <View style={styles.shieldedAppsRow}>
                      <Shield size={16} color="#999" strokeWidth={2} />
                      <Text style={styles.shieldedAppsLabel}>
                        {getShieldingText()}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {shieldedApps.map((app, index) => (
                        <View
                          key={`${app.id}-${index}`}
                          style={[
                            styles.stackIconWrapper,
                            { zIndex: 10 - index, marginLeft: index === 0 ? 0 : -12 }
                          ]}
                        >
                          {getAppIcon(app.name, 22, '#555')}
                        </View>
                      ))}
                      {activeAppsCount > 6 && (
                        <View style={[styles.stackIconWrapper, { zIndex: 0, marginLeft: -12, backgroundColor: '#FFF' }]}>
                          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#666' }}>
                            +{activeAppsCount - 6}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Action Button */}
          <Animated.View style={buttonStyle}>
            <Pressable
              onPress={handleContinue}
              onPressIn={() => { buttonScale.value = withSpring(0.96); }}
              onPressOut={() => { buttonScale.value = withSpring(1); }}
            >
              <LinearGradient
                colors={['#FFB347', '#FF8C00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaButton}
              >
                <View style={{ alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.ctaText}>Enter Dashboard</Text>
                    <ArrowRight size={24} color="#1A1A2E" strokeWidth={3} />
                  </View>
                  <Text style={styles.ctaSubLabel}>Mission starts at {scheduledWakeTime || '7:00'} AM</Text>
                </View>
              </LinearGradient>
            </Pressable>

            <Text style={styles.contractReminder}>
              YOUR "MORNING CONTRACT" IS NOW LIVE
            </Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  headline: {
    fontSize: 34,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
    textAlign: 'center',
    lineHeight: 42,
  },
  subheadline: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#333',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  temporalLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    color: '#FF8C00',
    letterSpacing: 2,
    marginBottom: 16,
  },
  previewCard: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  previewGradient: {
    padding: 24,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  previewProtocol: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    color: '#FF8C00',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  previewTime: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
  },
  previewDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 16,
  },
  previewBody: {
    gap: 6,
  },
  previewInstruction: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#1A1A2E',
  },
  previewSubtext: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    lineHeight: 20,
  },
  shieldedAppsContainer: {
    marginTop: 8,
  },
  shieldedAppsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  shieldedAppsLabel: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    color: '#888',
  },
  appIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ctaButton: {
    paddingVertical: 20,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  ctaText: {
    fontSize: 20,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#1A1A2E',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginRight: 8,
  },
  ctaSubLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(26, 26, 46, 0.7)',
    marginTop: 4,
  },
  contractReminder: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: 'Outfit_700Bold',
  },
});
