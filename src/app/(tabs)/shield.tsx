import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Switch, Image, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shield, Lock, Unlock, Instagram, Video, Twitter, Facebook, Youtube, MessageCircle, Ghost, Film, AlertCircle, Plus, Check } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';
import * as Haptics from 'expo-haptics';
import { showAppPicker, activateShield, deactivateShield, getSelectedAppCount, isShieldActive, requestScreenTimeAuthorization, getScreenTimePermissionStatus } from '@/lib/screen-time';

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

export default function ShieldHub() {
    const insets = useSafeAreaInsets();
    const { blockedApps, toggleAppBlocked, isTrackingActive, dailyGoalMinutes, todayProgress } = useLumisStore();

    const [hasPermission, setHasPermission] = useState(false);
    const [isPickerLoading, setIsPickerLoading] = useState(false);
    const [nativeAppCount, setNativeAppCount] = useState(0);
    const [shieldStatus, setShieldStatus] = useState(false);

    // Check permission and app count on mount
    useEffect(() => {
        const checkStatus = async () => {
            if (Platform.OS === 'ios') {
                const status = await getScreenTimePermissionStatus();
                setHasPermission(status);
                if (status) {
                    setNativeAppCount(getSelectedAppCount());
                    setShieldStatus(isShieldActive());
                }
            }
        };
        checkStatus();
    }, []);

    const isGoalMet = todayProgress.lightMinutes >= dailyGoalMinutes;
    const isLocked = !isGoalMet;

    const handleToggle = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        toggleAppBlocked(id);
    };

    const handleRequestPermission = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const result = await requestScreenTimeAuthorization();
        setHasPermission(result);
    };

    const handleChooseApps = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsPickerLoading(true);
        try {
            const result = await showAppPicker();
            if (result) {
                setNativeAppCount(getSelectedAppCount());
            }
        } finally {
            setIsPickerLoading(false);
        }
    };

    const handleActivateShield = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        const result = activateShield();
        setShieldStatus(result);
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
                        <Text style={styles.headerTitle}>Shields</Text>
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
                                <Pressable style={styles.permissionButton} onPress={handleRequestPermission}>
                                    <LinearGradient
                                        colors={['#FFB347', '#FF8C00']}
                                        style={styles.permissionGradient}
                                    >
                                        <Shield size={20} color="#1A1A2E" />
                                        <Text style={styles.permissionButtonText}>Enable Screen Time Access</Text>
                                    </LinearGradient>
                                </Pressable>
                            ) : (
                                <>
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
                                                        : 'Choose Apps to Shield'}
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

                    <Text style={styles.sectionTitle}>Quick Toggles</Text>

                    {blockedApps.map((app) => (
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
                    ))}

                    <View style={styles.proTipContainer}>
                        <AlertCircle size={16} color="#A0A0A0" />
                        <Text style={styles.proTipText}>
                            Use "Screen Time Shield" above to block apps at the iOS level. Quick toggles are for in-app tracking only.
                        </Text>
                    </View>

                </ScrollView>
            </LinearGradient>
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
});
