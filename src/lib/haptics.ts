import * as Haptics from 'expo-haptics';

export const celebrationSequence = async () => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  await new Promise(r => setTimeout(r, 100));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  await new Promise(r => setTimeout(r, 100));
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

export const milestoneHaptic = async () => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  await new Promise(r => setTimeout(r, 50));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};
