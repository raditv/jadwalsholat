import React from 'react';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

interface HijriDateDisplayProps {
  isNightTime: boolean;
}

export function HijriDateDisplay({ isNightTime }: HijriDateDisplayProps) {
  const today = new Date();
  
  // Simple Hijri date calculation
  const gregorianDate = new Date(today);
  const jd = Math.floor((gregorianDate.getTime() - new Date(1970, 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 2440588;
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l1 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l1) / 5316) * Math.floor((50 * l1) / 17719) + Math.floor(l1 / 5670) * Math.floor((43 * l1) / 15238);
  const l2 = l1 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l2) / 709);
  const day = l2 - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;

  const hijriMonthNames = {
    1: 'Muharram',
    2: 'Safar',
    3: 'Rabi\' al-Awwal',
    4: 'Rabi\' al-Thani',
    5: 'Jumada al-Awwal',
    6: 'Jumada al-Thani',
    7: 'Rajab',
    8: 'Sha\'ban',
    9: 'Ramadan',
    10: 'Shawwal',
    11: 'Dhu al-Qi\'dah',
    12: 'Dhu al-Hijjah'
  };

  const getHijriDate = () => {
    const monthName = hijriMonthNames[month as keyof typeof hijriMonthNames];
    return `${day} ${monthName} ${year}`;
  };
  
  return (
    <div className={`text-center mb-6 ${isNightTime ? 'text-gray-300' : 'text-gray-800'}`}>
      <div className="text-3xl font-bold mb-1">
        {getHijriDate()}
      </div>
      <div className="text-xs opacity-80">
        {format(today, 'EEEE, d MMMM yyyy')}
      </div>
    </div>
  );
}