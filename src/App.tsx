import React, { useState, useEffect } from 'react';
import { PrayerTimes, Coordinates, CalculationMethod, AsrCalculation, TimeAdjustments } from './types';
import { HijriDateDisplay } from './components/HijriDate';
import { Settings, MapPin, Moon, Sun, Sunrise, Coffee, Sun as SunIcon, Cloud, Sunset, Moon as MoonIcon, Clock } from 'lucide-react';
import { SettingsPanel } from './components/SettingsPanel';
import { calculatePrayerTimes, getNextPrayer, getCurrentPrayer } from './utils/prayerTimes';
import { getCityName } from './utils/geocoding';
import { Tabs } from './components/Tabs';
import { IqamaCountdown } from './components/IqamaCountdown';
import { format, addDays, isSameMinute } from 'date-fns';
import { CitySelector } from './components/CitySelector';
import { RamadanCountdown } from './components/RamadanCountdown';
import { isRamadan } from './utils/ramadan';
import { PrayerTimeCard } from './components/PrayerTimeCard';

// Define the settings interface
interface Settings {
  calculationMethod: CalculationMethod;
  asrCalculation: AsrCalculation;
  iqamaAdjustments: Record<string, number>;
  timeAdjustments: TimeAdjustments;
  notificationsEnabled: boolean;
}

// Default settings
const DEFAULT_SETTINGS: Settings = {
  calculationMethod: 'KemenagRI',
  asrCalculation: 'Standard',
  iqamaAdjustments: {
    fajr: 20,
    dhuhr: 15,
    asr: 15,
    maghrib: 5,
    isha: 15,
  },
  timeAdjustments: {
    fajr: 0,
    sunrise: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  },
  notificationsEnabled: false,
};

function App() {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [cityName, setCityName] = useState<string>('Loading...');
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: Date; remainingTime: string; isIqama: boolean } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'times' | 'schedule'>('times');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentPrayer, setCurrentPrayer] = useState<string | null>(null);
  const [isCitySelectorOpen, setIsCitySelectorOpen] = useState(false);

  // Load settings from localStorage
  const loadSettings = (): Settings => {
    const savedSettings = localStorage.getItem('prayerSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        return { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e) {
        console.error('Error parsing settings:', e);
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  };

  // Initialize settings state from localStorage
  const [settings, setSettings] = useState<Settings>(loadSettings);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('prayerSettings', JSON.stringify(settings));
  }, [settings]);

  // Update individual settings
  const updateSettings = (updates: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };
  
  useEffect(() => {
    // Set default coordinates (Jakarta) immediately
    const defaultCoords = {
      latitude: -6.2088,
      longitude: 106.8456
    };
    setCoordinates(defaultCoords);
    getCityName(defaultCoords.latitude, defaultCoords.longitude).then(setCityName);

    // Then try to get actual location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setCoordinates(coords);
          const city = await getCityName(coords.latitude, coords.longitude);
          setCityName(city);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (coordinates) {
      try {
        const times = calculatePrayerTimes(
          coordinates,
          settings.calculationMethod,
          settings.asrCalculation,
          settings.timeAdjustments,
          selectedDate
        );
        setPrayerTimes(times);
        
        // Update next prayer and current prayer every second
        const interval = setInterval(() => {
          const next = getNextPrayer(times, settings.iqamaAdjustments);
          setNextPrayer(next);
          setCurrentPrayer(getCurrentPrayer(times));
        }, 1000);

        return () => clearInterval(interval);
      } catch (error) {
        console.error('Error calculating prayer times:', error);
      }
    }
  }, [coordinates, settings.calculationMethod, settings.asrCalculation, settings.timeAdjustments, selectedDate]);

  const handleCitySelect = async (lat: number, lon: number) => {
    const coords = { latitude: lat, longitude: lon };
    setCoordinates(coords);
    const city = await getCityName(lat, lon);
    setCityName(city);
    setIsCitySelectorOpen(false);
  };

  const isNightTime = () => {
    const hour = new Date().getHours();
    return hour >= 19 || hour < 6;
  };

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
        return null;
    }
  };

  // Request notification permission
  useEffect(() => {
    if (settings.notificationsEnabled) {
      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
          if (permission !== 'granted') {
            updateSettings({ notificationsEnabled: false });
          }
        });
      }
    }
  }, [settings.notificationsEnabled]);

  // Handle prayer time notifications
  useEffect(() => {
    if (!settings.notificationsEnabled || !prayerTimes) return;

    const checkPrayerTimes = () => {
      const now = new Date();
      Object.entries(prayerTimes).forEach(([name, time]) => {
        // Check for adhan time
        if (isSameMinute(now, time)) {
          new Notification(`${name} Prayer Time`, {
            body: `It's time for ${name} prayer`,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: `prayer-${name}-${time.getTime()}`,
            requireInteraction: true
          });
        }

        // Check for iqama time
        const iqamaTime = new Date(time.getTime() + (settings.iqamaAdjustments[name] || 0) * 60000);
        if (isSameMinute(now, iqamaTime)) {
          new Notification(`${name} Iqama Time`, {
            body: `It's time for ${name} iqama`,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: `iqama-${name}-${iqamaTime.getTime()}`,
            requireInteraction: true
          });
        }
      });
    };

    const interval = setInterval(checkPrayerTimes, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [settings.notificationsEnabled, prayerTimes, settings.iqamaAdjustments]);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isNightTime() ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-emerald-50'}`}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <header className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            {isNightTime() ? <Moon className="w-6 h-6 text-emerald-400" /> : <Sun className="w-6 h-6 text-amber-400" />}
          </div>
          <button
            onClick={() => setIsCitySelectorOpen(true)}
            className={`flex items-center justify-center gap-2 mx-auto text-sm ${
              isNightTime() ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>{cityName}</span>
          </button>
        </header>

        <HijriDateDisplay isNightTime={isNightTime()} />

        <Tabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isNightTime={isNightTime()}
        />

        {activeTab === 'times' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isRamadan() && prayerTimes && (
              <div className="md:col-span-2">
                <RamadanCountdown
                  maghribTime={prayerTimes.maghrib}
                  fajrTime={prayerTimes.fajr}
                  isNightTime={isNightTime()}
                />
              </div>
            )}

            {nextPrayer && prayerTimes && (
              <div className="md:col-span-2">
                <PrayerTimeCard
                  nextPrayer={nextPrayer}
                  isNightTime={isNightTime()}
                />
              </div>
            )}

            <div className={`p-4 rounded-lg ${
              isNightTime() ? 'bg-gray-800/50' : 'bg-white/80'
            } backdrop-blur-sm shadow-lg`}>
              <div className="flex items-center justify-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-amber-500" />
                <h2 className={`text-base font-medium ${
                  isNightTime() ? 'text-white' : 'text-gray-900'
                }`}>
                  Current Prayer
                </h2>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold mb-1 ${
                  isNightTime() ? 'text-emerald-400' : 'text-emerald-600'
                }`}>
                  {currentPrayer || 'None'}
                </div>
                <div className={`text-sm ${
                  isNightTime() ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {currentPrayer ? 'In Progress' : 'No Active Prayer'}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && prayerTimes && (
          <div className="overflow-x-auto">
            <div className="flex justify-between items-center mb-3">
              <button
                onClick={() => setSelectedDate(d => addDays(d, -1))}
                className={`p-2.5 rounded-full transition-all ${
                  isNightTime() 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/80'
                }`}
                aria-label="Previous day"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className={`font-serif text-sm tracking-wide px-4 py-1.5 rounded-full ${
                isNightTime() 
                  ? 'bg-gray-800/30 text-gray-200' 
                  : 'bg-white/50 text-gray-800'
              }`}>
                {format(selectedDate, 'EEEE, d MMMM yyyy')}
              </div>
              <button
                onClick={() => setSelectedDate(d => addDays(d, 1))}
                className={`p-2.5 rounded-full transition-all ${
                  isNightTime() 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/80'
                }`}
                aria-label="Next day"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <table className={`w-full ${
              isNightTime() ? 'bg-gray-800/50' : 'bg-white/80'
            } backdrop-blur-sm rounded-lg overflow-hidden`}>
              <thead>
                <tr className={isNightTime() ? 'text-gray-300' : 'text-gray-600'}>
                  <th className="px-4 py-2 text-left text-sm">Prayer</th>
                  <th className="px-4 py-2 text-left text-sm">Adhan</th>
                  <th className="px-4 py-2 text-left text-sm">Iqama</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(prayerTimes).map(([name, time]) => (
                  <tr key={name} className={`
                    ${nextPrayer?.name.toLowerCase() === name.toLowerCase() && !nextPrayer.isIqama
                      ? 'bg-emerald-600 text-white'
                      : isNightTime() ? 'text-white' : 'text-gray-800'
                    }
                    border-t ${isNightTime() ? 'border-gray-700' : 'border-gray-200'}
                  `}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getPrayerIcon(name)}
                        <span className="text-sm">{name.charAt(0).toUpperCase() + name.slice(1)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{format(time, 'HH:mm')}</td>
                    <td className="px-4 py-3 text-sm">
                      {name !== 'sunrise' && format(new Date(time.getTime() + (settings.iqamaAdjustments[name] || 0) * 60000), 'HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="fixed bottom-4 right-4">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="bg-emerald-600 text-white p-3 rounded-full shadow-lg hover:bg-emerald-700 transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <SettingsPanel
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          calculationMethod={settings.calculationMethod}
          onMethodChange={(method) => updateSettings({ calculationMethod: method })}
          asrCalculation={settings.asrCalculation}
          onAsrCalculationChange={(method) => updateSettings({ asrCalculation: method })}
          iqamaAdjustments={settings.iqamaAdjustments}
          onIqamaAdjustmentChange={(prayer, minutes) => 
            updateSettings({
              iqamaAdjustments: {
                ...settings.iqamaAdjustments,
                [prayer]: minutes
              }
            })
          }
          timeAdjustments={settings.timeAdjustments}
          onTimeAdjustmentChange={(prayer, minutes) =>
            updateSettings({
              timeAdjustments: {
                ...settings.timeAdjustments,
                [prayer.toLowerCase()]: minutes
              }
            })
          }
          notificationsEnabled={settings.notificationsEnabled}
          onNotificationToggle={() => 
            updateSettings({ notificationsEnabled: !settings.notificationsEnabled })
          }
        />

        <CitySelector
          isOpen={isCitySelectorOpen}
          onClose={() => setIsCitySelectorOpen(false)}
          onCitySelect={handleCitySelect}
        />
      </div>
    </div>
  );
}

export default App;