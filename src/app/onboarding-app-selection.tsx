import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Instagram,
  Video,
  Twitter,
  MessageCircle,
  Youtube,
  Ghost,
  Check,
  Mail,
  Linkedin,
  LucideIcon,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  FadeInDown,
} from 'react-native-reanimated';
import { useLumisStore } from '@/lib/state/lumis-store';

interface AppOption {
  id: string;
  name: string;
  icon: LucideIcon;
}

const SOCIAL_APPS: AppOption[] = [
  { id: 'instagram', name: 'Instagram', icon: Instagram },
  { id: 'tiktok', name: 'TikTok', icon: Video },
  { id: 'twitter', name: 'Twitter / X', icon: Twitter },
  { id: 'youtube', name: 'YouTube', icon: Youtube },
  { id: 'reddit', name: 'Reddit', icon: MessageCircle },
  { id: 'snapchat', name: 'Snapchat', icon: Ghost },
];

const PRODUCTIVITY_APPS: AppOption[] = [
  { id: 'slack', name: 'Slack', icon: MessageCircle },
  { id: 'outlook', name: 'Outlook', icon: Mail },
  { id: 'gmail', name: 'Gmail', icon: Mail },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
];

// Pre-selected apps
const DEFAULT_SELECTED = new Set(['instagram', 'tiktok', 'twitter', 'youtube', 'reddit']);

export default function OnboardingAppSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const morningScrollTime = useLumisStore((s) => s.morningScrollTime);

  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set(DEFAULT_SELECTED));

  // Calculate time being stolen
  const minutesPerDay = useMemo(() => {
    switch (morningScrollTime) {
      case '10-20': return 15;
      case '20-30': return 25;
      case '30+': return 35;
      case 'admit': return 45;
      default: return 25;
    }
  }, [morningScrollTime]);

  // Animation values
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 400 });
    titleTranslateY.value = withTiming(0, { duration: 400 });
    buttonOpacity.value = withDelay(500, withTiming(1, { duration: 300 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const toggleApp = (appId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedApps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(appId)) {
        newSet.delete(appId);
      } else {
        newSet.add(appId);
      }
      return newSet;
    });
  };

  const handleContinue = () => {
    if (selectedApps.size === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding-permission-screentime');
  };

  const renderAppCard = (app: AppOption, index: number, delay: number) => {
    const Icon = app.icon;
    const isSelected = selectedApps.has(app.id);

    return (
      <Animated.View
        key={app.id}
        entering={FadeInDown.delay(delay + index * 50)}
        style={styles.gridItem}
      >
        <Pressable
          onPress={() => toggleApp(app.id)}
          style={[
            styles.appCard,
            isSelected && styles.appCardSelected,
          ]}
        >
          <View
            style={[
              styles.iconContainer,
              isSelected && styles.iconContainerSelected,
            ]}
          >
            <Icon
              size={28}
              color={isSelected ? '#FF6B35' : 'rgba(255, 255, 255, 0.6)'}
              strokeWidth={2}
            />
          </View>
          <Text
            style={[
              styles.appName,
              isSelected && styles.appNameSelected,
            ]}
          >
            {app.name}
          </Text>
          {isSelected && (
            <View style={styles.checkmark}>
              <Check size={14} color="#FFFFFF" strokeWidth={3} />
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.Text style={[styles.title, titleStyle]}>
          These apps are currently taking{' '}
          <Text style={styles.highlight}>{minutesPerDay} minutes</Text>{' '}
          from your mornings
        </Animated.Text>

        <Animated.Text style={[styles.subtitle, titleStyle]}>
          Select the ones to lock.
        </Animated.Text>

        {/* Social Apps Grid */}
        <View style={styles.grid}>
          {SOCIAL_APPS.map((app, index) => renderAppCard(app, index, 200))}
        </View>

        {/* Productivity Apps Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Also stealing your mornings?</Text>
        </View>

        <View style={styles.grid}>
          {PRODUCTIVITY_APPS.map((app, index) => renderAppCard(app, index, 500))}
        </View>

        <Text style={styles.hint}>
          You'll select specific apps after setup using Apple's Screen Time picker.
        </Text>
      </ScrollView>

      {/* Fixed button at bottom */}
      <Animated.View style={[styles.buttonContainer, { paddingBottom: insets.bottom }, buttonStyle]}>
        <Pressable
          onPress={handleContinue}
          disabled={selectedApps.size === 0}
          style={[
            styles.button,
            selectedApps.size === 0 && styles.buttonDisabled,
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              selectedApps.size === 0 && styles.buttonTextDisabled,
            ]}
          >
            LOCK {selectedApps.size} APP{selectedApps.size !== 1 ? 'S' : ''}
          </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#FFFFFF',
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  highlight: {
    color: '#FF6B35',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '47%',
  },
  appCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  appCardSelected: {
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconContainerSelected: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
  },
  appName: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#FFFFFF',
  },
  appNameSelected: {
    fontFamily: 'Outfit_600SemiBold',
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 24,
  },
  buttonContainer: {
    backgroundColor: '#0F172A',
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingVertical: 22,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  buttonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
});
