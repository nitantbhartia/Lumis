import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { DollarSign, Heart } from 'lucide-react-native';
import { CHARITIES } from './CharitySelector';

export interface Penalty {
  date: string; // ISO date
  amount: number;
  charity: string;
}

interface PenaltyHistoryListProps {
  penalties: Penalty[];
}

export function PenaltyHistoryList({ penalties }: PenaltyHistoryListProps) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthPenalties = penalties.filter(p =>
    p.date.startsWith(currentMonth)
  );
  const totalThisMonth = thisMonthPenalties.reduce((sum, p) => sum + p.amount, 0);

  if (penalties.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🎯</Text>
        <Text style={styles.emptyTitle}>No penalties yet</Text>
        <Text style={styles.emptySubtitle}>
          Keep your streak alive to avoid $1 charges
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Monthly Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Heart size={20} color="#FF6B35" strokeWidth={2} />
          <Text style={styles.summaryTitle}>This Month</Text>
        </View>
        <Text style={styles.summaryAmount}>${totalThisMonth.toFixed(2)}</Text>
        <Text style={styles.summarySubtitle}>
          {thisMonthPenalties.length} {thisMonthPenalties.length === 1 ? 'penalty' : 'penalties'} donated
        </Text>
      </View>

      {/* Transaction List */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>History</Text>
        <FlatList
          data={penalties}
          keyExtractor={(item, index) => `${item.date}-${index}`}
          renderItem={({ item }) => {
            const charity = CHARITIES.find(c => c.id === item.charity);
            const date = new Date(item.date);
            const formattedDate = date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.charityEmoji}>{charity?.emoji || '❤️'}</Text>
                  <View style={styles.rowText}>
                    <Text style={styles.charityName}>
                      {charity?.name || 'Unknown Charity'}
                    </Text>
                    <Text style={styles.date}>{formattedDate}</Text>
                  </View>
                </View>
                <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          scrollEnabled={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1F36', // Deep Night
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#4A5568', // Secondary text
    textAlign: 'center',
    lineHeight: 24,
  },
  // Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1F36',
  },
  summaryAmount: {
    fontSize: 48,
    fontFamily: 'Outfit_700Bold',
    color: '#FF6B35', // Dawn Orange
    letterSpacing: -2,
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#4A5568',
  },
  // List
  listContainer: {
    gap: 16,
  },
  listTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1F36',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  charityEmoji: {
    fontSize: 24,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  charityName: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#1A1F36',
  },
  date: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#A0AEC0', // Tertiary text
  },
  amount: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#E74C3C', // Alert Red
  },
  separator: {
    height: 1,
    backgroundColor: '#E1E8ED',
  },
});
