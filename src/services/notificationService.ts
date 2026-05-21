import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    if (!Constants.isDevice) return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('study-reminders', {
        name: 'Study Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6C63FF',
      });
    }

    return true;
  },

  async scheduleDailyStudyReminder(hour: number = 9, minute: number = 0): Promise<string | null> {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧠 Time to Study!',
          body: 'Your daily study session is waiting. Keep that streak alive! 🔥',
          data: { type: 'study_reminder' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
      return id;
    } catch {
      return null;
    }
  },

  async scheduleStreakReminder(): Promise<string | null> {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔥 Keep Your Streak Alive!',
          body: "You haven't studied today. Don't break your streak!",
          data: { type: 'streak_reminder' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: (() => {
            const d = new Date();
            d.setHours(20, 0, 0, 0);
            if (d < new Date()) d.setDate(d.getDate() + 1);
            return d;
          })(),
        },
      });
      return id;
    } catch {
      return null;
    }
  },

  async scheduleQuizReminder(quizTitle: string): Promise<string | null> {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎯 Quiz Reminder',
          body: `You have an unfinished quiz: "${quizTitle}". Complete it to earn XP!`,
          data: { type: 'quiz_reminder' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 3600, // 1 hour
          repeats: false,
        },
      });
      return id;
    } catch {
      return null;
    }
  },

  async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  async cancelById(id: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(id);
  },
};
