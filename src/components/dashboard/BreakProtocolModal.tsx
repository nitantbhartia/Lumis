import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { X, AlertTriangle, Brain, Ban } from 'lucide-react-native';

interface BreakProtocolModalProps {
    visible: boolean;
    onClose: () => void;
    onBreakConfirmed: () => void;
    currentLight: number;
    goalLight: number;
}

const REQUIRED_PHRASE = "I am choosing to sacrifice my morning focus";

export function BreakProtocolModal({ visible, onClose, onBreakConfirmed, currentLight, goalLight }: BreakProtocolModalProps) {
    const [timeLeft, setTimeLeft] = useState(60);
    const [typedText, setTypedText] = useState('');
    const [step, setStep] = useState<'timer' | 'input'>('timer');

    useEffect(() => {
        if (visible) {
            setTimeLeft(60);
            setTypedText('');
            setStep('timer');
        }
    }, [visible]);

    useEffect(() => {
        if (!visible || step !== 'timer') return;

        if (timeLeft === 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setStep('input');
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [visible, timeLeft, step]);

    const handleConfirm = () => {
        if (typedText === REQUIRED_PHRASE) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onBreakConfirmed();
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const isPhraseCorrect = typedText === REQUIRED_PHRASE;
    const progressPercent = Math.min(100, Math.max(0, (currentLight / goalLight) * 100));

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <BlurView intensity={90} tint="dark" style={styles.container}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.card}>
                        <Pressable style={styles.closeButton} onPress={onClose}>
                            <X size={24} color="#A0A0A0" />
                        </Pressable>

                        <View style={styles.iconContainer}>
                            <AlertTriangle size={40} color="#FF6B6B" />
                        </View>

                        <Text style={styles.title}>Break Protocol Initiated</Text>

                        {step === 'timer' ? (
                            <>
                                <Text style={styles.subtitle}>
                                    Your prefrontal cortex needs a moment. Waiting {timeLeft}s to break your Morning Contract.
                                </Text>

                                <View style={styles.timerContainer}>
                                    <Text style={styles.timerText}>{timeLeft}</Text>
                                    <Text style={styles.timerLabel}>SECONDS REMAINING</Text>
                                </View>

                                {/* Biological Cost / Circadian Anchor Visual */}
                                <View style={styles.progressSection}>
                                    <View style={styles.progressHeader}>
                                        <Text style={styles.progressLabel}>Circadian Anchor Status</Text>
                                        <Text style={styles.progressValue}>{currentLight}m / {goalLight}m Light</Text>
                                    </View>
                                    <View style={styles.progressBarBg}>
                                        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                                    </View>
                                    <Text style={styles.progressCaption}>
                                        You are {Math.round(progressPercent)}% locked in. Aborting now resets your biological momentum.
                                    </Text>
                                </View>

                                <View style={styles.warningBox}>
                                    <Brain size={20} color="#FFD700" />
                                    <Text style={styles.warningText}>
                                        Breaking now causes a dopamine spike that may ruin your focus for the entire morning.
                                    </Text>
                                </View>

                                <Pressable
                                    style={styles.surrenderButton}
                                    onPress={onClose}
                                >
                                    <Text style={styles.surrenderText}>I'll Keep My Contract</Text>
                                </Pressable>
                            </>
                        ) : (
                            <>
                                <Text style={styles.subtitle}>
                                    To confirm this decision, type the following phrase exactly:
                                </Text>

                                <View style={styles.phraseContainer}>
                                    <Text style={styles.phraseText}>"{REQUIRED_PHRASE}"</Text>
                                </View>

                                <TextInput
                                    style={styles.input}
                                    placeholder="Type phrase here..."
                                    placeholderTextColor="#666"
                                    value={typedText}
                                    onChangeText={setTypedText}
                                    autoCorrect={false}
                                    autoCapitalize="none"
                                    multiline
                                />

                                <Pressable
                                    style={[
                                        styles.confirmButton,
                                        !isPhraseCorrect && styles.confirmButtonDisabled
                                    ]}
                                    onPress={handleConfirm}
                                    disabled={!isPhraseCorrect}
                                >
                                    <LinearGradient
                                        colors={isPhraseCorrect ? ['#FF6B6B', '#D32F2F'] : ['#333', '#222']}
                                        style={styles.confirmGradient}
                                    >
                                        <Ban size={20} color={isPhraseCorrect ? '#FFF' : '#666'} />
                                        <Text style={[styles.confirmText, !isPhraseCorrect && styles.confirmTextDisabled]}>
                                            Break & Fail Mission
                                        </Text>
                                    </LinearGradient>
                                </Pressable>

                                <Pressable
                                    style={styles.cancelLink}
                                    onPress={onClose}
                                >
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </Pressable>
                            </>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </BlurView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    keyboardView: {
        width: '100%',
    },
    card: {
        backgroundColor: '#1E293B',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.3)',
        shadowColor: "#FF6B6B",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 8,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.2)',
    },
    title: {
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
        color: '#FFFFFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        color: '#A0A0A0',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    timerText: {
        fontSize: 48,
        fontFamily: 'Outfit_700Bold',
        color: '#FF6B6B',
        fontVariant: ['tabular-nums'],
    },
    timerLabel: {
        fontSize: 12,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FF6B6B',
        letterSpacing: 2,
        opacity: 0.8,
    },
    warningBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.2)',
    },
    warningText: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        color: '#FFD700',
        lineHeight: 20,
    },
    surrenderButton: {
        width: '100%',
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    surrenderText: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFFFFF',
    },
    phraseContainer: {
        backgroundColor: '#0F172A',
        padding: 16,
        borderRadius: 12,
        width: '100%',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    phraseText: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        color: '#FF6B6B',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    input: {
        width: '100%',
        backgroundColor: '#0F172A',
        color: '#FFF',
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#94A3B8',
        minHeight: 100,
        textAlignVertical: 'top',
    },
    confirmButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
    },
    confirmButtonDisabled: {
        opacity: 0.5,
    },
    confirmGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
    },
    confirmText: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFFFFF',
    },
    confirmTextDisabled: {
        color: '#999',
    },
    cancelLink: {
        padding: 8,
    },
    cancelText: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        color: '#64748B',
    },
    progressSection: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 12,
        fontFamily: 'Outfit_600SemiBold',
        color: '#A0A0A0',
    },
    progressValue: {
        fontSize: 12,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFB347',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#FFB347',
    },
    progressCaption: {
        fontSize: 11,
        fontFamily: 'Outfit_400Regular',
        color: '#64748B',
        fontStyle: 'italic',
    },
});
