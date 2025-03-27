import { CalculationMethod, Coordinates, AsrCalculation, TimeAdjustments } from '../types';
import { CalculationMethod as AdhanMethod, Coordinates as AdhanCoordinates, PrayerTimes as AdhanPrayerTimes, Madhab } from 'adhan';

export function getCalculationMethod(method: CalculationMethod): any {
  switch (method) {
    case 'MuslimWorldLeague':
      return AdhanMethod.MuslimWorldLeague();
    case 'Egyptian':
      return AdhanMethod.Egyptian();
    case 'Karachi':
      return AdhanMethod.Karachi();
    case 'UmmAlQura':
      return AdhanMethod.UmmAlQura();
    case 'Dubai':
      return AdhanMethod.Dubai();
    case 'MoonsightingCommittee':
      return AdhanMethod.MoonsightingCommittee();
    case 'NorthAmerica':
      return AdhanMethod.NorthAmerica();
    case 'Kuwait':
      return AdhanMethod.Kuwait();
    case 'Qatar':
      return AdhanMethod.Qatar();
    case 'Singapore':
      return AdhanMethod.Singapore();
    case 'KemenagRI':
      // Kemenag RI menggunakan parameter khusus
      const params = AdhanMethod.MuslimWorldLeague();
      params.fajrAngle = 20; // Sudut fajr Kemenag RI
      params.ishaAngle = 18; // Sudut isha Kemenag RI
      params.maghribAngle = 0; // Sudut maghrib Kemenag RI
      return params;
    default:
      return AdhanMethod.MuslimWorldLeague();
  }
}

export function calculatePrayerTimes(
  coordinates: Coordinates,
  method: CalculationMethod,
  asrCalculation: AsrCalculation = 'Standard',
  timeAdjustments: TimeAdjustments = {
    fajr: method === 'KemenagRI' ? 2 : 0, // Penyesuaian 2 menit untuk Kemenag RI
    sunrise: method === 'KemenagRI' ? 2 : 0, // Penyesuaian 2 menit untuk Kemenag RI
    dhuhr: method === 'KemenagRI' ? 2 : 0, // Penyesuaian 2 menit untuk Kemenag RI
    asr: method === 'KemenagRI' ? 2 : 0, // Penyesuaian 2 menit untuk Kemenag RI
    maghrib: method === 'KemenagRI' ? 2 : 0, // Penyesuaian 2 menit untuk Kemenag RI
    isha: method === 'KemenagRI' ? 2 : 0 // Penyesuaian 2 menit untuk Kemenag RI
  },
  date: Date = new Date()
): {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
} {
  const params = getCalculationMethod(method);
  const coords = new AdhanCoordinates(coordinates.latitude, coordinates.longitude);
  
  // Set madhab based on asrCalculation
  const madhab = asrCalculation === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  params.madhab = madhab;

  // Create a new PrayerTimes instance
  const prayerTimes = new AdhanPrayerTimes(coords, date, params);

  // Apply time adjustments
  const adjustTime = (time: Date, adjustment: number) => {
    return new Date(time.getTime() + adjustment * 60000);
  };

  return {
    fajr: adjustTime(prayerTimes.fajr, timeAdjustments.fajr),
    sunrise: adjustTime(prayerTimes.sunrise, timeAdjustments.sunrise),
    dhuhr: adjustTime(prayerTimes.dhuhr, timeAdjustments.dhuhr),
    asr: adjustTime(prayerTimes.asr, timeAdjustments.asr),
    maghrib: adjustTime(prayerTimes.maghrib, timeAdjustments.maghrib),
    isha: adjustTime(prayerTimes.isha, timeAdjustments.isha)
  };
}

export function getNextPrayer(
  prayerTimes: {
    fajr: Date;
    sunrise: Date;
    dhuhr: Date;
    asr: Date;
    maghrib: Date;
    isha: Date;
  },
  iqamaAdjustments: Record<string, number>
): {
  name: string;
  time: Date;
  remainingTime: string;
  isIqama: boolean;
} {
  const now = new Date();
  const prayers = [
    { name: 'Fajr', time: prayerTimes.fajr },
    { name: 'Sunrise', time: prayerTimes.sunrise },
    { name: 'Dhuhr', time: prayerTimes.dhuhr },
    { name: 'Asr', time: prayerTimes.asr },
    { name: 'Maghrib', time: prayerTimes.maghrib },
    { name: 'Isha', time: prayerTimes.isha },
  ];

  // Find current or next prayer
  let currentPrayerIndex = -1;
  for (let i = 0; i < prayers.length; i++) {
    if (now >= prayers[i].time) {
      currentPrayerIndex = i;
    } else {
      break;
    }
  }

  // Check if we're in iqama period
  if (currentPrayerIndex !== -1) {
    const currentPrayer = prayers[currentPrayerIndex];
    if (currentPrayer.name !== 'Sunrise') {
      const iqamaTime = new Date(currentPrayer.time.getTime() + (iqamaAdjustments[currentPrayer.name.toLowerCase()] || 0) * 60000);
      if (now < iqamaTime) {
        // We're between adhan and iqama
        const timeDiff = iqamaTime.getTime() - now.getTime();
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        return {
          name: currentPrayer.name,
          time: iqamaTime,
          remainingTime: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
          isIqama: true
        };
      }
    }
  }

  // Find the next prayer
  const nextPrayer = prayers.find(prayer => prayer.time > now) || prayers[0];
  
  // Calculate time difference
  let timeDiff = nextPrayer.time.getTime() - now.getTime();
  if (timeDiff < 0) {
    // If no prayer is left today, calculate time until first prayer tomorrow
    timeDiff += 24 * 60 * 60 * 1000;
  }
  
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
  
  return {
    name: nextPrayer.name,
    time: nextPrayer.time,
    remainingTime: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    isIqama: false
  };
}

export function getCurrentPrayer(prayerTimes: {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}): string | null {
  const now = new Date();
  const prayers = [
    { name: 'Fajr', time: prayerTimes.fajr },
    { name: 'Sunrise', time: prayerTimes.sunrise },
    { name: 'Dhuhr', time: prayerTimes.dhuhr },
    { name: 'Asr', time: prayerTimes.asr },
    { name: 'Maghrib', time: prayerTimes.maghrib },
    { name: 'Isha', time: prayerTimes.isha },
  ];

  for (let i = prayers.length - 1; i >= 0; i--) {
    if (now >= prayers[i].time) {
      return prayers[i].name;
    }
  }

  return prayers[prayers.length - 1].name;
}