import React from 'react';
import { View, Text, StyleSheet, Pressable, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Share2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface CompletionActionsProps {
  onViewActivity: () => void;
  lightMinutes: number;
  currentStreak: number;
}

export function CompletionActions({
  onViewActivity,
  lightMinutes,
  currentStreak,
}: CompletionActionsProps) {
  const buttonScale = useSharedValue(1);

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await Share.share({
        message: `🌅 Just completed ${Math.round(lightMinutes)} minutes of morning light exposure! ${
          currentStreak > 0 ? `${currentStreak} day streak 🔥` : ''
        }\n\nOptimizing my circadian rhythm with Lumis ☀️`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleViewActivity = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onViewActivity();
  };

  return (
    <View style={styles.container}>
      {/* Main CTA - View Activity Details */}
      <Pressable
        onPress={handleViewActivity}
        onPressIn={() => {
          buttonScale.value = withSpring(0.96);
        }}
        onPressOut={() => {
          buttonScale.value = withSpring(1);
        }}
        style={styles.mainButton}
      >
        <Animated.View
          style={[
            {
              width: '100%',
              transform: [{ scale: buttonScale.value }],
            },
          ]}
        >
          <LinearGradient
            colors={['#FFB347', '#FF8C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.mainButtonText}>View Activity Details</Text>
            <ArrowRight size={20} color="#1A1A2E" strokeWidth={3} />
          </LinearGradient>
        </Animated.View>
      </Pressable>

      {/* Secondary Action - Share */}
      <Pressable onPress={handleShare} style={styles.shareButton}>
        <Share2 size={16} color="#FF8C00" strokeWidth={2} />
        <Text style={styles.shareButtonText}>Share Achievement</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
  },
  mainButton: {
    width: '100%',
    height: 64,
    borderRadius: 24,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  gradientButton: {
    flex: 1,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
    height: 64,
  },
  mainButtonText: {
    fontSize: 17,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.2)',
    gap: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FF8C00',
  },
});
