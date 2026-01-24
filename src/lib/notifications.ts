import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPreferences {
  enabled: boolean;
  morningReminder: boolean;
  morningReminderTime: string; // HH:MM format
  streakReminder: boolean;
  streakReminderTime: string; // HH:MM format
  goalCompleteNotification: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:MM format
  quietHoursEnd: string; // HH:MM format
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  enabled: true,
  morningReminder: true,
  morningReminderTime: '08:00',
  streakReminder: true,
  streakReminderTime: '20:00',
  goalCompleteNotification: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

class NotificationService {
  private permissionGranted = false;

  async getPermissionStatus(): Promise<boolean> {
    if (!Device.isDevice) return false;
    const { status } = await Notifications.getPermissionsAsync();
    this.permissionGranted = status === 'granted';
    return this.permissionGranted;
  }

  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    this.permissionGranted = finalStatus === 'granted';

    if (!this.permissionGranted) {
      console.log('Failed to get push notification permissions');
    }

    return this.permissionGranted;
  }

  async scheduleMorningReminder(time: string): Promise<string | null> {
    if (!this.permissionGranted) {
      await this.requestPermissions();
    }

    if (!this.permissionGranted) return null;

    // Cancel existing morning reminder
    await this.cancelNotification('morning-reminder');

    const [hour, minute] = time.split(':').map(Number);

    try {
      const id = await Notifications.scheduleNotificationAsync({
        identifier: 'morning-reminder',
        content: {
          title: '☀️ Good Morning!',
          body: 'Time to earn your screen time! Step outside and soak up some sunlight.',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { type: 'morning-reminder' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour,
          minute,
          repeats: true,
        },
      });

      return id;
    } catch (error) {
      console.error('Error scheduling morning reminder:', error);
      return null;
    }
  }

  async scheduleStreakReminder(time: string): Promise<string | null> {
    if (!this.permissionGranted) {
      await this.requestPermissions();
    }

    if (!this.permissionGranted) return null;

    // Cancel existing streak reminder
    await this.cancelNotification('streak-reminder');

    const [hour, minute] = time.split(':').map(Number);

    try {
      const id = await Notifications.scheduleNotificationAsync({
        identifier: 'streak-reminder',
        content: {
          title: '🔥 Don\'t Break Your Streak!',
          body: 'You haven\'t completed your light goal today. Go outside to keep your streak alive!',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { type: 'streak-reminder' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour,
          minute,
          repeats: true,
        },
      });

      return id;
    } catch (error) {
      console.error('Error scheduling streak reminder:', error);
      return null;
    }
  }

  async sendGoalCompleteNotification(): Promise<void> {
    if (!this.permissionGranted) {
      await this.requestPermissions();
    }

    if (!this.permissionGranted) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Goal Complete!',
          body: 'You\'ve earned your screen time! All your blocked apps are now unlocked.',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: { type: 'goal-complete' },
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending goal complete notification:', error);
    }
  }

  async sendStreakMilestoneNotification(days: number): Promise<void> {
    if (!this.permissionGranted) {
      await this.requestPermissions();
    }

    if (!this.permissionGranted) return;

    const milestones = [7, 30, 50, 100, 365];
    if (!milestones.includes(days)) return;

    const emoji = days >= 100 ? '🏆' : days >= 30 ? '💎' : '🔥';

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${emoji} ${days}-Day Streak!`,
          body: `Amazing! You've maintained your streak for ${days} days. Keep it going!`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: { type: 'streak-milestone', days },
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending streak milestone notification:', error);
    }
  }

  async sendAchievementUnlocked(title: string, description: string): Promise<void> {
    if (!this.permissionGranted) {
      await this.requestPermissions();
    }

    if (!this.permissionGranted) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🏅 Achievement Unlocked!`,
          body: `${title}: ${description}`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { type: 'achievement', title },
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending achievement notification:', error);
    }
  }

  async cancelNotification(identifier: string): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const notification = scheduled.find((n) => n.identifier === identifier);

    if (notification) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  // Progress notification for active tracking sessions
  async updateProgressNotification(params: {
    remainingMinutes: number;
    creditRate: number;
    luxLevel: number;
  }): Promise<void> {
    if (!this.permissionGranted) {
      await this.requestPermissions();
    }

    if (!this.permissionGranted) return;

    // Cancel existing progress notification first
    await this.dismissProgressNotification();

    const { remainingMinutes, creditRate, luxLevel } = params;
    const isIndoors = creditRate < 1;

    const body = isIndoors
      ? `${remainingMinutes} min remaining • ${luxLevel.toLocaleString()} lux • Indoor 0.5x`
      : `${remainingMinutes} min remaining • ${luxLevel.toLocaleString()} lux`;

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: 'tracking-progress',
        content: {
          title: isIndoors ? '⚠️ Lumis Active' : '☀️ Lumis Active',
          body,
          sound: false, // Silent update
          priority: Notifications.AndroidNotificationPriority.LOW,
          sticky: Platform.OS === 'android', // Keep notification persistent on Android
          data: { type: 'tracking-progress' },
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error updating progress notification:', error);
    }
  }

  async dismissProgressNotification(): Promise<void> {
    try {
      await Notifications.dismissNotificationAsync('tracking-progress');
    } catch {
      // Notification may not exist, ignore
    }
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getAllScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  isInQuietHours(prefs: NotificationPreferences): boolean {
    if (!prefs.quietHoursEnabled) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = prefs.quietHoursStart.split(':').map(Number);
    const [endHour, endMinute] = prefs.quietHoursEnd.split(':').map(Number);

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    }

    return currentTime >= startTime && currentTime < endTime;
  }

  async setupNotifications(prefs: NotificationPreferences): Promise<void> {
    if (!prefs.enabled) {
      await this.cancelAllNotifications();
      return;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    // Cancel all existing notifications
    await this.cancelAllNotifications();

    // Schedule morning reminder
    if (prefs.morningReminder) {
      await this.scheduleMorningReminder(prefs.morningReminderTime);
    }

    // Schedule streak reminder
    if (prefs.streakReminder) {
      await this.scheduleStreakReminder(prefs.streakReminderTime);
    }
  }
}

export const notificationService = new NotificationService();
