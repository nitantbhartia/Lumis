import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Trophy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Achievement } from '@/lib/achievements';

interface AchievementsUnlockedTodayProps {
  achievements: Achievement[];
}

export function AchievementsUnlockedToday({ achievements }: AchievementsUnlockedTodayProps) {
  const router = useRouter();

  if (achievements.length === 0) {
    return null;
  }

  const displayAchievements = achievements.slice(0, 2); // Show max 2

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/achievements');
  };

  return (
    <Animated.View entering={FadeInDown.delay(400)} style={styles.container}>
      <Pressable onPress={handlePress}>
        <View style={styles.header}>
          <Trophy size={20} color="#FFB347" />
          <Text style={styles.title}>🎉 Achievements Unlocked</Text>
        </View>

        <View style={styles.divider} />

        {displayAchievements.map((achievement, index) => (
          <View key={achievement.id} style={styles.achievementRow}>
            <Text style={styles.achievementIcon}>{achievement.icon}</Text>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              <Text style={styles.achievementDescription}>{achievement.description}</Text>
            </View>
          </View>
        ))}

        {achievements.length > 2 && (
          <Text style={styles.moreText}>
            +{achievements.length - 2} more{' '}
            {achievements.length - 2 === 1 ? 'achievement' : 'achievements'}
          </Text>
        )}

        <View style={styles.footer}>
          <Text style={styles.viewAllText}>Tap to view all achievements →</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 243, 224, 0.9)',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 71, 0.3)',
    shadowColor: '#FFB347',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    color: '#FF8C00',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 140, 0, 0.15)',
    marginVertical: 8,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  achievementIcon: {
    fontSize: 32,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1A2E',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#64748B',
  },
  moreText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#FF8C00',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 140, 0, 0.15)',
  },
  viewAllText: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    color: '#FF8C00',
    textAlign: 'center',
  },
});
