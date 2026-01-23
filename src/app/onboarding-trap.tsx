import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';

const OPTIONS = [
    { id: 'immediately', label: 'Immediately (within 5 mins)' },
    { id: 'in_bed', label: "While I'm still in bed" },
    { id: 'coffee', label: 'After my first coffee' },
    { id: 'out_door', label: "Once I'm out the door" },
] as const;

type TrapOption = typeof OPTIONS[number]['id'];

export default function OnboardingTrapScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [selected, setSelected] = useState<TrapOption | null>(null);

    const handleSelect = (id: TrapOption) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelected(id);
        // Auto-navigate after selection for smoother flow
        setTimeout(() => {
            handleNext();
        }, 400);
    };

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/onboarding-fog');
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
                            <View style={[styles.progressFill, { width: '20%' }]} />
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
                            How soon do you reach for your phone after waking up?
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

                    {/* Next Button */}
                    <Pressable
                        onPress={handleNext}
                        disabled={!selected}
                        style={({ pressed }) => [
                            styles.nextButtonOuter,
                            pressed && styles.ctaPressed,
                            !selected && { opacity: 0.5 }
                        ]}
                    >
                        <LinearGradient
                            colors={selected ? ['#FFB347', '#FF8C00'] : ['#D0D0D0', '#C0C0C0']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.nextButton}
                        >
                            <Text style={styles.nextButtonText}>Next</Text>
                            <ArrowRight size={22} color={selected ? '#1A1A2E' : '#888'} strokeWidth={3} />
                        </LinearGradient>
                    </Pressable>
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
    nextButtonOuter: {
        width: '100%',
        height: 80,
        borderRadius: 32,
        shadowColor: '#FF8C00',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 12,
    },
    ctaPressed: {
        transform: [{ scale: 0.95 }],
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
        fontSize: 22,
        fontFamily: 'Outfit_800ExtraBold',
        color: '#1A1A2E',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
});
