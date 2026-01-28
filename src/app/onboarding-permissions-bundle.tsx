import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Smartphone, Bell, Activity, MapPin, Check, LucideIcon } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Location from 'expo-location';
import { requestAuthorization } from 'lumisscreentime';
import { notificationService } from '@/lib/notifications';
import { healthService } from '@/lib/health';

interface Permission {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  required: boolean;
  requestFn: () => Promise<boolean>;
}

const PERMISSIONS: Permission[] = [
  {
    id: 'screentime',
    icon: Smartphone,
    title: 'Screen Time',
    description: 'To block distracting apps and track your progress',
    required: true,
    requestFn: async () => {
      const result = await requestAuthorization();
      return result === true;
    },
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'To remind you to find morning light',
    required: true,
    requestFn: async () => {
      return await notificationService.requestPermissions();
    },
  },
  {
    id: 'motion',
    icon: Activity,
    title: 'Motion & Fitness',
    description: 'To track your morning activity patterns',
    required: false,
    requestFn: async () => {
      return await healthService.requestPermissions();
    },
  },
  {
    id: 'location',
    icon: MapPin,
    title: 'Location',
    description: 'To provide weather-based light recommendations',
    required: false,
    requestFn: async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    },
  },
];

type PermissionStatus = 'pending' | 'requesting' | 'granted' | 'denied' | 'skipped';

export default function OnboardingPermissionsBundleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [permissionStatuses, setPermissionStatuses] = useState<Record<string, PermissionStatus>>(
    PERMISSIONS.reduce((acc, p) => ({ ...acc, [p.id]: 'pending' }), {})
  );

  const handleRequestPermission = async (permission: Permission) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setPermissionStatuses(prev => ({
      ...prev,
      [permission.id]: 'requesting',
    }));

    try {
      const granted = await permission.requestFn();

      setPermissionStatuses(prev => ({
        ...prev,
        [permission.id]: granted ? 'granted' : 'denied',
      }));

      if (granted) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error(`Permission ${permission.id} error:`, error);
      setPermissionStatuses(prev => ({
        ...prev,
        [permission.id]: 'denied',
      }));
    }
  };

  const handleSkipPermission = (permissionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPermissionStatuses(prev => ({
      ...prev,
      [permissionId]: 'skipped',
    }));
  };

  const canContinue = PERMISSIONS.filter(p => p.required).every(
    p => permissionStatuses[p.id] === 'granted'
  );

  const handleContinue = () => {
    if (!canContinue) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding-sensor-calibration');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Permissions</Text>
        <Text style={styles.subtitle}>
          Grant permissions to enable key features
        </Text>
      </View>

      <View style={styles.permissionsList}>
        {PERMISSIONS.map((permission, index) => {
          const Icon = permission.icon;
          const status = permissionStatuses[permission.id];
          const isGranted = status === 'granted';
          const isSkipped = status === 'skipped';
          const isRequesting = status === 'requesting';
          const isPending = status === 'pending';

          return (
            <Animated.View
              key={permission.id}
              entering={FadeInDown.delay(index * 100).duration(400)}
              style={[
                styles.permissionCard,
                (isSkipped || (status === 'denied' && !permission.required)) && styles.permissionCardFaded,
              ]}
            >
              <View style={[styles.iconContainer, isGranted && styles.iconContainerGranted]}>
                {isGranted ? (
                  <Check size={24} color="#22C55E" strokeWidth={3} />
                ) : (
                  <Icon size={24} color={isSkipped ? '#666' : '#FF6B35'} strokeWidth={2} />
                )}
              </View>

              <View style={styles.permissionInfo}>
                <View style={styles.titleRow}>
                  <Text style={[styles.permissionTitle, isSkipped && styles.permissionTitleFaded]}>
                    {permission.title}
                  </Text>
                  {permission.required && (
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredText}>REQUIRED</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.permissionDescription, isSkipped && styles.permissionDescriptionFaded]}>
                  {permission.description}
                </Text>
              </View>

              <View style={styles.permissionActions}>
                {isGranted ? (
                  <View style={styles.grantedIndicator}>
                    <Text style={styles.grantedText}>Granted</Text>
                  </View>
                ) : isRequesting ? (
                  <ActivityIndicator size="small" color="#FF6B35" />
                ) : isSkipped ? (
                  <Text style={styles.skippedText}>Skipped</Text>
                ) : (
                  <View style={styles.actionButtons}>
                    <Pressable
                      onPress={() => handleRequestPermission(permission)}
                      style={styles.requestButton}
                    >
                      <Text style={styles.requestButtonText}>Allow</Text>
                    </Pressable>
                    {!permission.required && (
                      <Pressable
                        onPress={() => handleSkipPermission(permission.id)}
                        style={styles.skipButton}
                        hitSlop={8}
                      >
                        <Text style={styles.skipButtonText}>Skip</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            </Animated.View>
          );
        })}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
          style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
        >
          <Text style={[styles.continueButtonText, !canContinue && styles.continueButtonTextDisabled]}>
            Continue
          </Text>
        </Pressable>
        <Text style={styles.footerNote}>
          {canContinue
            ? "You're all set! Tap continue to proceed."
            : 'Please grant required permissions to continue'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  permissionsList: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 12,
  },
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  permissionCardFaded: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerGranted: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  permissionInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  permissionTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
  permissionTitleFaded: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  requiredBadge: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredText: {
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
    color: '#FF6B35',
    letterSpacing: 0.5,
  },
  permissionDescription: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  permissionDescriptionFaded: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  permissionActions: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  actionButtons: {
    gap: 8,
    alignItems: 'flex-end',
  },
  requestButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  requestButtonText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: 4,
  },
  skipButtonText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  grantedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  grantedText: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    color: '#22C55E',
  },
  skippedText: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  continueButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  continueButtonDisabled: {
    backgroundColor: 'rgba(255, 107, 53, 0.3)',
  },
  continueButtonText: {
    fontSize: 17,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  continueButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  footerNote: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});
