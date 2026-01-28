import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Heart } from 'lucide-react-native';

export const CHARITIES = [
  {
    id: 'red-cross',
    name: 'American Red Cross',
    description: 'Disaster relief & emergency assistance',
    emoji: '🏥'
  },
  {
    id: 'doctors-without-borders',
    name: 'Doctors Without Borders',
    description: 'Medical humanitarian aid worldwide',
    emoji: '⚕️'
  },
  {
    id: 'world-wildlife',
    name: 'World Wildlife Fund',
    description: 'Wildlife conservation & environmental protection',
    emoji: '🐼'
  },
  {
    id: 'feeding-america',
    name: 'Feeding America',
    description: 'Fighting hunger across the US',
    emoji: '🍽️'
  },
  {
    id: 'team-trees',
    name: 'Team Trees',
    description: 'Global reforestation efforts',
    emoji: '🌳'
  },
] as const;

export type CharityId = typeof CHARITIES[number]['id'];

interface CharitySelectorProps {
  selected: CharityId | null;
  onSelect: (charityId: CharityId) => void;
}

export function CharitySelector({ selected, onSelect }: CharitySelectorProps) {
  return (
    <View style={styles.container}>
      {CHARITIES.map((charity) => {
        const isSelected = selected === charity.id;

        return (
          <Pressable
            key={charity.id}
            onPress={() => onSelect(charity.id as CharityId)}
            style={({ pressed }) => [
              styles.card,
              isSelected && styles.cardSelected,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.cardContent}>
              <View style={styles.header}>
                <Text style={styles.emoji}>{charity.emoji}</Text>
                <View style={styles.textContainer}>
                  <Text style={[styles.name, isSelected && styles.nameSelected]}>
                    {charity.name}
                  </Text>
                  <Text style={styles.description}>{charity.description}</Text>
                </View>
              </View>

              {/* Selection indicator */}
              <View style={[
                styles.radioCircle,
                isSelected && styles.radioCircleSelected
              ]}>
                {isSelected && <View style={styles.radioInner} />}
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  card: {
    backgroundColor: '#F7F9FC', // Light gray background (flat card)
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  cardSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FF6B35', // Dawn Orange
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  emoji: {
    fontSize: 32,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1F36', // Deep Night
    letterSpacing: 0,
  },
  nameSelected: {
    color: '#FF6B35', // Dawn Orange
  },
  description: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#4A5568', // Secondary text
    lineHeight: 20,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E1E8ED', // Medium gray
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioCircleSelected: {
    borderColor: '#FF6B35', // Dawn Orange
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B35', // Dawn Orange
  },
});
