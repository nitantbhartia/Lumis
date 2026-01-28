import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { Lock, Bell, MapPin, Check, LucideIcon } from 'lucide-react-native';
import { requestScreenTimeAuthorization, showAppPicker, activateShield, syncShieldDisplayData } from '@/lib/screen-time';
import { useLumisStore } from '@/lib/state/lumis-store';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

interface PermissionItem {
  id: 'screentime' | 'notifications' | 'location';
  title: string;
  description: string;
  icon: LucideIcon;
  required: boolean;
}

const PERMISSIONS: PermissionItem[] = [
  {
    id: 'screentime',
    title: 'Screen Time Access',
    description: 'Required to lock apps until your goal is complete',
    icon: Lock,
    required: true,
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Get morning reminders and progress updates',
    icon: Bell,
    required: false,
  },
  {
    id: 'location',
    title: 'Location',
    description: 'For weather-based goal adjustments',
    icon: MapPin,
    required: false,
  },
];

export default function OnboardingPermissionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [grantedPermissions, setGrantedPermissions] = useState<Set<string>>(new Set());
  const [isRequesting, setIsRequesting] = useState<string | null>(null);
  const setShieldEngaged = useLumisStore((s) => s.setShieldEngaged);

  // Animation values
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const permissionsOpacity = PERMISSIONS.map(() => useSharedValue(0));
  const permissionsTranslateY = PERMISSIONS.map(() => useSharedValue(20));
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    // Title
    titleOpacity.value = withTiming(1, { duration: 400 });
    titleTranslateY.value = withTiming(0, { duration: 400 });

    // Subtitle
    subtitleOpacity.value = withDelay(100, withTiming(1, { duration: 300 }));

    // Staggered permission cards
    PERMISSIONS.forEach((_, index) => {
      const delay = 300 + index * 100;
      permissionsOpacity[index].value = withDelay(delay, withTiming(1, { duration: 300 }));
      permissionsTranslateY[index].value = withDelay(delay, withTiming(0, { duration: 300 }));
    });

    // Button
    buttonOpacity.value = withDelay(700, withTiming(1, { duration: 300 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const handleRequestPermission = async (permissionId: string) => {
    if (isRequesting) return;
    setIsRequesting(permissionId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let granted = false;

      switch (permissionId) {
        case 'screentime':
          const authResult = await requestScreenTimeAuthorization();
          if (authResult) {
            const pickerResult = await showAppPicker();
            if (pickerResult.success) {
              await useLumisStore.getState().syncWithNativeBlockedApps();
              activateShield();
              syncShieldDisplayData();
              setShieldEngaged(true);
              granted = true;
            }
          }
          break;

        case 'notifications':
          const { status } = await Notifications.requestPermissionsAsync();
          granted = status === 'granted';
          break;

        case 'location':
          const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
          granted = locStatus === 'granted';
          break;
      }

      if (granted) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setGrantedPermissions((prev) => new Set([...prev, permissionId]));
      }
    } catch (error) {
      console.error(`[Permissions] Error requesting ${permissionId}:`, error);
    } finally {
      setIsRequesting(null);
    }
  };

  const handleSkip = (permissionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGrantedPermissions((prev) => new Set([...prev, `${permissionId}_skipped`]));
  };

  const handleContinue = () => {
    if (!grantedPermissions.has('screentime')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        'Screen Time Required',
        'Please allow Screen Time access to continue. This is required for app blocking.',
        [{ text: 'OK' }]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding-success');
  };

  const canContinue = grantedPermissions.has('screentime');

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.Text style={[styles.title, titleStyle]}>One last thing</Animated.Text>

        <Animated.Text style={[styles.subtitle, subtitleStyle]}>
          We need a few permissions to help you build better mornings.
        </Animated.Text>

        <View style={styles.permissions}>
          {PERMISSIONS.map((permission, index) => {
            const Icon = permission.icon;
            const isGranted = grantedPermissions.has(permission.id);
            const isSkipped = grantedPermissions.has(`${permission.id}_skipped`);
            const isHandled = isGranted || isSkipped;
            const isLoading = isRequesting === permission.id;
            const permissionStyle = useAnimatedStyle(() => ({
              opacity: permissionsOpacity[index].value,
              transform: [{ translateY: permissionsTranslateY[index].value }],
            }));

            return (
              <Animated.View
                key={permission.id}
                style={[
                  styles.permissionCard,
                  isGranted && styles.permissionCardGranted,
                  isSkipped && styles.permissionCardSkipped,
                  permissionStyle,
                ]}
              >
                <View style={styles.permissionContent}>
                  <View
                    style={[
                      styles.iconContainer,
                      isGranted && styles.iconContainerGranted,
                    ]}
                  >
                    {isGranted ? (
                      <Check size={24} color="#22C55E" strokeWidth={3} />
                    ) : (
                      <Icon
                        size={24}
                        color={isSkipped ? 'rgba(255,255,255,0.3)' : '#FF6B35'}
                        strokeWidth={2}
                      />
                    )}
                  </View>
                  <View style={styles.textContainer}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          styles.permissionTitle,
                          isSkipped && styles.permissionTitleSkipped,
                        ]}
                      >
                        {permission.title}
                      </Text>
                      {permission.required && !isHandled && (
                        <View style={styles.requiredBadge}>
                          <Text style={styles.requiredText}>REQUIRED</Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.permissionDescription,
                        isSkipped && styles.permissionDescriptionSkipped,
                      ]}
                    >
                      {permission.description}
                    </Text>
                  </View>
                </View>

                {!isHandled && (
                  <View style={styles.actionButtons}>
                    <Pressable
                      onPress={() => handleRequestPermission(permission.id)}
                      disabled={isLoading}
                      style={[
                        styles.allowButton,
                        isLoading && styles.allowButtonLoading,
                      ]}
                    >
                      <Text style={styles.allowButtonText}>
                        {isLoading ? 'Requesting...' : 'Allow'}
                      </Text>
                    </Pressable>
                    {!permission.required && (
                      <Pressable
                        onPress={() => handleSkip(permission.id)}
                        style={styles.skipButton}
                      >
                        <Text style={styles.skipButtonText}>Skip</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* Fixed button at bottom */}
      <Animated.View style={[styles.buttonContainer, { paddingBottom: insets.bottom }, buttonStyle]}>
        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
          style={[
            styles.button,
            !canContinue && styles.buttonDisabled,
          ]}
        >
          <Text
            style={[styles.buttonText, !canContinue && styles.buttonTextDisabled]}
          >
            CONTINUE
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
    fontSize: 40,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#FFFFFF',
    lineHeight: 48,
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissions: {
    gap: 16,
  },
  permissionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  permissionCardGranted: {
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  permissionCardSkipped: {
    opacity: 0.5,
  },
  permissionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconContainerGranted: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  permissionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  permissionTitleSkipped: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  requiredBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredText: {
    fontSize: 9,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  permissionDescription: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
  },
  permissionDescriptionSkipped: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  allowButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  allowButtonLoading: {
    opacity: 0.7,
  },
  allowButtonText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(255, 255, 255, 0.4)',
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
