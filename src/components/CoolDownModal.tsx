import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { AlertTriangle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CoolDownModalProps {
    visible: boolean;
    onComplete: () => void;
}

export const CoolDownModal = ({ visible, onComplete }: CoolDownModalProps) => {
    const [secondsLeft, setSecondsLeft] = useState(60);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (!visible) {
            setSecondsLeft(60);
            return;
        }

        const timer = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [visible]);

    const canExit = secondsLeft === 0;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
                <View style={[styles.modalContent, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                    <View style={styles.modalBody}>
                        <AlertTriangle size={48} color="#FFB347" style={{ marginBottom: 24 }} />

                        <Text style={styles.modalTitle}>Biological Break</Text>
                        <Text style={styles.modalText}>
                            Your brain needs this anchor. Leaving now disrupts your cortisol awakening response.
                        </Text>

                        <View style={styles.coolDownTimer}>
                            <Text style={styles.coolDownValue}>{secondsLeft}</Text>
                            <Text style={styles.coolDownLabel}>SECONDS TO COOL DOWN</Text>
                        </View>

                        <Pressable
                            style={[styles.exitButton, !canExit && styles.exitButtonDisabled]}
                            disabled={!canExit}
                            onPress={onComplete}
                        >
                            <Text style={[styles.exitButtonText, !canExit && styles.exitButtonTextDisabled]}>
                                {canExit ? "Confirm Exit" : "Wait to Exit"}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalBody: {
        backgroundColor: '#1A1A2E',
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
        color: '#FFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalText: {
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        color: '#AAA',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    coolDownTimer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    coolDownValue: {
        fontSize: 64,
        fontFamily: 'Outfit_700Bold',
        color: '#FFB347',
        fontVariant: ['tabular-nums'],
    },
    coolDownLabel: {
        fontSize: 12,
        fontFamily: 'Outfit_600SemiBold',
        color: '#666',
        letterSpacing: 2,
        marginTop: 4,
    },
    exitButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: '#FF4444',
        alignItems: 'center',
    },
    exitButtonDisabled: {
        backgroundColor: '#333',
    },
    exitButtonText: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFF',
    },
    exitButtonTextDisabled: {
        color: '#666',
    },
});
