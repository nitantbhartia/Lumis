import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, Plus, Target, X, Check } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';
import * as Haptics from 'expo-haptics';
import {
  showAppPicker,
  activateShield,
  deactivateShield,
  isShieldActive,
  requestScreenTimeAuthorization,
  getScreenTimePermissionStatus,
  LumisIcon,
  syncShieldDisplayData,
} from '@/lib/screen-time';
import { useFocusEffect, useRouter } from 'expo-router';
import { HighFrictionUnlockModal } from '@/components/shield/HighFrictionUnlockModal';
import { useWeather } from '@/lib/hooks/useWeather';

const GOAL_MINUTES = 2;

export default function LockedAppsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const weather = useWeather();

  const blockedApps = useLumisStore((s) => s.blockedApps);
  const todayProgress = useLumisStore((s) => s.todayProgress);
  const currentStreak = useLumisStore((s) => s.currentStreak);
  const isShieldEngaged = useLumisStore((s) => s.isShieldEngaged);

  const [hasPermission, setHasPermission] = useState(false);
  const [isPickerLoading, setIsPickerLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showBreakModal, setShowBreakModal] = useState(false);

  const isGoalMet = todayProgress.completed || todayProgress.lightMinutes >= GOAL_MINUTES;
  const isLocked = isShieldEngaged && !isGoalMet;
  const isDarkMode = !weather.isDaylight;
  const backgroundColor = '#0F172A'; // Match dashboard dark theme

  const activeBlockedApps = useMemo(
    () => blockedApps.filter((a) => a.isBlocked),
    [blockedApps]
  );

  const lightRemaining = Math.max(0, GOAL_MINUTES - todayProgress.lightMinutes);

  useFocusEffect(
    useCallback(() => {
      const syncState = async () => {
        const status = await getScreenTimePermissionStatus();
        setHasPermission(status);

        if (status) {
          const nativeStatus = isShieldActive();
          if (nativeStatus !== isShieldEngaged) {
            useLumisStore.getState().setShieldEngaged(nativeStatus);
          }
          useLumisStore.getState().syncWithNativeBlockedApps();
        }
      };
      syncState();
    }, [isShieldEngaged])
  );

  const handleRequestPermission = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPickerLoading(true);
    try {
      const result = await requestScreenTimeAuthorization();
      if (result) {
        setHasPermission(true);
        setTimeout(() => handleChooseApps(), 500);
      } else {
        Alert.alert('Permission Needed', 'Please enable Screen Time in Settings to lock apps.');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message);
    } finally {
      setIsPickerLoading(false);
    }
  };

  const handleChooseApps = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowInstructions(true);
  };

  const openNativePicker = async () => {
    setShowInstructions(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPickerLoading(true);
    setTimeout(async () => {
      try {
        const result = await showAppPicker();
        if (result && (result.success || result.toggles)) {
          useLumisStore.getState().syncWithNativeBlockedApps();
        }
      } catch (error: any) {
        Alert.alert('Error', error?.message);
      } finally {
        setIsPickerLoading(false);
      }
    }, 600);
  };

  const handleActivateLock = () => {
    if (!hasPermission) {
      handleRequestPermission();
      return;
    }
    if (blockedApps.length === 0) {
      Alert.alert('No Apps Selected', 'Choose which apps to lock first.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    activateShield();
    syncShieldDisplayData();
  };

  const handleUnlockEarly = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setShowBreakModal(true);
  };

  const executeUnlock = () => {
    setShowBreakModal(false);
    deactivateShield();
  };

  // Get display apps (max 6 for the grid)
  const displayApps = activeBlockedApps.slice(0, 6);
  const remainingCount = activeBlockedApps.length - 6;

  return (
    <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, isDarkMode && styles.textLight]}>
          {isLocked ? 'Locked' : isGoalMet ? 'Unlocked' : 'Your Apps'}
        </Text>
        <Text style={[styles.subtitle, isDarkMode && styles.textSecondaryLight]}>
          {isLocked
            ? `${lightRemaining}m of sunlight to unlock`
            : isGoalMet
            ? 'All apps available today'
            : 'Choose apps to lock until you walk'}
        </Text>
      </View>

      {/* Main Content - Large App Icons */}
      <View style={styles.mainContent}>
        {Platform.OS === 'ios' && blockedApps.length > 0 ? (
          <>
            {/* Large App Grid */}
            <View style={styles.appGrid}>
              {displayApps.map((app, index) => (
                <View
                  key={`${app.name}-${index}`}
                  style={[
                    styles.appCard,
                    isDarkMode ? styles.appCardDark : styles.appCardLight,
                    isLocked && styles.appCardLocked,
                    isGoalMet && styles.appCardUnlocked,
                  ]}
                >
                  <LumisIcon
                    style={{ width: 100, height: 100 }}
                    appName={app.name}
                    tokenData={(app as any).tokenData}
                    isCategory={!!app.isCategory}
                    size={100}
                    grayscale={false}
                  />
                  {isLocked && (
                    <View style={styles.lockBadge}>
                      <Lock size={14} color="#FFFFFF" strokeWidth={2.5} />
                    </View>
                  )}
                  {isGoalMet && (
                    <View style={styles.unlockBadge}>
                      <Check size={16} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                </View>
              ))}
              {remainingCount > 0 && (
                <View style={[styles.appCard, styles.moreCard, isDarkMode && styles.moreCardDark]}>
                  <Text style={[styles.moreCount, isDarkMode && styles.textLight]}>
                    +{remainingCount}
                  </Text>
                  <Text style={[styles.moreLabel, isDarkMode && styles.textSecondaryLight]}>
                    more
                  </Text>
                </View>
              )}
            </View>

            {/* Edit Apps Link */}
            <Pressable
              style={styles.editButton}
              onPress={hasPermission ? handleChooseApps : handleRequestPermission}
            >
              <Text style={styles.editButtonText}>Edit apps</Text>
            </Pressable>
          </>
        ) : Platform.OS === 'ios' ? (
          /* Empty State */
          <Pressable
            style={[styles.emptyState, isDarkMode && styles.emptyStateDark]}
            onPress={hasPermission ? handleChooseApps : handleRequestPermission}
          >
            <View style={styles.emptyIconContainer}>
              <Plus size={32} color="#FF6B35" strokeWidth={2} />
            </View>
            <Text style={[styles.emptyTitle, isDarkMode && styles.textLight]}>
              Add Distracting Apps
            </Text>
            <Text style={[styles.emptySubtitle, isDarkMode && styles.textSecondaryLight]}>
              Select apps to lock until you complete your morning walk
            </Text>
          </Pressable>
        ) : (
          <View style={[styles.emptyState, isDarkMode && styles.emptyStateDark]}>
            <Text style={[styles.emptyTitle, isDarkMode && styles.textLight]}>
              iOS Only Feature
            </Text>
            <Text style={[styles.emptySubtitle, isDarkMode && styles.textSecondaryLight]}>
              App locking is currently available on iOS devices
            </Text>
          </View>
        )}
      </View>

      {/* Bottom CTA */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
        {isShieldEngaged ? (
          isLocked ? (
            <Pressable style={styles.unlockButton} onPress={handleUnlockEarly}>
              <Text style={styles.unlockButtonText}>I need to unlock now</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.unlockButton}
              onPress={() => deactivateShield()}
            >
              <Text style={styles.unlockButtonText}>Turn off for tomorrow</Text>
            </Pressable>
          )
        ) : blockedApps.length > 0 ? (
          <Pressable style={styles.lockButton} onPress={handleActivateLock}>
            <Lock size={20} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.lockButtonText}>Lock Apps</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Unlock Modal */}
      <HighFrictionUnlockModal
        visible={showBreakModal}
        onClose={() => setShowBreakModal(false)}
        onUnlock={executeUnlock}
        currentStreak={currentStreak}
      />

      {/* App Picker Instructions Modal */}
      <Modal
        visible={showInstructions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInstructions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Pressable
              style={styles.modalClose}
              onPress={() => setShowInstructions(false)}
            >
              <X size={20} color="#94A3B8" />
            </Pressable>
            <View style={styles.modalIconContainer}>
              <Target size={32} color="#FF6B35" />
            </View>
            <Text style={styles.modalTitle}>Choose Apps</Text>
            <Text style={styles.modalText}>
              Select which apps you want locked until you complete your morning light.
            </Text>
            <Pressable style={styles.modalButton} onPress={openNativePicker}>
              <Text style={styles.modalButtonText}>Open App Picker</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#1A1A2E',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    textAlign: 'center',
  },
  textLight: {
    color: '#FFFFFF',
  },
  textSecondaryLight: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  appGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  appCard: {
    width: 105,
    height: 105,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  appCardLight: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  appCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  appCardLocked: {
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  appCardUnlocked: {
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  lockBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF9F0',
  },
  unlockBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF9F0',
  },
  moreCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  moreCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  moreCount: {
    fontSize: 28,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
  },
  moreLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#666',
  },
  editButton: {
    alignSelf: 'center',
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  editButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FF6B35',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    marginHorizontal: 8,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  emptyStateDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowOpacity: 0,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  lockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  lockButtonText: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  unlockButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  unlockButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#FF6B35',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
});
