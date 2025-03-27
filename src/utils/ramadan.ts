export function isRamadan(date: Date = new Date()): boolean {
  // Simple Hijri date calculation for Ramadan detection
  const gregorianDate = new Date(date);
  const jd = Math.floor((gregorianDate.getTime() - new Date(1970, 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 2440588;
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l1 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l1) / 5316) * Math.floor((50 * l1) / 17719) + Math.floor(l1 / 5670) * Math.floor((43 * l1) / 15238);
  const l2 = l1 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l2) / 709);
  
  return month === 9; // Ramadan is the 9th month
}

export function getIfterTime(maghribTime: Date): Date {
  return new Date(maghribTime);
}

export function getSuhoorEndTime(fajrTime: Date): Date {
  const now = new Date();
  const endTime = new Date(fajrTime);
  
  // If current time is after midnight but before fajr, use today's fajr
  if (now.getHours() < 12) {
    return endTime;
  }
  
  // If current time is after maghrib, use tomorrow's fajr
  endTime.setDate(endTime.getDate() + 1);
  return endTime;
}

export function getTimeUntilIfter(maghribTime: Date): string {
  const now = new Date();
  const timeDiff = maghribTime.getTime() - now.getTime();
  
  if (timeDiff <= 0) return '00:00:00';
  
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function getTimeUntilSuhoorEnd(fajrTime: Date): string {
  const now = new Date();
  const suhoorEnd = getSuhoorEndTime(fajrTime);
  const timeDiff = suhoorEnd.getTime() - now.getTime();
  
  if (timeDiff <= 0) return '00:00:00';
  
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function isSuhoorTime(maghribTime: Date, fajrTime: Date): boolean {
  const now = new Date();
  const currentTime = now.getTime();
  const todayMaghrib = new Date(maghribTime);
  const todayFajr = new Date(fajrTime);
  const tomorrowFajr = getSuhoorEndTime(fajrTime);
  
  // After maghrib until midnight
  if (now.getHours() >= 18) {
    return currentTime >= todayMaghrib.getTime();
  }
  
  // After midnight until fajr
  if (now.getHours() < 12) {
    return currentTime <= todayFajr.getTime();
  }
  
  return false;
}