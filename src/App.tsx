import { useState, useEffect } from 'react';
import { PrayerTimes, Coordinates, CalculationMethod, AsrCalculation, TimeAdjustments } from './types';
import { HijriDateDisplay } from './components/HijriDate';
import { Settings, MapPin, Moon, Sun, Sunrise, Coffee, Sun as SunIcon, Cloud, Sunset, Moon as MoonIcon } from 'lucide-react';
import { SettingsPanel } from './components/SettingsPanel';
import { calculatePrayerTimes, getNextPrayer, getCurrentPrayer } from './utils/prayerTimes';
import { getCityName } from './utils/geocoding';
import { Tabs } from './components/Tabs';
import { IqamaCountdown } from './components/IqamaCountdown';
import { format, addDays } from 'date-fns';
import { CitySelector } from './components/CitySelector';
import { RamadanCountdown } from './components/RamadanCountdown';
import { isRamadan } from './utils/ramadan';
import { requestNotificationPermission, schedulePrayerNotifications, cancelAllNotifications } from './utils/notifications';
import { QiblaCompass } from './components/QiblaCompass';

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
    fajr: 2,      // Kemenag RI: +2 menit
    sunrise: 0,
    dhuhr: 2,     // Kemenag RI: +2 menit
    asr: 2,       // Kemenag RI: +2 menit
    maghrib: 2,   // Kemenag RI: +2 menit
    isha: 2,      // Kemenag RI: +2 menit
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
          // Tampilkan pesan error yang lebih informatif
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setCityName('Izin lokasi ditolak. Menggunakan lokasi default (Jakarta)');
              break;
            case error.POSITION_UNAVAILABLE:
              setCityName('Informasi lokasi tidak tersedia. Menggunakan lokasi default (Jakarta)');
              break;
            case error.TIMEOUT:
              setCityName('Waktu permintaan lokasi habis. Menggunakan lokasi default (Jakarta)');
              break;
            default:
              setCityName('Gagal mendapatkan lokasi. Menggunakan lokasi default (Jakarta)');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      setCityName('Geolokasi tidak didukung. Menggunakan lokasi default (Jakarta)');
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

  // Handle notification permission and scheduling
  useEffect(() => {
    if (settings.notificationsEnabled) {
      requestNotificationPermission().then(granted => {
        if (!granted) {
          updateSettings({ notificationsEnabled: false });
        }
      });
    }
  }, [settings.notificationsEnabled]);

  // Schedule notifications when prayer times change
  useEffect(() => {
    if (settings.notificationsEnabled && prayerTimes) {
      schedulePrayerNotifications(prayerTimes, settings.iqamaAdjustments);
    } else {
      cancelAllNotifications();
    }

    return () => {
      cancelAllNotifications();
    };
  }, [settings.notificationsEnabled, prayerTimes, settings.iqamaAdjustments]);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isNightTime() ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-blue-50 via-emerald-50 to-blue-50'}`}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <QiblaCompass isNightTime={isNightTime()} coordinates={coordinates} />
        <header className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            {isNightTime() ? (
              <Moon className="w-12 h-12 text-emerald-400 animate-pulse" />
            ) : (
              <Sun className="w-12 h-12 text-amber-400 animate-pulse" />
            )}
          </div>
          <button
            onClick={() => setIsCitySelectorOpen(true)}
            className={`flex items-center justify-center gap-2 mx-auto px-4 py-2 rounded-full transition-all duration-300 ${
              isNightTime() 
                ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white' 
                : 'bg-white/80 text-gray-700 hover:bg-white hover:text-gray-900'
            } shadow-lg hover:shadow-xl backdrop-blur-sm`}
          >
            <MapPin className="w-5 h-5" />
            <span className="font-medium">{cityName}</span>
          </button>
        </header>

        <HijriDateDisplay isNightTime={isNightTime()} />

        <Tabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isNightTime={isNightTime()}
        />

        {activeTab === 'times' && (
          <div className="space-y-8">
            {isRamadan() && prayerTimes && (
              <RamadanCountdown
                maghribTime={prayerTimes.maghrib}
                fajrTime={prayerTimes.fajr}
                isNightTime={isNightTime()}
              />
            )}

            {nextPrayer && prayerTimes && (
              <div className={`text-center space-y-8 ${isNightTime() ? 'text-white' : 'text-gray-900'}`}>
                {!nextPrayer.isIqama && (
                  <div className={`p-8 rounded-2xl backdrop-blur-sm shadow-xl ${
                    isNightTime() ? 'bg-gray-800/50' : 'bg-white/80'
                  }`}>
                    <h2 className="text-2xl font-medium mb-4">
                      {nextPrayer.name} Prayer Time
                    </h2>
                    <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-blue-500">
                      {format(nextPrayer.time, 'HH:mm')}
                    </div>
                  </div>
                )}
                
                <div className={`p-8 rounded-2xl backdrop-blur-sm shadow-xl ${
                  isNightTime() ? 'bg-gray-800/50' : 'bg-white/80'
                }`}>
                  <h2 className="text-2xl font-medium mb-4">
                    {nextPrayer.isIqama ? 'Time Until Iqama' : 'Next Prayer'}
                  </h2>
                  <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-blue-500">
                    {nextPrayer.isIqama ? nextPrayer.remainingTime : nextPrayer.name}
                  </div>
                  {!nextPrayer.isIqama && (
                    <div className="text-2xl mt-4 text-gray-500">{nextPrayer.remainingTime}</div>
                  )}
                </div>

                {nextPrayer.isIqama && (
                  <IqamaCountdown
                    iqamaTime={new Date(nextPrayer.time.getTime() + (settings.iqamaAdjustments[nextPrayer.name.toLowerCase()] || 0) * 60000)}
                    isNightTime={isNightTime()}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'schedule' && prayerTimes && (
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setSelectedDate(d => addDays(d, -1))}
                className={`px-4 py-2 rounded-full transition-all duration-300 text-sm ${
                  isNightTime() 
                    ? 'bg-gray-800/50 text-white hover:bg-gray-700/50' 
                    : 'bg-white/80 text-gray-800 hover:bg-white'
                } shadow-lg hover:shadow-xl backdrop-blur-sm`}
              >
                Sebelumnya
              </button>
              <div className={`text-lg font-medium ${isNightTime() ? 'text-white' : 'text-gray-900'}`}>
                {format(selectedDate, 'EEEE, d MMMM yyyy')}
              </div>
              <button
                onClick={() => setSelectedDate(d => addDays(d, 1))}
                className={`px-4 py-2 rounded-full transition-all duration-300 text-sm ${
                  isNightTime() 
                    ? 'bg-gray-800/50 text-white hover:bg-gray-700/50' 
                    : 'bg-white/80 text-gray-800 hover:bg-white'
                } shadow-lg hover:shadow-xl backdrop-blur-sm`}
              >
                Selanjutnya
              </button>
            </div>
            
            <div className={`rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl ${
              isNightTime() ? 'bg-gray-800/50' : 'bg-white/80'
            }`}>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-3 gap-4 text-sm font-medium">
                  <div className={isNightTime() ? 'text-gray-300' : 'text-gray-600'}>Sholat</div>
                  <div className={isNightTime() ? 'text-gray-300' : 'text-gray-600'}>Adzan</div>
                  <div className={isNightTime() ? 'text-gray-300' : 'text-gray-600'}>Iqama</div>
                </div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {Object.entries(prayerTimes).map(([name, time]) => (
                  <div 
                    key={name}
                    className={`p-4 ${
                      nextPrayer?.name.toLowerCase() === name.toLowerCase() && !nextPrayer.isIqama
                        ? 'bg-emerald-600/20 text-emerald-600'
                        : isNightTime() ? 'text-white' : 'text-gray-800'
                    }`}
                  >
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="flex items-center gap-3">
                        {getPrayerIcon(name)}
                        <span className="text-sm font-medium">{name.charAt(0).toUpperCase() + name.slice(1)}</span>
                      </div>
                      <div className="text-sm">{format(time, 'HH:mm')}</div>
                      <div className="text-sm text-gray-500">
                        {name !== 'sunrise' && format(new Date(time.getTime() + (settings.iqamaAdjustments[name] || 0) * 60000), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="fixed bottom-8 right-8">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className={`p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ${
              isNightTime() 
                ? 'bg-emerald-500 hover:bg-emerald-600' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            } text-white`}
            aria-label="Settings"
          >
            <Settings className="w-6 h-6" />
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