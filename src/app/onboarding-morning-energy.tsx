import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';

const OPTIONS = [
    { id: 'exhausted', label: 'Exhausted - I need hours to feel awake' },
    { id: 'sluggish', label: 'Sluggish - Takes a while to get going' },
    { id: 'okay', label: 'Okay - Functional but not great' },
    { id: 'energized', label: 'Energized - Ready to tackle the day' },
] as const;

type EnergyOption = typeof OPTIONS[number]['id'];

export default function OnboardingMorningEnergyScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [selected, setSelected] = useState<EnergyOption | null>(null);
    const setMorningEnergyLevel = useLumisStore((s) => s.setMorningEnergyLevel);

    const handleSelect = (id: EnergyOption) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelected(id);
        setMorningEnergyLevel(id);
        // Auto-navigate after selection
        setTimeout(() => {
            router.push('/onboarding-profile-complete');
        }, 400);
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
                            <View style={[styles.progressFill, { width: '85%' }]} />
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
                            How do you feel{'\n'}by 10am?
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
});
