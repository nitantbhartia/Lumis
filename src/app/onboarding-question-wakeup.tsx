import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowRight, ChevronUp, ChevronDown } from 'lucide-react-native';
import { useLumisStore } from '@/lib/state/lumis-store';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function OnboardingQuestionWakeupScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [wakeTime, setWakeTime] = useState(new Date(new Date().setHours(7, 0, 0, 0)));
    const setScheduledWakeTime = useLumisStore((s) => s.setScheduledWakeTime);

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Save wake time as "HH:MM" format
        const hours = wakeTime.getHours().toString().padStart(2, '0');
        const mins = wakeTime.getMinutes().toString().padStart(2, '0');
        setScheduledWakeTime(`${hours}:${mins}`);
        router.push('/onboarding-question-sunlight');
    };

    const handleTimeChange = (event: any, selectedDate?: Date) => {
        if (selectedDate) {
            setWakeTime(selectedDate);
            Haptics.selectionAsync();
        }
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
                            <View style={[styles.progressFill, { width: '60%' }]} />
                        </View>
                        <Text style={styles.progressLabel}>BUILDING YOUR CIRCADIAN PROFILE</Text>
                    </View>
                    {/* Question */}
                    <View style={styles.questionContainer}>
                        <Text style={styles.questionText}>
                            What time do you{'\n'}usually wake up?
                        </Text>
                        <Text style={styles.subtitleText}>
                            We'll help you catch the first light.
                        </Text>
                    </View>

                    {/* Time Picker Container */}
                    <Animated.View
                        entering={FadeInDown.delay(200).duration(500)}
                        style={styles.pickerContainer}
                    >
                        <View style={styles.timeDisplay}>
                            <DateTimePicker
                                testID="dateTimePicker"
                                value={wakeTime}
                                mode="time"
                                is24Hour={false}
                                display="spinner"
                                onChange={handleTimeChange}
                                textColor="#1A1A2E"
                                themeVariant="light"
                                style={styles.picker}
                            />
                        </View>
                    </Animated.View>

                    <View style={{ flex: 1 }} />

                    {/* Next Button */}
                    <Pressable
                        onPress={handleNext}
                        style={styles.nextButtonContainer}
                    >
                        <LinearGradient
                            colors={['#FFB347', '#FF8C00']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.nextButton}
                        >
                            <Text style={styles.nextButtonText}>Next</Text>
                            <ArrowRight size={20} color="#1A1A2E" strokeWidth={2} />
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
    questionContainer: {
        marginTop: 40,
        marginBottom: 32,
    },
    questionText: {
        fontSize: 32,
        fontFamily: 'Outfit_700Bold',
        color: '#1A1A2E',
        lineHeight: 42,
        marginBottom: 8,
    },
    subtitleText: {
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        color: '#1A1A2E',
        opacity: 0.6,
    },
    pickerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 24,
        padding: 24,
    },
    timeDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 200,
        width: '100%',
        overflow: 'hidden',
    },
    picker: {
        height: 200,
        width: Platform.OS === 'ios' ? '100%' : 150,
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
