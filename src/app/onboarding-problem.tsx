import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { EditorialPager } from '@/components/onboarding/EditorialPager';

const SLIDES = [
  {
    topText: 'Alarm goes off',
    bottomText: 'Time to start the day',
    topColor: '#1A1A2E',
    bottomColor: '#FFF9F0',
    topTextColor: '#FFFFFF',
    bottomTextColor: '#1A1A2E',
  },
  {
    topText: 'Just checking notifications',
    bottomText: 'You tell yourself',
    topColor: '#FF6B35',
    bottomColor: '#1A1A2E',
    topTextColor: '#FFFFFF',
    bottomTextColor: '#FFFFFF',
  },
  {
    topText: '30 minutes later...',
    bottomText: 'Still scrolling',
    topColor: '#1A1A2E',
    bottomColor: '#FFB347',
    topTextColor: '#FFB347',
    bottomTextColor: '#1A1A2E',
  },
  {
    topText: 'Still in bed',
    bottomText: 'Feeling behind before you\'ve started',
    topColor: '#FF6B35',
    bottomColor: '#1A1A2E',
    topTextColor: '#FFFFFF',
    bottomTextColor: 'rgba(255, 255, 255, 0.8)',
  },
];

export default function OnboardingProblemScreen() {
  const router = useRouter();

  const handleComplete = () => {
    router.push('/onboarding-how-it-works');
  };

  return (
    <View style={styles.container}>
      <EditorialPager
        slides={SLIDES}
        onComplete={handleComplete}
        autoAdvanceDelay={2500}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
