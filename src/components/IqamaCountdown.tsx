import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

interface IqamaCountdownProps {
  iqamaTime: Date;
  isNightTime: boolean;
}

export function IqamaCountdown({ iqamaTime, isNightTime }: IqamaCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const diff = iqamaTime.getTime() - now.getTime();

      if (diff <= 0) {
        setIsActive(false);
        return '';
      }

      setIsActive(true);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    // Calculate initial time left
    const initialTimeLeft = calculateTimeLeft();
    setTimeLeft(initialTimeLeft);
    setIsActive(initialTimeLeft !== '');

    // Update every second if countdown is active
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      // If countdown finished, clear interval and set inactive
      if (!newTimeLeft) {
        setIsActive(false);
        clearInterval(timer);
      }
    }, 1000);

    // Cleanup on unmount or when iqamaTime changes
    return () => {
      clearInterval(timer);
    };
  }, [iqamaTime]); // Only re-run effect when iqamaTime changes

  // Don't render anything if countdown is not active
  if (!isActive || !timeLeft) {
    return null;
  }

  return (
    <div className={`text-center p-6 rounded-lg ${
      isNightTime ? 'bg-gray-800/50' : 'bg-white/80'
    } backdrop-blur-sm shadow-lg mb-8`}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <Timer className="w-6 h-6 text-emerald-500" />
        <h2 className={`text-xl font-medium ${
          isNightTime ? 'text-white' : 'text-gray-900'
        }`}>
          Time Until Iqama
        </h2>
      </div>
      <div className={`text-4xl font-bold ${
        isNightTime ? 'text-emerald-400' : 'text-emerald-600'
      }`}>
        {timeLeft}
      </div>
    </div>
  );
}