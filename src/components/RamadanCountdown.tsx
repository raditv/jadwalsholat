import React, { useState, useEffect } from 'react';
import { Utensils, Coffee, Moon } from 'lucide-react';
import { getTimeUntilIfter, getTimeUntilSuhoorEnd, isSuhoorTime } from '../utils/ramadan';

interface RamadanCountdownProps {
  maghribTime: Date;
  fajrTime: Date;
  isNightTime: boolean;
}

export function RamadanCountdown({ maghribTime, fajrTime, isNightTime }: RamadanCountdownProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isSuhoor, setIsSuhoor] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateCountdown = () => {
      const suhoorTime = isSuhoorTime(maghribTime, fajrTime);
      setIsSuhoor(suhoorTime);
      
      if (suhoorTime) {
        setTimeLeft(getTimeUntilSuhoorEnd(fajrTime));
        // Hitung progress untuk sahur
        const now = new Date();
        const totalDuration = 24 * 60 * 60 * 1000; // 24 jam dalam milidetik
        const elapsed = now.getTime() - new Date(maghribTime).getTime();
        const progress = (elapsed / totalDuration) * 100;
        setProgress(Math.min(progress, 100));
      } else {
        setTimeLeft(getTimeUntilIfter(maghribTime));
        // Hitung progress untuk iftar
        const now = new Date();
        const totalDuration = 24 * 60 * 60 * 1000; // 24 jam dalam milidetik
        const elapsed = now.getTime() - new Date(fajrTime).getTime();
        const progress = (elapsed / totalDuration) * 100;
        setProgress(Math.min(progress, 100));
      }
    };

    // Update immediately
    updateCountdown();
    
    // Then update every second
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [maghribTime, fajrTime]);

  return (
    <div className={`text-center p-4 rounded-lg ${
      isNightTime ? 'bg-gray-800/50' : 'bg-white/80'
    } backdrop-blur-sm shadow-lg mb-4`}>
      <div className="flex items-center justify-center gap-3 mb-2">
        {isSuhoor ? (
          <>
            <Moon className="w-5 h-5 text-purple-500" />
            <h2 className={`text-base font-medium ${
              isNightTime ? 'text-white' : 'text-gray-900'
            }`}>
              Time Until End of Suhoor
            </h2>
            <Coffee className="w-5 h-5 text-purple-500" />
          </>
        ) : (
          <>
            <Coffee className="w-5 h-5 text-amber-500" />
            <h2 className={`text-base font-medium ${
              isNightTime ? 'text-white' : 'text-gray-900'
            }`}>
              Time Until Iftar
            </h2>
            <Utensils className="w-5 h-5 text-amber-500" />
          </>
        )}
      </div>
      <div className={`text-3xl font-bold mb-2 ${
        isSuhoor
          ? isNightTime ? 'text-purple-400' : 'text-purple-600'
          : isNightTime ? 'text-amber-400' : 'text-amber-600'
      }`}>
        {timeLeft}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ${
            isSuhoor ? 'bg-purple-500' : 'bg-amber-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}