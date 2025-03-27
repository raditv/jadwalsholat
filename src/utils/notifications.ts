import { PrayerTimes } from '../types';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function schedulePrayerNotifications(
  prayerTimes: PrayerTimes,
  iqamaAdjustments: Record<string, number>
) {
  // Clear any existing notifications
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.getNotifications().then(notifications => {
        notifications.forEach(notification => notification.close());
      });
    });
  }

  const now = new Date();
  const prayers = [
    { name: 'Fajr', time: prayerTimes.fajr },
    { name: 'Dhuhr', time: prayerTimes.dhuhr },
    { name: 'Asr', time: prayerTimes.asr },
    { name: 'Maghrib', time: prayerTimes.maghrib },
    { name: 'Isha', time: prayerTimes.isha },
  ];

  prayers.forEach(prayer => {
    // Schedule adhan notification
    if (prayer.time > now) {
      const adhanTime = new Date(prayer.time.getTime());
      const delay = adhanTime.getTime() - now.getTime();

      if (delay > 0) {
        setTimeout(() => {
          new Notification('Prayer Time', {
            body: `It's time for ${prayer.name} prayer`,
            icon: '/icon-192x192.png',
          });
        }, delay);
      }
    }

    // Schedule iqama notification
    const iqamaDelay = iqamaAdjustments[prayer.name.toLowerCase()] || 0;
    const iqamaTime = new Date(prayer.time.getTime() + iqamaDelay * 60000);
    
    if (iqamaTime > now) {
      const delay = iqamaTime.getTime() - now.getTime();

      if (delay > 0) {
        setTimeout(() => {
          new Notification('Iqama Time', {
            body: `It's time for ${prayer.name} iqama`,
            icon: '/icon-192x192.png',
          });
        }, delay);
      }
    }
  });
}

export function cancelAllNotifications() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.getNotifications().then(notifications => {
        notifications.forEach(notification => notification.close());
      });
    });
  }
} 