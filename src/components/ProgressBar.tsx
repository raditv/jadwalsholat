import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  color: string;
  isNightTime: boolean;
}

export function ProgressBar({ progress, color, isNightTime }: ProgressBarProps) {
  return (
    <div className={`w-full h-2 rounded-full overflow-hidden ${
      isNightTime ? 'bg-gray-700/50' : 'bg-gray-200/50'
    }`}>
      <div 
        className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
} 