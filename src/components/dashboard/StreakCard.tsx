import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame, Check } from 'lucide-react-native';

interface StreakCardProps {
  streak: number;
  completed: boolean;
  isDarkMode?: boolean;
}

export function StreakCard({ streak, completed, isDarkMode = false }: StreakCardProps) {
  const getMessage = () => {
    if (streak === 0) {
      return completed ? 'Day 1 complete!' : 'Complete today to start';
    }
    if (completed) {
      if (streak === 7) return 'One week strong!';
      if (streak === 30) return 'One month champion!';
      if (streak >= 100) return 'Legendary!';
      return 'Streak continues tomorrow';
    }
    return `Complete to keep your ${streak} day streak`;
  };

  return (
    <View style={[styles.card, isDarkMode ? styles.cardDark : styles.cardLight]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, streak > 0 && styles.iconContainerActive]}>
          <Flame
            size={20}
            color={streak > 0 ? '#FF6B35' : isDarkMode ? 'rgba(255,255,255,0.3)' : '#CCC'}
            strokeWidth={2.5}
            fill={streak > 0 ? '#FF6B35' : 'transparent'}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.streakNumber, isDarkMode && styles.textLight]}>
            {streak > 0 ? `${streak} day streak` : 'Start your streak'}
          </Text>
          <Text style={[styles.message, isDarkMode && styles.textSecondaryLight]}>
            {getMessage()}
          </Text>
        </View>

        {completed && (
          <View style={styles.checkBadge}>
            <Check size={14} color="#FFFFFF" strokeWidth={3} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
  },
  textContainer: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
  },
  message: {
    fontSize: 14,
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
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
