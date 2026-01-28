import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, CalendarOff, Ticket } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLumisStore } from '@/lib/state/lumis-store';
import { purchasePackage, getOfferings, REVENUECAT_OFFERINGS } from '@/lib/revenuecat';
import { PurchasesPackage } from 'react-native-purchases';

interface SkipPassModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function SkipPassModal({ visible, onClose, onSuccess }: SkipPassModalProps) {
    const insets = useSafeAreaInsets();
    const addSkipPasses = useLumisStore((s) => s.addSkipPasses);
    const skipPasses = useLumisStore((s) => s.skipPasses);
    const consumeSkipPass = useLumisStore((s) => s.consumeSkipPass);
    const currentStreak = useLumisStore((s) => s.currentStreak);
    const getRemainingFreeUnlocks = useLumisStore((s) => s.getRemainingFreeUnlocks);
    const useMonthlyFreeUnlock = useLumisStore((s) => s.useMonthlyFreeUnlock);

    const [loading, setLoading] = useState(false);
    const [offering, setOffering] = useState<PurchasesPackage | null>(null);

    const remainingFreeSkips = getRemainingFreeUnlocks();

    useEffect(() => {
        if (visible) {
            loadOffering();
        }
    }, [visible]);

    const loadOffering = async () => {
        const current = await getOfferings();
        if (current) {
            const skipPackage = current.availablePackages.find(
                p => p.identifier === REVENUECAT_OFFERINGS.SKIP_PASS
            );
            if (skipPackage) {
                setOffering(skipPackage);
            } else if (current.availablePackages.length > 0) {
                setOffering(current.availablePackages[0]);
            }
        }
    };

    const handleUseSkipPass = () => {
        // First check if user has purchased skip passes
        if (skipPasses > 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            consumeSkipPass();
            onSuccess();
            onClose();
            return;
        }

        // Then check free monthly skips
        if (remainingFreeSkips > 0) {
            const used = useMonthlyFreeUnlock();
            if (used) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onSuccess();
                onClose();
                return;
            }
        }

        // Otherwise, purchase
        handlePurchase();
    };

    const handlePurchase = async () => {
        setLoading(true);
        if (!offering) {
            setLoading(false);
            Alert.alert('Error', 'No purchase options available at this time. Please try again later.');
            return;
        }

        const { success } = await purchasePackage(offering);
        setLoading(false);
        if (success) {
            addSkipPasses(1);
            consumeSkipPass();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSuccess();
            onClose();
        }
    };

    // Determine button text and availability
    const getButtonText = () => {
        if (skipPasses > 0) {
            return 'Use Skip Pass';
        }
        if (remainingFreeSkips > 0) {
            return 'Use Free Skip';
        }
        return 'Get Skip Pass ($1.99)';
    };

    const hasAvailableSkip = skipPasses > 0 || remainingFreeSkips > 0;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 20 }]}>

                    {/* Header */}
                    <View style={styles.header}>
                        <View />
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <X size={24} color="#1A1A2E" />
                        </Pressable>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        <View style={styles.iconContainer}>
                            <CalendarOff size={48} color="#F59E0B" strokeWidth={1.5} />
                        </View>

                        <Text style={styles.title}>Need to skip today?</Text>
                        <Text style={styles.description}>
                            Life happens. Use a Skip Pass to unlock your apps without losing your streak.
                        </Text>

                        {/* Streak at risk indicator */}
                        {currentStreak > 0 && (
                            <View style={styles.streakContainer}>
                                <Text style={styles.streakText}>
                                    Your {currentStreak}-day streak is safe with a Skip Pass
                                </Text>
                            </View>
                        )}

                        {/* Show available passes */}
                        {skipPasses > 0 ? (
                            <View style={styles.passContainer}>
                                <Ticket size={20} color="#F59E0B" />
                                <Text style={styles.passText}>
                                    You have {skipPasses} Skip Pass{skipPasses !== 1 && 'es'}
                                </Text>
                            </View>
                        ) : remainingFreeSkips > 0 ? (
                            <View style={styles.freeSkipContainer}>
                                <Text style={styles.freeSkipText}>
                                    {remainingFreeSkips} of 3 free skips available this month
                                </Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <Pressable
                            onPress={handleUseSkipPass}
                            disabled={loading}
                            style={styles.primaryButton}
                        >
                            <LinearGradient
                                colors={hasAvailableSkip ? ['#F59E0B', '#D97706'] : ['#F59E0B', '#D97706']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradientButton}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>
                                        {getButtonText()}
                                    </Text>
                                )}
                            </LinearGradient>
                        </Pressable>

                        <Pressable onPress={onClose} style={styles.secondaryButton}>
                            <Text style={styles.secondaryButtonText}>I'll complete my goal instead</Text>
                        </Pressable>
                    </View>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    closeButton: {
        padding: 4,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
    },
    content: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
        color: '#1A1A2E',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 16,
        lineHeight: 24,
    },
    streakContainer: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 16,
    },
    streakText: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
        color: '#92400E',
    },
    passContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 16,
        gap: 8,
    },
    passText: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
        color: '#D97706',
    },
    freeSkipContainer: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 16,
    },
    freeSkipText: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
        color: '#059669',
    },
    actions: {
        gap: 12,
    },
    primaryButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    gradientButton: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontFamily: 'Outfit_600SemiBold',
    },
    secondaryButton: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#666',
        fontSize: 16,
        fontFamily: 'Outfit_500Medium',
    },
});
