import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';
import { ProgressBar } from './ProgressBar';

interface IqamaCountdownProps {
  iqamaTime: Date;
  isNightTime: boolean;
}

export function IqamaCountdown({ iqamaTime, isNightTime }: IqamaCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [progress, setProgress] = useState(0);
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

      // Calculate progress
      const totalDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
      const elapsed = totalDuration - diff;
      setProgress(Math.min(100, (elapsed / totalDuration) * 100));

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
    <div className={`p-8 rounded-2xl backdrop-blur-sm shadow-xl ${
      isNightTime ? 'bg-gray-800/50' : 'bg-white/80'
    }`}>
      <div className="flex items-center justify-center gap-3 mb-6">
        <Timer className="w-8 h-8 text-emerald-400 animate-pulse" />
        <h2 className={`text-2xl font-medium ${
          isNightTime ? 'text-white' : 'text-gray-900'
        }`}>
          Time Until Iqama
        </h2>
      </div>
      <div className="text-5xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-blue-500">
        {timeLeft}
      </div>
      <ProgressBar 
        progress={progress}
        color="bg-gradient-to-r from-emerald-500 to-blue-500"
        isNightTime={isNightTime}
      />
    </div>
  );
}