import React from 'react';
import { Calendar, Clock } from 'lucide-react';

interface TabsProps {
  activeTab: 'times' | 'schedule';
  onTabChange: (tab: 'times' | 'schedule') => void;
  isNightTime: boolean;
}

export function Tabs({ activeTab, onTabChange, isNightTime }: TabsProps) {
  return (
    <div className="flex space-x-1 mb-8 p-1 rounded-lg bg-white/10 backdrop-blur-sm">
      <button
        onClick={() => onTabChange('times')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
          activeTab === 'times'
            ? 'bg-emerald-600 text-white'
            : `${isNightTime ? 'text-gray-300' : 'text-gray-600'} hover:bg-gray-100/10`
        }`}
      >
        <Clock className="w-4 h-4" />
        <span>Today</span>
      </button>
      <button
        onClick={() => onTabChange('schedule')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
          activeTab === 'schedule'
            ? 'bg-emerald-600 text-white'
            : `${isNightTime ? 'text-gray-300' : 'text-gray-600'} hover:bg-gray-100/10`
        }`}
      >
        <Calendar className="w-4 h-4" />
        <span>Schedule</span>
      </button>
    </div>
  );
}