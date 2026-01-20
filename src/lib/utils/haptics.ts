import * as Haptics from 'expo-haptics';

/**
 * Celebration haptic sequence for goal completion
 */
export const celebrationSequence = async () => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  await new Promise((r) => setTimeout(r, 100));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  await new Promise((r) => setTimeout(r, 100));
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

/**
 * Milestone haptic sequence (25%, 50%, 75% progress)
 */
export const milestoneSequence = async () => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  await new Promise((r) => setTimeout(r, 50));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/**
 * Error haptic feedback
 */
export const errorFeedback = async () => {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};

/**
 * Success haptic feedback
 */
export const successFeedback = async () => {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

/**
 * Warning haptic feedback
 */
export const warningFeedback = async () => {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};
