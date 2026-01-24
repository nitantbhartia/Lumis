import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';
import { LumisHeroButton } from '@/components/ui/LumisHeroButton';

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
    const [isNavigating, setIsNavigating] = useState(false);
    const setSunlightFrequency = useLumisStore((s) => s.setSunlightFrequency);

    const handleSelect = (id: SunlightFrequency) => {
        if (isNavigating) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelected(id);
        setSunlightFrequency(id);
        // Auto-navigate after selection for smoother flow
        setTimeout(() => {
            handleNext();
        }, 400);
    };

    const handleNext = () => {
        if (isNavigating) return;
        setIsNavigating(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/onboarding-screen-before-bed');
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
                            <View style={[styles.progressFill, { width: '80%' }]} />
                        </View>
                        <Text style={styles.progressLabel}>BUILDING YOUR CIRCADIAN PROFILE</Text>
                    </View>

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
                    <View style={styles.nextButtonContainer}>
                        <LumisHeroButton
                            title="Next"
                            onPress={handleNext}
                            disabled={!selected}
                            icon={null}
                        />
                    </View>
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
    nextButtonContainer: {
        width: '100%',
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 22,
        borderRadius: 20,
        gap: 8,
        shadowColor: '#FF8C00',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    nextButtonText: {
        fontSize: 20,
        fontFamily: 'Outfit_700Bold',
        color: '#1A1A2E',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
