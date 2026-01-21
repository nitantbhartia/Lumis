import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Lock, Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLumisStore } from '@/lib/state/lumis-store';
import { purchasePackage, getOfferings } from '@/lib/revenuecat';
import { PurchasesPackage } from 'react-native-purchases';

interface EmergencyUnlockModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EmergencyUnlockModal({ visible, onClose, onSuccess }: EmergencyUnlockModalProps) {
    const insets = useSafeAreaInsets();
    const addEmergencyFlares = useLumisStore((s) => s.addEmergencyFlares);
    const emergencyFlares = useLumisStore((s) => s.emergencyFlares);
    const consumeFlare = useLumisStore((s) => s.consumeEmergencyFlare);

    const [loading, setLoading] = useState(false);
    const [offering, setOffering] = useState<PurchasesPackage | null>(null);

    useEffect(() => {
        if (visible) {
            loadOffering();
        }
    }, [visible]);

    const loadOffering = async () => {
        const current = await getOfferings();
        // In a real implementation we would look for the specific package
        // e.g. setOffering(current?.availablePackages.find(p => p.identifier === 'emergency_flare'));
        // For development/mock, we just grab first unless none exists.
        if (current && current.availablePackages.length > 0) {
            setOffering(current.availablePackages[0]);
        }
    };

    const handleUseFlare = () => {
        if (emergencyFlares > 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            consumeFlare();
            onSuccess();
            onClose();
        } else {
            handlePurchase();
        }
    };

    const handlePurchase = async () => {
        setLoading(true);
        if (!offering) {
            // MOCK PURCHASE for development
            setTimeout(() => {
                setLoading(false);
                addEmergencyFlares(1);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                // Auto-use immediately after buying?
                // For better UX, let's just make them available and use one.
                consumeFlare();
                onSuccess();
                onClose();
            }, 1500);
            return;
        }

        const { success } = await purchasePackage(offering);
        setLoading(false);
        if (success) {
            addEmergencyFlares(1);
            consumeFlare();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSuccess();
            onClose();
        }
    };

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
                            <Lock size={48} color="#FF6347" strokeWidth={2} />
                        </View>

                        <Text style={styles.title}>Breaking your promise?</Text>
                        <Text style={styles.description}>
                            You committed to getting morning sunlight before opening this app.
                        </Text>

                        {emergencyFlares > 0 ? (
                            <View style={styles.flareContainer}>
                                <Flame size={20} color="#FF8C00" fill="#FF8C00" />
                                <Text style={styles.flareText}>You have {emergencyFlares} Emergency Flare{emergencyFlares !== 1 && 's'}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <Pressable
                            onPress={handleUseFlare}
                            disabled={loading}
                            style={styles.primaryButton}
                        >
                            <LinearGradient
                                colors={['#FF6347', '#FF4500']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradientButton}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>
                                        {emergencyFlares > 0 ? 'Use Emergency Flare' : 'Unlock Now ($0.99)'}
                                    </Text>
                                )}
                            </LinearGradient>
                        </Pressable>

                        <Pressable onPress={onClose} style={styles.secondaryButton}>
                            <Text style={styles.secondaryButtonText}>I'll go get sunlight</Text>
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
        backgroundColor: '#FFF0EE',
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
    flareContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E1',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 16,
        gap: 8,
    },
    flareText: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FF8C00',
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
