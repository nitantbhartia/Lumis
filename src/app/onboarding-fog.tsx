import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, ArrowRight, Info, Brain } from 'lucide-react-native';

const OPTIONS = [
    { id: 'yes', label: 'Yes' },
    { id: 'no', label: 'No' },
    { id: 'most', label: 'Most mornings' },
] as const;

type FogOption = typeof OPTIONS[number]['id'];

export default function OnboardingFogScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [selected, setSelected] = useState<FogOption | null>(null);
    const handleSelect = (id: FogOption) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelected(id);
        // Auto-navigate after selection for smoother flow
        setTimeout(() => {
            handleNext();
        }, 400);
    };

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/onboarding-question-wakeup');
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    return (
        <View style={{ flex: 1 }}>
            <LinearGradient
                colors={['#87CEEB', '#B0E0E6', '#FFEB99', '#FFDAB9']}
                locations={[0, 0.3, 0.7, 1]}
                style={{ flex: 1 }}
            >
                <View
                    style={{
                        flex: 1,
                        paddingTop: insets.top + 16,
                        paddingBottom: insets.bottom + 24,
                        paddingHorizontal: 24,
                    }}
                >
                    {/* Progress Indicator */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: '40%' }]} />
                        </View>
                        <Text style={styles.progressLabel}>BUILDING YOUR CIRCADIAN PROFILE</Text>
                    </View>

                    {/* Back Button */}
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <ArrowLeft size={24} color="#1A1A2E" strokeWidth={2} />
                    </Pressable>

                    {/* Question */}
                    <View style={styles.questionContainer}>
                        <Text style={styles.questionText}>
                            Do you struggle with 'Brain Fog' or a mid-morning energy crash?
                        </Text>
                    </View>

                    {/* Options */}
                    <View style={styles.optionsContainer}>
                        {OPTIONS.map((option, index) => (
                            <Animated.View
                                key={option.id}
                                entering={FadeInDown.delay(index * 80).duration(400)}
                            >
                                <Pressable
                                    onPress={() => handleSelect(option.id)}
                                    style={[
                                        styles.option,
                                        selected === option.id && styles.optionSelected,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.optionText,
                                            selected === option.id && styles.optionTextSelected,
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                </Pressable>
                            </Animated.View>
                        ))}
                    </View>

                    {/* Spacer */}
                    <View style={{ flex: 1 }} />
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    progressContainer: {
        marginBottom: 32,
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#FF8C00',
    },
    progressLabel: {
        fontSize: 10,
        fontFamily: 'Outfit_700Bold',
        color: '#FF8C00',
        letterSpacing: 1,
        textAlign: 'center',
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    questionContainer: {
        marginTop: 40,
        marginBottom: 32,
    },
    questionText: {
        fontSize: 32,
        fontFamily: 'Outfit_700Bold',
        color: '#1A1A2E',
        lineHeight: 42,
    },
    optionsContainer: {
        gap: 12,
    },
    option: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    optionSelected: {
        backgroundColor: '#1A1A2E',
    },
    optionText: {
        fontSize: 16,
        fontFamily: 'Outfit_500Medium',
        color: '#1A1A2E',
    },
    optionTextSelected: {
        color: '#FFFFFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    insightCard: {
        backgroundColor: '#FFF',
        borderRadius: 32,
        padding: 32,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    insightTitle: {
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
        color: '#1A1A2E',
    },
    insightText: {
        fontSize: 18,
        fontFamily: 'Outfit_400Regular',
        color: '#333',
        lineHeight: 28,
        marginBottom: 32,
    },
    nextButtonOuter: {
        width: '100%',
        height: 72,
        borderRadius: 32,
        shadowColor: '#FF8C00',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    ctaPressed: {
        transform: [{ scale: 0.96 }],
    },
    nextButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 32,
        gap: 8,
    },
    nextButtonText: {
        fontSize: 20,
        fontFamily: 'Outfit_700Bold',
        color: '#1A1A2E',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
