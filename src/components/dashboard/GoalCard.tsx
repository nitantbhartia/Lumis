import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Sun, Check, Info } from 'lucide-react-native';
import { SensorInfoModal } from './SensorInfoModal';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface GoalCardProps {
  completed: boolean;
  goalMinutes: number;
  currentMinutes: number;
  isDarkMode?: boolean;
}

export function GoalCard({
  completed,
  goalMinutes,
  currentMinutes,
  isDarkMode = false,
}: GoalCardProps) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const progress = Math.min(currentMinutes / goalMinutes, 1);
  const hasStarted = currentMinutes > 0;

  // Breathing animation for the sun icon
  const sunScale = useSharedValue(1);
  const sunOpacity = useSharedValue(0.8);

  useEffect(() => {
    if (!completed) {
      sunScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      sunOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0.8, { duration: 1500 })
        ),
        -1,
        true
      );
    }
  }, [completed]);

  const sunStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sunScale.value }],
    opacity: sunOpacity.value,
  }));

  const remainingMinutes = Math.max(0, goalMinutes - currentMinutes);
  const remainingSeconds = Math.round((remainingMinutes % 1) * 60);
  const wholeMinutes = Math.floor(remainingMinutes);

  if (completed) {
    return (
      <View style={[styles.card, isDarkMode ? styles.cardDark : styles.cardLight]}>
        <View style={styles.completedContent}>
          <View style={styles.completedIcon}>
            <Check size={32} color="#FFFFFF" strokeWidth={3} />
          </View>
          <Text style={[styles.completedTitle, isDarkMode && styles.textLight]}>
            Apps unlocked!
          </Text>
          <Text style={[styles.completedSubtitle, isDarkMode && styles.textSecondaryLight]}>
            Great job getting your morning light
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, isDarkMode ? styles.cardDark : styles.cardLight]}>
      <View style={styles.header}>
        <Animated.View style={[styles.iconContainer, sunStyle]}>
          <Sun size={28} color="#FF6B35" strokeWidth={2.5} />
        </Animated.View>
        <View style={styles.headerText}>
          <Text style={[styles.goalNumber, isDarkMode && styles.textLight]}>
            {goalMinutes} min
          </Text>
          <Text style={[styles.goalLabel, isDarkMode && styles.textSecondaryLight]}>
            of morning light to unlock
          </Text>
        </View>
      </View>

      {hasStarted && (
        <View style={styles.progressSection}>
          <View style={[styles.progressBar, isDarkMode && styles.progressBarDark]}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={[styles.remainingText, isDarkMode && styles.textSecondaryLight]}>
            {wholeMinutes > 0 ? `${wholeMinutes}m ` : ''}
            {remainingSeconds}s remaining
          </Text>
        </View>
      )}

      {!hasStarted && (
        <View style={styles.hintRow}>
          <Text style={[styles.hint, isDarkMode && styles.textSecondaryLight]}>
            We'll detect natural light using your phone's sensors
          </Text>
          <Pressable
            onPress={() => setShowInfoModal(true)}
            hitSlop={8}
            style={styles.infoButton}
          >
            <Info size={16} color={isDarkMode ? 'rgba(255,255,255,0.4)' : '#999'} />
          </Pressable>
        </View>
      )}

      <SensorInfoModal
        visible={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        isDarkMode={isDarkMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  goalNumber: {
    fontSize: 32,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#1A1A2E',
    letterSpacing: -1,
  },
  goalLabel: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    marginTop: 2,
  },
  textLight: {
    color: '#FFFFFF',
  },
  textSecondaryLight: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  progressSection: {
    marginTop: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 4,
  },
  remainingText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  hint: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#999',
    lineHeight: 20,
  },
  infoButton: {
    padding: 4,
  },
  completedContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  completedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  completedTitle: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  completedSubtitle: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
  },
});
