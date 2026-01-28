import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useLumisStore } from '@/lib/state/lumis-store';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AnimatedTimeDisplay } from '@/components/onboarding/AnimatedTimeDisplay';

export default function OnboardingQuestionWakeupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [wakeTime, setWakeTime] = useState(
    new Date(new Date().setHours(7, 0, 0, 0))
  );
  const setScheduledWakeTime = useLumisStore((s) => s.setScheduledWakeTime);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const hours = wakeTime.getHours().toString().padStart(2, '0');
    const mins = wakeTime.getMinutes().toString().padStart(2, '0');
    setScheduledWakeTime(`${hours}:${mins}`);
    router.push('/onboarding-stakes-choice');
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setWakeTime(selectedDate);
      Haptics.selectionAsync();
    }
  };

  // Extract time components for display
  const hours12 = wakeTime.getHours() % 12 || 12;
  const minutes = wakeTime.getMinutes();
  const period = wakeTime.getHours() >= 12 ? 'PM' : 'AM';

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {/* Question */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.questionContainer}>
          <Text style={styles.questionText}>
            What time do you{'\n'}usually wake up?
          </Text>
        </Animated.View>

        {/* Large Time Display */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.timeDisplayContainer}>
          <AnimatedTimeDisplay hours={hours12} minutes={minutes} period={period} />
        </Animated.View>

        {/* Picker */}
        <Animated.View entering={FadeIn.delay(300)} style={styles.pickerWrapper}>
          <DateTimePicker
            testID="dateTimePicker"
            value={wakeTime}
            mode="time"
            is24Hour={false}
            display="spinner"
            onChange={handleTimeChange}
            textColor="#FFFFFF"
            themeVariant="dark"
            style={styles.picker}
          />
        </Animated.View>

        <View style={styles.spacer} />

        {/* Continue Button */}
        <Animated.View entering={FadeIn.delay(400)}>
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  questionContainer: {
    marginBottom: 48,
  },
  questionText: {
    fontSize: 32,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    lineHeight: 40,
    textAlign: 'center',
  },
  timeDisplayContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  pickerWrapper: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  picker: {
    height: 180,
    width: Platform.OS === 'ios' ? 300 : 150,
  },
  spacer: {
    flex: 1,
  },
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 0,
    paddingVertical: 20,
    marginHorizontal: -24,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: '#E85D04',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
