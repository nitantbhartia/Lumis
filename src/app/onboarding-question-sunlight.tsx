import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';

const OPTIONS = [
    { id: 'daily', label: 'Daily' },
    { id: 'few_times', label: 'A few times a week' },
    { id: 'once_a_week', label: 'Once a week' },
    { id: 'rarely', label: 'Rarely' },
] as const;

type SunlightFrequency = typeof OPTIONS[number]['id'];

export default function OnboardingQuestionSunlightScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [selected, setSelected] = useState<SunlightFrequency | null>(null);
    const setSunlightFrequency = useLumisStore((s) => s.setSunlightFrequency);

    const handleSelect = (id: SunlightFrequency) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelected(id);
    };

    const handleNext = () => {
        if (!selected) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSunlightFrequency(selected);
        router.push('/onboarding-question-wakeup');
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

                    {/* Question */}
                    <View style={styles.questionContainer}>
                        <Text style={styles.questionText}>
                            How often are you{'\n'}in sunlight?
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
                        style={styles.nextButtonContainer}
                    >
                        <LinearGradient
                            colors={selected ? ['#FFB347', '#FF8C00'] : ['#D0D0D0', '#C0C0C0']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.nextButton}
                        >
                            <Text
                                style={[
                                    styles.nextButtonText,
                                    !selected && { color: '#888' },
                                ]}
                            >
                                Next
                            </Text>
                            <ArrowRight size={20} color={selected ? '#1A1A2E' : '#888'} strokeWidth={2} />
                        </LinearGradient>
                    </Pressable>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
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
    nextButtonContainer: {
        width: '100%',
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 30,
        gap: 8,
    },
    nextButtonText: {
        fontSize: 18,
        fontFamily: 'Outfit_600SemiBold',
        color: '#1A1A2E',
    },
});
