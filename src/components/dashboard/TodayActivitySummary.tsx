import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Sun, Sunrise, Coffee, Footprints } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ActivitySession } from '@/lib/state/lumis-store';

interface TodayActivitySummaryProps {
  sessions: ActivitySession[];
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'walk':
      return Footprints;
    case 'run':
      return Footprints;
    case 'meditate':
      return Sunrise;
    case 'sit_soak':
      return Coffee;
    default:
      return Sun;
  }
};

const getActivityLabel = (type: string) => {
  switch (type) {
    case 'walk':
      return 'Morning Walk';
    case 'run':
      return 'Morning Run';
    case 'meditate':
      return 'Meditation';
    case 'sit_soak':
      return 'Light Soak';
    default:
      return 'Light Session';
  }
};

export function TodayActivitySummary({ sessions }: TodayActivitySummaryProps) {
  const router = useRouter();

  if (sessions.length === 0) {
    return null;
  }

  const totalMinutes = sessions.reduce((sum, s) => sum + s.lightMinutes, 0);
  const displaySessions = sessions.slice(0, 3); // Show max 3

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/activity-summary');
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Light Sessions</Text>
        <Text style={styles.sessionCount}>{sessions.length}</Text>
      </View>

      <View style={styles.divider} />

      {displaySessions.map((session, index) => {
        const Icon = getActivityIcon(session.type);
        const time = new Date(session.startTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });

        return (
          <View key={session.id} style={styles.sessionRow}>
            <View style={styles.iconContainer}>
              <Icon size={18} color="#FF8C00" />
            </View>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionName}>{getActivityLabel(session.type)}</Text>
              <Text style={styles.sessionDetails}>
                {Math.round(session.lightMinutes)} mins · {session.lux.toLocaleString()} lux
              </Text>
            </View>
            <Text style={styles.sessionTime}>{time}</Text>
          </View>
        );
      })}

      {sessions.length > 3 && (
        <Text style={styles.moreText}>
          +{sessions.length - 3} more {sessions.length - 3 === 1 ? 'session' : 'sessions'}
        </Text>
      )}

      <View style={styles.divider} />

      <View style={styles.footer}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>
          {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} ·{' '}
          {Math.round(totalMinutes)} minutes
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1A2E',
  },
  sessionCount: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    color: '#FF8C00',
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginVertical: 8,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#1A1A2E',
    marginBottom: 2,
  },
  sessionDetails: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#64748B',
  },
  sessionTime: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#64748B',
  },
  moreText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#FF8C00',
    textAlign: 'center',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1A2E',
  },
  totalValue: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    color: '#64748B',
  },
});
