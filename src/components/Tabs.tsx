import React from 'react';
import { Calendar, Clock } from 'lucide-react';

interface TabsProps {
  activeTab: 'times' | 'schedule';
  onTabChange: (tab: 'times' | 'schedule') => void;
  isNightTime: boolean;
}

export function Tabs({ activeTab, onTabChange, isNightTime }: TabsProps) {
  return (
    <div className={`flex space-x-2 mb-12 p-1 rounded-full backdrop-blur-sm shadow-lg ${
      isNightTime ? 'bg-gray-800/50' : 'bg-white/80'
    }`}>
      <button
        onClick={() => onTabChange('times')}
        className={`flex-1 flex items-center justify-center p-4 rounded-full transition-all duration-300 ${
          activeTab === 'times'
            ? 'bg-emerald-600 text-white shadow-lg'
            : `${isNightTime ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} hover:bg-gray-100/10`
        }`}
        aria-label="Today's Prayer Times"
      >
        <Clock className="w-6 h-6" />
      </button>
      <button
        onClick={() => onTabChange('schedule')}
        className={`flex-1 flex items-center justify-center p-4 rounded-full transition-all duration-300 ${
          activeTab === 'schedule'
            ? 'bg-emerald-600 text-white shadow-lg'
            : `${isNightTime ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} hover:bg-gray-100/10`
        }`}
        aria-label="Prayer Schedule"
      >
        <Calendar className="w-6 h-6" />
      </button>
    </div>
  );
}