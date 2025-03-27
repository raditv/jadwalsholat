import React from 'react';
import { Clock, Volume2 } from 'lucide-react';
import { format } from 'date-fns';

interface PrayerCardProps {
  name: string;
  time: Date;
  iqamaTime: Date | null;
  isActive: boolean;
  onIqamaClick: () => void;
  isNightTime: boolean;
}

export function PrayerCard({ 
  name, 
  time, 
  iqamaTime,
  isActive, 
  onIqamaClick,
  isNightTime 
}: PrayerCardProps) {
  const getPrayerIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'fajr':
        return '🌅';
      case 'sunrise':
        return '☀️';
      case 'dhuhr':
        return '🌞';
      case "jumu'ah":
        return '🕌';
      case 'asr':
        return '🌤';
      case 'maghrib':
        return '🌅';
      case 'isha':
        return '🌙';
      default:
        return '⏰';
    }
  };

  return (
    <div 
      className={`
        rounded-2xl p-6 transition-all duration-300 backdrop-blur-sm
        ${isActive 
          ? 'bg-emerald-600 text-white shadow-lg scale-105' 
          : isNightTime
            ? 'bg-gray-800/50 text-white shadow-md hover:shadow-lg'
            : 'bg-white/80 text-gray-800 shadow-md hover:shadow-lg'
        }
      `}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getPrayerIcon(name)}</span>
          <h3 className="text-xl font-semibold">{name}</h3>
        </div>
        <Clock className="w-5 h-5" />
      </div>
      
      <div className="space-y-2">
        <div>
          <div className="text-sm opacity-80">Adhan</div>
          <div className="text-2xl font-bold">
            {format(time, 'HH:mm')}
          </div>
        </div>
        
        {iqamaTime && (
          <div>
            <div className="text-sm opacity-80">Iqama</div>
            <div className="text-xl font-semibold">
              {format(iqamaTime, 'HH:mm')}
            </div>
          </div>
        )}
      </div>
      
      {iqamaTime && (
        <button
          onClick={onIqamaClick}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-md w-full justify-center mt-4
            ${isActive 
              ? 'bg-white text-emerald-600 hover:bg-gray-100' 
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }
            transition-colors duration-200
          `}
        >
          <Volume2 className="w-4 h-4" />
          <span>Adjust Iqama</span>
        </button>
      )}
    </div>
  );
}