import React from 'react';
import { format } from 'date-fns';
import { Clock, Coffee, Sun as SunIcon, Cloud, Sunset, Moon as MoonIcon, Sunrise } from 'lucide-react';

interface PrayerTimeCardProps {
  nextPrayer: {
    name: string;
    time: Date;
    remainingTime: string;
    isIqama: boolean;
  };
  isNightTime: boolean;
}

export function PrayerTimeCard({ nextPrayer, isNightTime }: PrayerTimeCardProps) {
  const getPrayerIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'fajr':
        return <Coffee className="w-5 h-5 text-amber-500" />;
      case 'sunrise':
        return <Sunrise className="w-5 h-5 text-amber-500" />;
      case 'dhuhr':
        return <SunIcon className="w-5 h-5 text-amber-500" />;
      case 'asr':
        return <Cloud className="w-5 h-5 text-amber-500" />;
      case 'maghrib':
        return <Sunset className="w-5 h-5 text-amber-500" />;
      case 'isha':
        return <MoonIcon className="w-5 h-5 text-amber-500" />;
      default:
        return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className={`p-4 rounded-lg ${
      isNightTime ? 'bg-gray-800/50' : 'bg-white/80'
    } backdrop-blur-sm shadow-lg`}>
      <div className="flex items-center justify-center gap-2 mb-3">
        {getPrayerIcon(nextPrayer.name)}
        <h2 className={`text-base font-medium ${
          isNightTime ? 'text-white' : 'text-gray-900'
        }`}>
          {nextPrayer.isIqama ? 'Time Until Iqama' : `${nextPrayer.name} Prayer Time`}
        </h2>
      </div>
      
      <div className="text-center">
        <div className={`text-3xl font-bold mb-1 ${
          isNightTime ? 'text-emerald-400' : 'text-emerald-600'
        }`}>
          {nextPrayer.isIqama ? nextPrayer.remainingTime : format(nextPrayer.time, 'HH:mm')}
        </div>
        {!nextPrayer.isIqama && (
          <div className={`text-sm ${
            isNightTime ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {nextPrayer.remainingTime}
          </div>
        )}
      </div>
    </div>
  );
} 