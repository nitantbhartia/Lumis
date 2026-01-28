import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Lock,
  Instagram,
  Video,
  Twitter,
  Facebook,
  Youtube,
  MessageCircle,
  Ghost,
  Film,
  Users,
  Gamepad2,
  Play,
  Shield,
  Sun,
  Moon,
} from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';
import { useAuthStore } from '@/lib/state/auth-store';
import { formatFirstName } from '@/lib/utils/name-utils';

// Helper to get app icon
const getAppIcon = (appName: string, size: number = 20, color: string = '#666') => {
  const name = appName.toLowerCase();
  if (name.includes('insta')) return <Instagram size={size} color={color} />;
  if (name.includes('tik')) return <Video size={size} color={color} />;
  if (name.includes('twitter') || name.includes('x')) return <Twitter size={size} color={color} />;
  if (name.includes('face')) return <Facebook size={size} color={color} />;
  if (name.includes('you')) return <Youtube size={size} color={color} />;
  if (name.includes('reddit')) return <MessageCircle size={size} color={color} />;
  if (name.includes('snap')) return <Ghost size={size} color={color} />;
  if (name.includes('netflix')) return <Film size={size} color={color} />;
  if (name.includes('social')) return <Users size={size} color={color} />;
  if (name.includes('game')) return <Gamepad2 size={size} color={color} />;
  if (name.includes('entertain')) return <Play size={size} color={color} />;
  if (name.includes('category')) return <Shield size={size} color={color} />;
  return <Lock size={size} color={color} />;
};

export default function OnboardingSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const userName = useAuthStore((s) => s.userName);
  const user = useAuthStore((s) => s.user);
  const setHasCompletedOnboarding = useLumisStore((s) => s.setHasCompletedOnboarding);
  const scheduledWakeTime = useLumisStore((s) => s.scheduledWakeTime);
  const blockedApps = useLumisStore((s) => s.blockedApps);

  const buttonOpacity = useSharedValue(0);

  const activeApps = useMemo(
    () => blockedApps.filter((a) => a.isBlocked),
    [blockedApps]
  );

  const displayName = formatFirstName(userName) || formatFirstName(user?.name);

  // Check if it's daytime (6 AM - 6 PM) for "try now" vs countdown
  const isDaytime = useMemo(() => {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18;
  }, []);

  // Format wake time for display
  const formattedWakeTime = useMemo(() => {
    if (!scheduledWakeTime) return '7:00 AM';
    const [hours, minutes] = scheduledWakeTime.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }, [scheduledWakeTime]);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    buttonOpacity.value = withDelay(1000, withTiming(1, { duration: 600 }));
  }, []);

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasCompletedOnboarding(true);
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
      <View style={styles.content}>
        {/* Main headline */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.headlineContainer}>
          <Text style={styles.headline}>You're all set.</Text>
          {displayName && (
            <Text style={styles.subheadline}>Welcome, {displayName}.</Text>
          )}
        </Animated.View>

        {/* Preview card - conditional based on time */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(600)}
          style={styles.previewCard}
        >
          {isDaytime ? (
            <>
              <View style={styles.previewHeader}>
                <Sun size={20} color="#FF6B35" strokeWidth={2} />
                <Text style={styles.previewLabel}>IT'S DAYTIME</Text>
              </View>

              <View style={styles.previewContent}>
                <View style={styles.lockIconContainer}>
                  <Sun size={24} color="#FF6B35" strokeWidth={2} />
                </View>
                <Text style={styles.previewText}>
                  Perfect timing! Try getting your morning light right now.
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.previewHeader}>
                <Moon size={20} color="#6366F1" strokeWidth={2} />
                <Text style={styles.previewLabel}>STARTING TOMORROW AT {formattedWakeTime}</Text>
              </View>

              <View style={styles.previewContent}>
                <View style={styles.lockIconContainer}>
                  <Lock size={24} color="#FF6B35" strokeWidth={2} />
                </View>
                <Text style={styles.previewText}>
                  Your apps lock until you step outside.
                </Text>
              </View>

              {activeApps.length > 0 && (
                <View style={styles.appsRow}>
                  {activeApps.slice(0, 4).map((app, index) => (
                    <View key={`${app.id}-${index}`} style={styles.appIcon}>
                      {getAppIcon(app.name, 20, 'rgba(255,255,255,0.6)')}
                    </View>
                  ))}
                  {activeApps.length > 4 && (
                    <View style={[styles.appIcon, styles.moreApps]}>
                      <Text style={styles.moreAppsText}>+{activeApps.length - 4}</Text>
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </Animated.View>

        {/* Motivation text */}
        <Animated.Text entering={FadeIn.delay(800)} style={styles.motivation}>
          {isDaytime
            ? "Step outside for 2-3 minutes.\nYour future self will thank you."
            : "2-3 minutes of morning light.\nThat's all it takes."}
        </Animated.Text>
      </View>

      <Animated.View style={[{ paddingBottom: insets.bottom }, buttonStyle]}>
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>{isDaytime ? 'TRY IT NOW' : "LET'S GO"}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  headlineContainer: {
    marginBottom: 48,
  },
  headline: {
    fontSize: 48,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: -2,
    lineHeight: 56,
  },
  subheadline: {
    fontSize: 24,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
  },
  previewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 32,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    color: '#FF6B35',
    letterSpacing: 2,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  lockIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  previewText: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Outfit_500Medium',
    color: '#FFFFFF',
    lineHeight: 26,
  },
  appsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  appIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreApps: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  moreAppsText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  motivation: {
    fontSize: 20,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingVertical: 22,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: '#E85D04',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
});
