import React, { useState, useEffect } from 'react';
import { Utensils, Coffee, Moon } from 'lucide-react';
import { getTimeUntilIfter, getTimeUntilSuhoorEnd, isSuhoorTime } from '../utils/ramadan';
import { ProgressBar } from './ProgressBar';

interface RamadanCountdownProps {
  maghribTime: Date;
  fajrTime: Date;
  isNightTime: boolean;
}

export function RamadanCountdown({ maghribTime, fajrTime, isNightTime }: RamadanCountdownProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [progress, setProgress] = useState(0);
  const [isSuhoor, setIsSuhoor] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const suhoorTime = isSuhoorTime(maghribTime, fajrTime);
      setIsSuhoor(suhoorTime);
      
      if (suhoorTime) {
        setTimeLeft(getTimeUntilSuhoorEnd(fajrTime));
        // Calculate progress for suhoor
        const now = new Date();
        const totalDuration = fajrTime.getTime() - maghribTime.getTime();
        const elapsed = now.getTime() - maghribTime.getTime();
        setProgress(Math.min(100, (elapsed / totalDuration) * 100));
      } else {
        setTimeLeft(getTimeUntilIfter(maghribTime));
        // Calculate progress for iftar
        const now = new Date();
        const totalDuration = maghribTime.getTime() - fajrTime.getTime();
        const elapsed = now.getTime() - fajrTime.getTime();
        setProgress(Math.min(100, (elapsed / totalDuration) * 100));
      }
    };

    // Update immediately
    updateCountdown();
    
    // Then update every second
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [maghribTime, fajrTime]);

  return (
    <div className={`p-8 rounded-2xl backdrop-blur-sm shadow-xl ${
      isNightTime ? 'bg-gray-800/50' : 'bg-white/80'
    }`}>
      <div className="flex items-center justify-center gap-4 mb-6">
        {isSuhoor ? (
          <>
            <Moon className="w-8 h-8 text-purple-400 animate-pulse" />
            <h2 className={`text-2xl font-medium ${
              isNightTime ? 'text-white' : 'text-gray-900'
            }`}>
              Time Until End of Suhoor
            </h2>
            <Coffee className="w-8 h-8 text-purple-400 animate-pulse" />
          </>
        ) : (
          <>
            <Coffee className="w-8 h-8 text-amber-400 animate-pulse" />
            <h2 className={`text-2xl font-medium ${
              isNightTime ? 'text-white' : 'text-gray-900'
            }`}>
              Time Until Iftar
            </h2>
            <Utensils className="w-8 h-8 text-amber-400 animate-pulse" />
          </>
        )}
      </div>
      <div className={`text-5xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r ${
        isSuhoor
          ? isNightTime ? 'from-purple-400 to-blue-400' : 'from-purple-600 to-blue-600'
          : isNightTime ? 'from-amber-400 to-orange-400' : 'from-amber-600 to-orange-600'
      }`}>
        {timeLeft}
      </div>
      <ProgressBar 
        progress={progress}
        color={isSuhoor ? 'bg-gradient-to-r from-purple-400 to-blue-400' : 'bg-gradient-to-r from-amber-400 to-orange-400'}
        isNightTime={isNightTime}
      />
    </div>
  );
}