import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { DollarSign, ChevronRight } from 'lucide-react-native';
import { CHARITIES, CharityId } from '@/components/CharitySelector';

const getCharityInfo = (charityId: string | null) => {
  if (!charityId) return { name: 'charity', emoji: '' };
  const charity = CHARITIES.find(c => c.id === charityId);
  return charity ? { name: charity.name, emoji: charity.emoji } : { name: charityId, emoji: '' };
};

interface StakesCardProps {
  charity: CharityId | string | null;
  penaltyAmount: number;
  onChangeCharity?: () => void;
  isDarkMode?: boolean;
}

export function StakesCard({
  charity,
  penaltyAmount = 1,
  onChangeCharity,
  isDarkMode = false,
}: StakesCardProps) {
  const charityInfo = getCharityInfo(charity);

  return (
    <View style={[styles.card, isDarkMode ? styles.cardDark : styles.cardLight]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <DollarSign size={20} color="#FF6B35" strokeWidth={2.5} />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.label, isDarkMode && styles.textSecondaryLight]}>
            Skip = ${penaltyAmount} to
          </Text>
          <View style={styles.charityRow}>
            {charityInfo.emoji ? (
              <Text style={styles.charityEmoji}>{charityInfo.emoji}</Text>
            ) : null}
            <Text style={[styles.charityName, isDarkMode && styles.textLight]}>
              {charityInfo.name}
            </Text>
          </View>
          <Text style={[styles.subtitle, isDarkMode && styles.textSecondaryLight]}>
            Your commitment keeps you accountable
          </Text>
        </View>
      </View>

      {onChangeCharity && (
        <Pressable onPress={onChangeCharity} style={styles.changeButton}>
          <Text style={styles.changeText}>Change charity</Text>
          <ChevronRight size={14} color="rgba(255, 107, 53, 0.8)" />
        </Pressable>
      )}
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
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  cardDark: {
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.25)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#666',
  },
  charityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  charityEmoji: {
    fontSize: 18,
  },
  charityName: {
    fontSize: 17,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    marginTop: 4,
  },
  textLight: {
    color: '#FFFFFF',
  },
  textSecondaryLight: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 107, 53, 0.15)',
  },
  changeText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: 'rgba(255, 107, 53, 0.8)',
    marginRight: 4,
  },
});
