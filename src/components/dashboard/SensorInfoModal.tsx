import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Sun, Home, Footprints } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SensorInfoModalProps {
  visible: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

const INFO_ITEMS = [
  {
    icon: Sun,
    title: 'Light Sensor',
    description: 'We measure light intensity in lux using your phone\'s ambient light sensor',
  },
  {
    icon: Sun,
    title: 'Outdoor Sunlight',
    description: '1,500+ lux typically indicates you\'re outside in natural daylight',
  },
  {
    icon: Home,
    title: 'Indoor Light',
    description: 'Near windows indoors usually reads 100-500 lux (no credit earned)',
  },
  {
    icon: Footprints,
    title: 'Motion Detection',
    description: 'We detect movement to know if your phone is in your pocket',
  },
];

export function SensorInfoModal({ visible, onClose, isDarkMode = false }: SensorInfoModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalBody}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.modalTitle}>How Light Detection Works</Text>
                  <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
                    <X size={24} color="#999" />
                  </Pressable>
                </View>

                {/* Info Items */}
                <View style={styles.itemsContainer}>
                  {INFO_ITEMS.map((item, index) => (
                    <View key={index} style={styles.infoItem}>
                      <View style={styles.iconContainer}>
                        <item.icon size={20} color="#FF6B35" />
                      </View>
                      <View style={styles.textContainer}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <Text style={styles.itemDescription}>{item.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Dismiss Button */}
                <Pressable onPress={onClose} style={styles.dismissButton}>
                  <Text style={styles.dismissText}>Got it</Text>
                </Pressable>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
  },
  modalBody: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#1A1A2E',
  },
  closeButton: {
    padding: 4,
  },
  itemsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1A2E',
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    lineHeight: 20,
  },
  dismissButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
});
