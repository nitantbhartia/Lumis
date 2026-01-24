import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Switch, Dimensions, Platform, ActivityIndicator, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shield, Lock, Unlock, Instagram, Video, Twitter, Facebook, Youtube, MessageCircle, Ghost, Film, AlertCircle, Plus, Check, Search, Target, X, Zap, Clock, Brain } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';
import { useAuthStore } from '@/lib/state/auth-store';
import * as Haptics from 'expo-haptics';
import { showAppPicker, activateShield, deactivateShield, getSelectedAppCount, isShieldActive, requestScreenTimeAuthorization, getScreenTimePermissionStatus, getAppToggles, toggleNativeApp, LumisIcon, clearMetadata, syncShieldDisplayData } from '@/lib/screen-time';
import { useFocusEffect } from 'expo-router';
import { HighFrictionUnlockModal } from '@/components/shield/HighFrictionUnlockModal';
import { LumisHeroButton } from '@/components/ui/LumisHeroButton';
import { ShieldPreviewRow } from '@/components/ShieldPreviewRow';
import { BlurView } from 'expo-blur';
import { useSmartEnvironment } from '@/lib/hooks/useSmartEnvironment';
import { useWeather } from '@/lib/hooks/useWeather';
import { useMissionBriefing } from '@/lib/hooks/useMissionBriefing';
import { formatFirstName } from '@/lib/utils/name-utils';

const { width } = Dimensions.get('window');

// ... (keep AppIcon if needed, but we use LumisIcon mostly now)

export default function ShieldHub() {
    const insets = useSafeAreaInsets();
    const { blockedApps, dailyGoalMinutes, todayProgress, currentStreak } = useLumisStore();
    const isShieldEngaged = useLumisStore((s) => s.isShieldEngaged);
    const { lux } = useSmartEnvironment();
    const weather = useWeather();
    const userName = useAuthStore((s) => s.userName);

    const [hasPermission, setHasPermission] = useState(false);
    const [isPickerLoading, setIsPickerLoading] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [showBreakModal, setShowBreakModal] = useState(false);

    // Dynamic Goal Logic (Same as Dashboard)
    const now = new Date();
    const sunriseMinutes = 6 * 60 + 49;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const hoursSinceSunrise = Math.max(0, (currentMinutes - sunriseMinutes) / 60);

    const mission = useMissionBriefing(weather.condition, hoursSinceSunrise, currentStreak, userName, dailyGoalMinutes);
    const currentSessionGoal = mission.durationValue;

    // Filter active apps for preview
    const activeBlockedApps = useMemo(() => blockedApps.filter(a => a.isBlocked), [blockedApps]);

    useFocusEffect(
        useCallback(() => {
            const syncShieldState = async () => {
                const status = await getScreenTimePermissionStatus();
                setHasPermission(status);

                if (status) {
                    // Read native state
                    const nativeStatus = isShieldActive();

                    // If mismatch detected, trust native and update store
                    if (nativeStatus !== isShieldEngaged) {
                        console.warn('[Shield] State mismatch detected - Native:', nativeStatus, 'Store:', isShieldEngaged);
                        useLumisStore.getState().setShieldEngaged(nativeStatus);
                    }

                    // Sync blocked apps list
                    useLumisStore.getState().syncWithNativeBlockedApps();
                }
            };
            syncShieldState();
        }, [isShieldEngaged])
    );

    const isGoalMet = todayProgress.lightMinutes >= currentSessionGoal;
    const isLocked = isShieldEngaged && !isGoalMet;

    const details = isLocked ? {
        lightRemaining: Math.max(0, currentSessionGoal - todayProgress.lightMinutes),
        statusText: "Shielding Active",
        statusColor: "#FF6B6B"
    } : {
        lightRemaining: 0,
        statusText: "Systems Normal",
        statusColor: "#4CAF50"
    };

    const handleRequestPermission = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsPickerLoading(true);
        try {
            const result = await requestScreenTimeAuthorization();
            if (result) {
                setHasPermission(true);
                Alert.alert("Success", "Screen Time permission granted!");
                setTimeout(() => handleChooseApps(), 500);
            } else {
                setHasPermission(false);
                Alert.alert("Permission Denied", "Please enable Screen Time in Settings.");
            }
        } catch (error: any) {
            Alert.alert("Error", `Failed to request permission: ${error?.message}`);
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
                // We no longer clear metadata here as it wipes the existing selection reference
                // while the bridge is preparing the picker.
                const result = await showAppPicker();
                console.log('[ShieldHub] Picker selection result:', JSON.stringify(result));

                if (result && (result.success || result.toggles)) {
                    // Sync to global store immediately
                    useLumisStore.getState().syncWithNativeBlockedApps();
                }
            } catch (error: any) {
                Alert.alert("Picker Error", error?.message);
            } finally {
                setIsPickerLoading(false);
            }
        }, 600);
    };

    const handleActivateShield = () => {
        if (!hasPermission) {
            handleRequestPermission();
            return;
        }
        if (blockedApps.length === 0) {
            Alert.alert("No Apps Selected", "Please select apps to shield first.");
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        // activateShield now automatically syncs to store
        activateShield();
        // Sync shield display data to the custom blocked app screen
        syncShieldDisplayData();
    };

    const handleBreakProtocol = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setShowBreakModal(true);
    };

    const executeBreak = () => {
        setShowBreakModal(false);
        // deactivateShield now automatically syncs to store
        deactivateShield();
        // Note: performEmergencyUnlock is called inside HighFrictionUnlockModal
        // which handles streak reset and tracking
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
            <LinearGradient
                colors={['#0F172A', '#1E293B']}
                style={{ flex: 1 }}
            >
                <View style={{ paddingTop: insets.top + 20, paddingHorizontal: 24, paddingBottom: 20 }}>
                    <View style={styles.headerRow}>
                        <Zap size={24} color="#FFD700" fill="#FFD700" />
                        <Text style={styles.headerTitle}>Mission Control</Text>
                    </View>
                    <Text style={styles.headerSubtitle}>
                        Your biological firewall.
                    </Text>
                </View>

                <ScrollView
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Active Shield Card */}
                    <BlurView intensity={20} tint="light" style={[styles.statusCard, isLocked ? styles.statusCardLocked : styles.statusCardUnlocked]}>
                        <View style={styles.statusContent}>
                            <View style={styles.statusTop}>
                                {isLocked ? <Lock size={24} color="#FF6B6B" /> : <Shield size={24} color="#4CAF50" />}
                                <Text style={[styles.statusTitle, { color: details.statusColor }]}>
                                    {isLocked ? "SHIELD ACTIVE" : "SYSTEMS NORMAL"}
                                </Text>
                            </View>

                            {isLocked ? (
                                <View style={{ gap: 16 }}>
                                    <View style={styles.countdownContainer}>
                                        <Clock size={16} color="#FF6B6B" style={{ marginTop: 2 }} />
                                        <Text style={styles.countdownText}>
                                            <Text style={{ fontFamily: 'Outfit_700Bold' }}>{details.lightRemaining}m</Text> light remaining
                                        </Text>
                                    </View>

                                    {/* Shield Preview Row (Horizontal Scroll) */}
                                    <ShieldPreviewRow activeApps={activeBlockedApps} lux={lux} />
                                </View>
                            ) : (
                                <Text style={styles.statusDesc}>
                                    {isShieldEngaged ? "Sunlight goal met. Apps unlocked." : "Shield is currently inactive."}
                                </Text>
                            )}
                        </View>
                    </BlurView>

                    {/* Apps Section */}
                    {Platform.OS === 'ios' && (
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Shielded Apps</Text>
                                <Pressable hitSlop={10} onPress={hasPermission ? handleChooseApps : handleRequestPermission}>
                                    <Text style={styles.editLink}>
                                        {hasPermission ? "Edit Apps" : "Grant Permission"}
                                    </Text>
                                </Pressable>
                            </View>

                            {blockedApps.length > 0 ? (
                                <View style={styles.gridContainer}>
                                    {blockedApps.map((app, index) => (
                                        <View key={`${app.name}-${index}`} style={[styles.gridItem, isLocked && styles.gridItemLocked]}>
                                            <View style={[styles.gridIcon, isLocked && styles.grayscale]}>
                                                <LumisIcon
                                                    style={{ width: 40, height: 40 }}
                                                    appName={app.name}
                                                    tokenData={(app as any).tokenData}
                                                    isCategory={!!app.isCategory}
                                                    size={40}
                                                    grayscale={isLocked}
                                                />
                                            </View>
                                            <LumisIcon
                                                style={{ width: '100%', height: 20, marginTop: 4 }}
                                                appName={app.name}
                                                tokenData={(app as any).tokenData}
                                                isCategory={!!app.isCategory}
                                                variant="title"
                                                size={12}
                                                grayscale={isLocked}
                                            />
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <Pressable
                                    style={styles.emptyStateCard}
                                    onPress={hasPermission ? handleChooseApps : handleRequestPermission}
                                >
                                    <Plus size={24} color="#A0A0A0" />
                                    <Text style={styles.emptyStateText}>Select apps to shield</Text>
                                </Pressable>
                            )}
                        </View>
                    )}
                </ScrollView>

                {/* Bottom Controls */}
                <View style={[styles.bottomControls, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                    {isShieldEngaged ? (
                        <>
                            {/* Active Shield State */}
                            <LumisHeroButton
                                title={isLocked ? `Unlocks in ${details.lightRemaining}m` : "Mission Complete"}
                                onPress={() => { }}
                                disabled={isLocked}
                                icon={isLocked ? <Lock size={20} color="#666" /> : <Unlock size={20} color="#1A1A2E" />}
                                style={{ marginBottom: 12, opacity: isLocked ? 0.8 : 1 }}
                            />

                            {isLocked && (
                                <Pressable style={styles.breakProtocolButton} onPress={handleBreakProtocol}>
                                    <AlertCircle size={14} color="#FF6B6B" />
                                    <Text style={styles.breakProtocolText}>I Need to Unlock Sooner</Text>
                                </Pressable>
                            )}

                            {!isLocked && (
                                <Pressable style={styles.breakProtocolButton} onPress={() => { deactivateShield(); }}>
                                    <Text style={styles.breakProtocolText}>Deactivate Shield</Text>
                                </Pressable>
                            )}
                        </>
                    ) : (
                        /* Inactive State -> Activate */
                        <LumisHeroButton
                            title="Engage Shield"
                            onPress={handleActivateShield}
                            icon={<Shield size={20} color="#1A1A2E" />}
                        />
                    )}
                </View>

            </LinearGradient>

            <HighFrictionUnlockModal
                visible={showBreakModal}
                onClose={() => setShowBreakModal(false)}
                onUnlock={executeBreak}
                currentStreak={currentStreak}
            />

            {/* Instruction Overlay reused logic */}
            <Modal
                visible={showInstructions}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowInstructions(false)}
            >
                {/* ... (keep instructions overlay content same as before) ... */}
                <View style={styles.instructionsOverlay}>
                    <View style={styles.instructionsCard}>
                        <Pressable style={styles.closeButton} onPress={() => setShowInstructions(false)}>
                            <X size={20} color="#94A3B8" />
                        </Pressable>
                        <View style={styles.instructionIconCircle}>
                            <Target size={32} color="#FFB347" />
                        </View>
                        <Text style={styles.instructionTitle}>Select Apps</Text>
                        <Text style={styles.instructionText}>Choose which apps to block until you've met your light goal.</Text>
                        <Pressable style={styles.instructionButton} onPress={openNativePicker}>
                            <LinearGradient colors={['#FFB347', '#FF8C00']} style={styles.instructionButtonGradient}>
                                <Text style={styles.instructionButtonText}>Open System Picker</Text>
                            </LinearGradient>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View >
    );
}

const styles = StyleSheet.create({

    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 28,
        fontFamily: 'Outfit_700Bold',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        color: '#94A3B8',
        marginLeft: 36,
    },
    statusCard: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        marginBottom: 32,
    },
    statusCardLocked: {
        borderColor: 'rgba(220, 38, 38, 0.3)',
    },
    statusCardUnlocked: {
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    statusContent: {
        padding: 24,
    },
    statusTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    statusTitle: {
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
        letterSpacing: 2,
    },
    countdownContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    countdownText: {
        fontSize: 24,
        fontFamily: 'Outfit_300Light',
        color: '#FFF',
        lineHeight: 32,
    },
    statusDesc: {
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        color: '#94A3B8',
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFFFFF',
    },
    editLink: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        color: '#FFB347',
    },
    emptyStateCard: {
        padding: 32,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
        gap: 12,
    },
    emptyStateText: {
        color: '#64748B',
        fontFamily: 'Outfit_500Medium',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    gridItem: {
        width: (width - 48 - 24) / 3,
        aspectRatio: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        gap: 8,
    },
    gridItemLocked: {
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    gridIcon: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    grayscale: {
        opacity: 0.5,
    },
    gridName: {
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
        color: '#FFF',
        textAlign: 'center',
    },
    bottomControls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    breakProtocolButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 12,
    },
    breakProtocolText: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FF6B6B',
    },
    instructionsOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        padding: 24,
    },
    instructionsCard: {
        backgroundColor: '#1E293B',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 8,
    },
    instructionIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 179, 71, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    instructionTitle: {
        fontSize: 20,
        fontFamily: 'Outfit_700Bold',
        color: '#FFF',
        marginBottom: 8,
    },
    instructionText: {
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    instructionButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    instructionButtonGradient: {
        padding: 16,
        alignItems: 'center',
    },
    instructionButtonText: {
        color: '#1A1A2E',
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 16,
    },
});
