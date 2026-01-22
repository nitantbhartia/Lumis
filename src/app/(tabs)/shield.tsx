import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Switch, Image, Dimensions, Platform, ActivityIndicator, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shield, Lock, Unlock, Instagram, Video, Twitter, Facebook, Youtube, MessageCircle, Ghost, Film, AlertCircle, Plus, Check, Layers, Search, Target, X } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';
import * as Haptics from 'expo-haptics';
import { showAppPicker, activateShield, deactivateShield, getSelectedAppCount, isShieldActive, requestScreenTimeAuthorization, getScreenTimePermissionStatus, getAppToggles, toggleNativeApp } from '@/lib/screen-time';

const { width } = Dimensions.get('window');

const AppIcon = ({ id, color }: { id: string, color: string }) => {
    switch (id) {
        case 'instagram': return <Instagram size={24} color={color} />;
        case 'tiktok': return <Video size={24} color={color} />;
        case 'twitter': return <Twitter size={24} color={color} />;
        case 'facebook': return <Facebook size={24} color={color} />;
        case 'youtube': return <Youtube size={24} color={color} />;
        case 'reddit': return <MessageCircle size={24} color={color} />;
        case 'snapchat': return <Ghost size={24} color={color} />;
        case 'netflix': return <Film size={24} color={color} />;
        default: return <Shield size={24} color={color} />;
    }
};

import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function ShieldHub() {
    const insets = useSafeAreaInsets();
    const { blockedApps, toggleAppBlocked, isTrackingActive, dailyGoalMinutes, todayProgress } = useLumisStore();

    const [hasPermission, setHasPermission] = useState(false);
    const [isPickerLoading, setIsPickerLoading] = useState(false);
    const [nativeAppCount, setNativeAppCount] = useState(0);
    const [shieldStatus, setShieldStatus] = useState(false);
    const [nativeAppToggles, setNativeAppToggles] = useState<{ name: string, isEnabled: boolean }[]>([]);
    const [showInstructions, setShowInstructions] = useState(false);

    // Check permission and app count on focus
    useEffect(() => {
        // Initialization logic if needed
    }, []);

    useFocusEffect(
        useCallback(() => {
            const checkStatus = async () => {
                if (Platform.OS === 'ios') {
                    // Test bridge
                    try {
                        const { hello } = require('lumisscreentime');
                        console.log('[Shield] Bridge test:', hello());
                    } catch (e) {
                        console.error('[Shield] Bridge test failed:', e);
                    }

                    const status = await getScreenTimePermissionStatus();
                    setHasPermission(status);
                    if (status) {
                        setNativeAppCount(getSelectedAppCount());
                        setShieldStatus(isShieldActive());
                        setNativeAppToggles(getAppToggles());
                    }
                }
            };
            checkStatus();
        }, [])
    );

    const isGoalMet = todayProgress.lightMinutes >= dailyGoalMinutes;
    const isLocked = !isGoalMet;

    const handleToggle = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        toggleAppBlocked(id);
    };

    const handleRequestPermission = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsPickerLoading(true);
        try {
            console.log('[Shield] Calling requestScreenTimeAuthorization...');
            const result = await requestScreenTimeAuthorization();
            console.log('[Shield] requestScreenTimeAuthorization result:', result);

            if (result) {
                setHasPermission(true);
                Alert.alert("Success", "Screen Time permission granted!");
                // Proactively open the picker for the user
                setTimeout(() => {
                    handleChooseApps();
                }, 500);
            } else {
                setHasPermission(false);
                Alert.alert("Permission Denied", "Please enable Screen Time in Settings > Screen Time > Content & Privacy Restrictions.");
            }
        } catch (error: any) {
            console.error('[Shield] Permission error:', error);
            Alert.alert("Error", `Failed to request permission: ${error?.message || 'Unknown error'}`);
        } finally {
            setIsPickerLoading(false);
        }
    };

    const handleNativeAppToggle = (name: string, isEnabled: boolean) => {
        Haptics.selectionAsync();
        toggleNativeApp(name, isEnabled);
        // Refresh toggles and count
        setNativeAppToggles(getAppToggles());
        setNativeAppCount(getSelectedAppCount());

        // If the shield is already active, we might need to re-activate to apply changes
        if (shieldStatus) {
            activateShield();
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
        console.log('[Shield] openNativePicker called - waiting for modal to close');

        // Wait for modal animation to finish
        setTimeout(async () => {
            try {
                console.log('[Shield] Calling showAppPicker...');
                const result = await showAppPicker();
                console.log('[Shield] showAppPicker returned:', result);

                if (result && result.success) {
                    const count = result.count;
                    const toggles = result.toggles;

                    console.log(`[Shield] Selection saved. Count: ${count}, Toggles: ${toggles.length}`);

                    setNativeAppCount(count);
                    setNativeAppToggles(toggles);

                    if (count === 0 && toggles.length > 0) {
                        setNativeAppCount(toggles.length);
                    }
                }
            } catch (error: any) {
                console.error('[Shield] Picker error:', error);
                Alert.alert("Picker Error", error?.message || "Could not open app picker");
            } finally {
                console.log('[Shield] openNativePicker finally');
                setIsPickerLoading(false);
            }
        }, 600);
    };

    const handleActivateShield = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        const result = activateShield();
        setShieldStatus(result);
        if (result) {
            Alert.alert("Shield Active", "Selected apps are now blocked.");
        } else {
            Alert.alert("Shield Failed", "Could not activate the shield. Please check permissions.");
        }
    };

    const handleDeactivateShield = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        deactivateShield();
        setShieldStatus(false);
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
            <LinearGradient
                colors={['#1A1A2E', '#16213E', '#0F3460']}
                style={{ flex: 1 }}
            >
                <View style={{ paddingTop: insets.top + 20, paddingHorizontal: 24, paddingBottom: 20 }}>
                    <View style={styles.headerRow}>
                        <Shield size={28} color="#FFB347" fill="#FFB347" />
                        <Text style={styles.headerTitle}>Shields (TEST)</Text>
                    </View>
                    <Text style={styles.headerSubtitle}>
                        Manage your distractions. Blocked apps stay locked until you get your morning light.
                    </Text>
                </View>

                <ScrollView
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* iOS Native App Picker Section */}
                    {Platform.OS === 'ios' && (
                        <View style={styles.nativeSection}>
                            <Text style={styles.sectionTitle}>Screen Time Shield</Text>

                            {!hasPermission ? (
                                <View style={{ gap: 12 }}>
                                    <Pressable
                                        style={[styles.permissionButton, isPickerLoading && { opacity: 0.7 }]}
                                        onPress={handleRequestPermission}
                                        disabled={isPickerLoading}
                                    >
                                        <LinearGradient
                                            colors={['#FFB347', '#FF8C00']}
                                            style={styles.permissionGradient}
                                        >
                                            {isPickerLoading ? (
                                                <ActivityIndicator color="#1A1A2E" size="small" />
                                            ) : (
                                                <>
                                                    <Shield size={20} color="#1A1A2E" />
                                                    <Text style={styles.permissionButtonText}>Enable Screen Time Access</Text>
                                                </>
                                            )}
                                        </LinearGradient>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => {
                                            setHasPermission(true);
                                            Haptics.selectionAsync();
                                        }}
                                        style={{ alignSelf: 'center', marginTop: 8 }}
                                    >
                                        <Text style={{ color: '#666', fontSize: 12, textDecorationLine: 'underline' }}>
                                            Debug: I've already enabled it (Bypass)
                                        </Text>
                                    </Pressable>
                                </View>
                            ) : (
                                <>
                                    <View style={styles.reminderCard}>
                                        <AlertCircle size={18} color="#FFB347" />
                                        <Text style={styles.reminderText}>
                                            <Text style={{ fontWeight: 'bold' }}>Important:</Text> Apps MUST be selected in the System Picker below to be blocked.
                                        </Text>
                                    </View>

                                    <Pressable
                                        style={styles.chooseAppsButton}
                                        onPress={handleChooseApps}
                                        disabled={isPickerLoading}
                                    >
                                        {isPickerLoading ? (
                                            <ActivityIndicator color="#FFB347" />
                                        ) : (
                                            <>
                                                <Plus size={20} color="#FFB347" />
                                                <Text style={styles.chooseAppsText}>
                                                    {nativeAppCount > 0
                                                        ? `${nativeAppCount} Apps Selected — Tap to Edit`
                                                        : 'Open System App Picker'}
                                                </Text>
                                            </>
                                        )}
                                    </Pressable>

                                    {nativeAppCount > 0 && (
                                        <View style={styles.shieldControlRow}>
                                            <Pressable
                                                style={[styles.shieldButton, shieldStatus && styles.shieldButtonActive]}
                                                onPress={shieldStatus ? handleDeactivateShield : handleActivateShield}
                                            >
                                                {shieldStatus ? (
                                                    <>
                                                        <Unlock size={18} color="#4CAF50" />
                                                        <Text style={[styles.shieldButtonText, { color: '#4CAF50' }]}>Deactivate Shield</Text>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock size={18} color="#FF6B6B" />
                                                        <Text style={[styles.shieldButtonText, { color: '#FF6B6B' }]}>Activate Shield Now</Text>
                                                    </>
                                                )}
                                            </Pressable>
                                        </View>
                                    )}
                                </>
                            )}
                        </View>
                    )}

                    <View style={styles.statusCard}>
                        <LinearGradient
                            colors={isLocked ? ['rgba(255, 107, 107, 0.15)', 'rgba(255, 107, 107, 0.05)'] : ['rgba(76, 175, 80, 0.15)', 'rgba(76, 175, 80, 0.05)']}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                        <View style={styles.statusHeader}>
                            {isLocked ? (
                                <Lock size={20} color="#FF6B6B" />
                            ) : (
                                <Unlock size={20} color="#4CAF50" />
                            )}
                            <Text style={[styles.statusTitle, { color: isLocked ? '#FF6B6B' : '#4CAF50' }]}>
                                {isLocked ? 'APPS LOCKED' : 'APPS UNLOCKED'}
                            </Text>
                        </View>
                        <Text style={styles.statusDescription}>
                            {isLocked
                                ? `Get ${Math.max(0, dailyGoalMinutes - todayProgress.lightMinutes)} more minutes of sunlight to unlock your shielded apps.`
                                : "You've met your daily light goal! All apps are available."
                            }
                        </Text>
                    </View>

                    <Text style={styles.sectionTitle}>
                        {nativeAppToggles.length > 0 ? 'Shielded Apps' : 'Quick Toggles'}
                    </Text>

                    {nativeAppToggles.length > 0 ? (
                        // Show actual apps from native picker
                        nativeAppToggles.map((app, index) => (
                            <View key={`${app.name}-${index}`} style={styles.appRow}>
                                <View style={styles.appIconContainer}>
                                    <Shield size={24} color="#FFF" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.appName}>{app.name}</Text>
                                    <Text style={styles.appStatus}>
                                        {app.isEnabled ? (isLocked ? '🔒 Managed by Shield' : '🔓 Active') : 'Shield Disabled'}
                                    </Text>
                                </View>
                                <Switch
                                    value={app.isEnabled}
                                    onValueChange={(val) => handleNativeAppToggle(app.name, val)}
                                    trackColor={{ false: '#333', true: '#FFB347' }}
                                    thumbColor="#FFF"
                                />
                            </View>
                        ))
                    ) : (
                        // Fallback to mock apps
                        blockedApps.map((app) => (
                            <View key={app.id} style={styles.appRow}>
                                <View style={styles.appIconContainer}>
                                    <AppIcon id={app.id} color="#FFF" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.appName}>{app.name}</Text>
                                    <Text style={styles.appStatus}>
                                        {app.isBlocked ? (isLocked ? '🔒 Locked' : '🔓 Unlocked by Sun') : 'Always Available'}
                                    </Text>
                                </View>
                                <Switch
                                    value={app.isBlocked}
                                    onValueChange={() => handleToggle(app.id)}
                                    trackColor={{ false: '#333', true: '#FFB347' }}
                                    thumbColor="#FFF"
                                />
                            </View>
                        ))
                    )}

                    <View style={styles.proTipContainer}>
                        <AlertCircle size={16} color="#A0A0A0" />
                        <Text style={styles.proTipText}>
                            Use "Screen Time Shield" above to block apps at the iOS level. Quick toggles are for in-app tracking only.
                        </Text>
                    </View>

                </ScrollView>
            </LinearGradient>

            {/* Instruction Overlay Modal */}
            <Modal
                visible={showInstructions}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowInstructions(false)}
            >
                <View style={styles.instructionsOverlay}>
                    <View style={styles.instructionsCard}>
                        {/* Close Button */}
                        <Pressable
                            style={{ position: 'absolute', top: 16, right: 16, padding: 8, zIndex: 10 }}
                            onPress={() => setShowInstructions(false)}
                        >
                            <X size={20} color="#94A3B8" />
                        </Pressable>

                        <View style={styles.instructionIconCircle}>
                            <Target size={32} color="#FFB347" />
                        </View>

                        <Text style={styles.instructionTitle}>Select Your "Big 3"</Text>
                        <Text style={styles.instructionText}>
                            The next screen shows all your apps. For best results, ignore the noise and focus on just 3 things:
                        </Text>

                        <View style={styles.instructionStep}>
                            <Layers size={20} color="#FFB347" />
                            <Text style={styles.instructionStepText}>Use <Text style={{ fontWeight: 'bold', color: '#FFF' }}>Categories</Text> to block Social & Games in one tap.</Text>
                        </View>

                        <View style={styles.instructionStep}>
                            <Search size={20} color="#FFB347" />
                            <Text style={styles.instructionStepText}>Use the <Text style={{ fontWeight: 'bold', color: '#FFF' }}>Search Bar</Text> to find specific apps quickly.</Text>
                        </View>

                        <Pressable
                            style={styles.instructionButton}
                            onPress={openNativePicker}
                        >
                            <LinearGradient
                                colors={['#FFB347', '#FF8C00']}
                                style={styles.instructionButtonGradient}
                            >
                                <Text style={styles.instructionButtonText}>I'm Ready — Select Apps</Text>
                            </LinearGradient>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 32,
        fontFamily: 'Outfit_700Bold',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        color: '#A0A0A0',
        lineHeight: 22,
    },
    statusCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    statusTitle: {
        fontSize: 14,
        fontFamily: 'Outfit_700Bold',
        letterSpacing: 1,
    },
    statusDescription: {
        fontSize: 16,
        fontFamily: 'Outfit_500Medium',
        color: '#FFFFFF',
        lineHeight: 22,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    appRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    appIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    appName: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    appStatus: {
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
        color: '#A0A0A0',
    },
    proTipContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 24,
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
    },
    proTipText: {
        flex: 1,
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
        color: '#A0A0A0',
        lineHeight: 18,
    },
    nativeSection: {
        marginBottom: 24,
    },
    permissionButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    permissionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    permissionButtonText: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#1A1A2E',
    },
    chooseAppsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: 'rgba(255, 179, 71, 0.1)',
        borderWidth: 1,
        borderColor: '#FFB347',
        borderStyle: 'dashed',
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 24,
    },
    chooseAppsText: {
        fontSize: 16,
        fontFamily: 'Outfit_500Medium',
        color: '#FFB347',
    },
    shieldControlRow: {
        marginTop: 12,
    },
    shieldButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.3)',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    shieldButtonActive: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderColor: 'rgba(76, 175, 80, 0.3)',
    },
    shieldButtonText: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
    },
    reminderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(255, 179, 71, 0.1)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 179, 71, 0.2)',
    },
    reminderText: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'Outfit_500Medium',
        color: '#FFFFFF',
        lineHeight: 18,
    },
    instructionsOverlay: {
        flex: 1,
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    instructionsCard: {
        width: '100%',
        backgroundColor: '#1E293B',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    instructionIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 179, 71, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 179, 71, 0.3)',
    },
    instructionTitle: {
        fontSize: 22,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    instructionText: {
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    instructionStep: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    instructionStepText: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'Outfit_500Medium',
        color: '#E2E8F0',
        marginLeft: 12,
    },
    instructionButton: {
        width: '100%',
        marginTop: 16,
    },
    instructionButtonGradient: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    instructionButtonText: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#1A1A2E',
    },
});
