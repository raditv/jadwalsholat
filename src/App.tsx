import React, { useState, useEffect } from 'react';
import { PrayerTimes, Coordinates, CalculationMethod, AsrCalculation, TimeAdjustments } from './types';
import { HijriDateDisplay } from './components/HijriDate';
import { Settings, MapPin, Moon, Sun, Sunrise, Coffee, Sun as SunIcon, Cloud, Sunset, Moon as MoonIcon, Clock, Bell, Calendar, Star, CloudSun, Compass } from 'lucide-react';
import { SettingsPanel } from './components/SettingsPanel';
import { calculatePrayerTimes, getNextPrayer, getCurrentPrayer } from './utils/prayerTimes';
import { getCityName, getCountry } from './utils/geocoding';
import { Tabs } from './components/Tabs';
import { IqamaCountdown } from './components/IqamaCountdown';
import { format, addDays, isSameMinute } from 'date-fns';
import { CitySelector } from './components/CitySelector';
import { RamadanCountdown } from './components/RamadanCountdown';
import { isRamadan } from './utils/ramadan';
import { PrayerTimeCard } from './components/PrayerTimeCard';
import { QiblaDirection } from './components/QiblaDirection';

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
    fajr: 2,
    sunrise: 2,
    dhuhr: 2,
    asr: 2,
    maghrib: 2,
    isha: 2,
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
  const [isQiblaOpen, setIsQiblaOpen] = useState(false);
  const [qiblaDirection, setQiblaDirection] = useState(0);

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
    getCountry(defaultCoords.latitude, defaultCoords.longitude).then(country => {
      if (country === 'Indonesia') {
        updateSettings({ calculationMethod: 'KemenagRI' });
      }
    });

    // Request location permission
    const requestLocationPermission = async () => {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        });

        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setCoordinates(coords);
        const city = await getCityName(coords.latitude, coords.longitude);
        setCityName(city);
        
        // Set calculation method based on country
        const country = await getCountry(coords.latitude, coords.longitude);
        if (country === 'Indonesia') {
          updateSettings({ calculationMethod: 'KemenagRI' });
        } else {
          updateSettings({ calculationMethod: 'MuslimWorldLeague' });
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };

    // Request device orientation permission for compass
    const requestCompassPermission = async () => {
      try {
        if (typeof DeviceOrientationEvent !== 'undefined' && 
            typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission !== 'granted') {
            console.warn('Compass permission denied');
          }
        }
      } catch (error) {
        console.error('Error requesting compass permission:', error);
      }
    };

    // Request both permissions
    requestLocationPermission();
    requestCompassPermission();
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
    
    // Set calculation method based on country
    const country = await getCountry(lat, lon);
    if (country === 'Indonesia') {
      updateSettings({ calculationMethod: 'KemenagRI' });
    } else {
      updateSettings({ calculationMethod: 'MuslimWorldLeague' });
    }
    
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

  // Check if notifications are supported
  const isNotificationSupported = () => {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!isNotificationSupported()) {
      updateSettings({ notificationsEnabled: false });
      alert('Notifikasi tidak didukung di browser ini');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        updateSettings({ notificationsEnabled: false });
        alert('Izin notifikasi ditolak. Silakan aktifkan notifikasi di pengaturan browser Anda.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      updateSettings({ notificationsEnabled: false });
    }
  };

  // Send notification with vibration
  const sendNotification = (title: string, body: string, tag: string) => {
    if (!isNotificationSupported() || Notification.permission !== 'granted') return;

    try {
      // Vibration pattern: 500ms vibrate, 200ms pause, 500ms vibrate
      if ('vibrate' in navigator) {
        navigator.vibrate([500, 200, 500]);
      }

      const notification = new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag,
        requireInteraction: true
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  // Request permission when notifications are enabled
  useEffect(() => {
    if (settings.notificationsEnabled) {
      requestNotificationPermission();
    }
  }, [settings.notificationsEnabled]);

  // Handle prayer time notifications
  useEffect(() => {
    if (!settings.notificationsEnabled || !prayerTimes) return;

    const checkPrayerTimes = () => {
      const now = new Date();
      Object.entries(prayerTimes).forEach(([name, time]) => {
        // Skip sunrise notifications
        if (name.toLowerCase() === 'sunrise') return;

        // Check for adhan time
        if (isSameMinute(now, time)) {
          sendNotification(
            `Waktu ${name}`,
            `Telah masuk waktu sholat ${name}`,
            `prayer-${name}-${time.getTime()}`
          );
        }

        // Check for iqama time
        const iqamaTime = new Date(time.getTime() + (settings.iqamaAdjustments[name] || 0) * 60000);
        if (isSameMinute(now, iqamaTime)) {
          sendNotification(
            `Iqama ${name}`,
            `Waktu iqama untuk sholat ${name}`,
            `iqama-${name}-${iqamaTime.getTime()}`
          );
        }

        // Pre-adhan notification (5 minutes before)
        const preAdhanTime = new Date(time.getTime() - 5 * 60000);
        if (isSameMinute(now, preAdhanTime)) {
          sendNotification(
            `Persiapan ${name}`,
            `5 menit menuju waktu sholat ${name}`,
            `pre-${name}-${time.getTime()}`
          );
        }
      });
    };

    const interval = setInterval(checkPrayerTimes, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [settings.notificationsEnabled, prayerTimes, settings.iqamaAdjustments]);

  // Calculate Qibla direction when coordinates change
  useEffect(() => {
    if (coordinates) {
      // Kaaba coordinates
      const kaabaLat = 21.4225;
      const kaabaLng = 39.8262;
      
      // Calculate Qibla direction
      const lat1 = coordinates.latitude * Math.PI / 180;
      const lat2 = kaabaLat * Math.PI / 180;
      const lngDiff = (kaabaLng - coordinates.longitude) * Math.PI / 180;
      
      const y = Math.sin(lngDiff);
      const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(lngDiff);
      let qibla = Math.atan2(y, x) * 180 / Math.PI;
      
      // Normalize to 0-360
      qibla = (qibla + 360) % 360;
      
      setQiblaDirection(qibla);
    }
  }, [coordinates]);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      isNightTime() 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-emerald-50 via-blue-50 to-emerald-50'
    }`}>
      <div className="container mx-auto px-6 pt-[calc(env(safe-area-inset-top)+48px)] pb-8 safe-left safe-right">
        <div className="flex flex-col space-y-6">
          <header className="text-center">
            <div className="relative flex items-center justify-center mb-4 w-8 h-8 mx-auto">
              {isNightTime() ? (
                <>
                  <Star className={`absolute w-8 h-8 text-emerald-400 drop-shadow-glow-emerald`} />
                  <Star className={`absolute w-4 h-4 -translate-x-3 -translate-y-2 text-emerald-400/70 drop-shadow-glow-emerald`} />
                  <Star className={`absolute w-3 h-3 translate-x-3 translate-y-2 text-emerald-400/50 drop-shadow-glow-emerald`} />
                </>
              ) : (
                <>
                  <CloudSun className={`absolute w-8 h-8 text-emerald-600 drop-shadow-glow-amber`} />
                  <Cloud className={`absolute w-5 h-5 -translate-x-4 translate-y-2 text-emerald-600/70 drop-shadow-glow-amber`} />
                </>
              )}
            </div>
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <button 
                  onClick={() => setIsCitySelectorOpen(true)}
                  className="text-lg font-medium hover:text-emerald-600 transition-colors"
                >
                  {cityName}
                </button>
              </div>
            </div>
          </header>

          <HijriDateDisplay isNightTime={isNightTime()} />

          <div className="flex space-x-1 mb-8 p-1 rounded-2xl bg-white/10 backdrop-blur-md shadow-inner">
            <button
              onClick={() => setActiveTab('times')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                activeTab === 'times'
                  ? isNightTime()
                    ? 'bg-emerald-600/90 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : isNightTime()
                    ? 'text-gray-300 hover:bg-white/5'
                    : 'text-gray-600 hover:bg-black/5'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="font-medium">Today</span>
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                activeTab === 'schedule'
                  ? isNightTime()
                    ? 'bg-emerald-600/90 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : isNightTime()
                    ? 'text-gray-300 hover:bg-white/5'
                    : 'text-gray-600 hover:bg-black/5'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Schedule</span>
            </button>
          </div>

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

              <div className="md:col-span-2">
                <div className={`p-4 rounded-2xl transition-all duration-300 ${
                  isNightTime() 
                    ? 'bg-gray-800/40 backdrop-blur-md shadow-xl shadow-black/10' 
                    : 'bg-white/80 backdrop-blur-md shadow-xl shadow-black/5'
                }`}>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Clock className={`w-5 h-5 ${
                      isNightTime() ? 'text-emerald-400' : 'text-emerald-600'
                    }`} />
                    <h2 className={`text-base font-medium ${
                      isNightTime() ? 'text-white' : 'text-gray-900'
                    }`}>
                      Current Prayer
                    </h2>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-1 ${
                      isNightTime() 
                        ? 'text-emerald-400 drop-shadow-glow-emerald' 
                        : 'text-emerald-600'
                    }`}>
                      {currentPrayer || 'None'}
                    </div>
                    <div className={`text-sm font-medium ${
                      isNightTime() ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {currentPrayer ? 'In Progress' : 'No Active Prayer'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && prayerTimes && (
            <div className="overflow-hidden rounded-2xl">
              <div className="flex justify-between items-center mb-3 px-1">
                <button
                  onClick={() => setSelectedDate(d => addDays(d, -1))}
                  className={`p-2.5 rounded-xl transition-all duration-300 ${
                    isNightTime() 
                      ? 'text-gray-300 hover:text-white hover:bg-white/5' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-black/5'
                  }`}
                  aria-label="Previous day"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className={`font-serif text-sm tracking-wide px-4 py-1.5 rounded-xl ${
                  isNightTime() 
                    ? 'bg-gray-800/30 text-gray-200 backdrop-blur-sm' 
                    : 'bg-black/5 text-gray-800 backdrop-blur-sm'
                }`}>
                  {format(selectedDate, 'EEEE, d MMMM yyyy')}
                </div>
                <button
                  onClick={() => setSelectedDate(d => addDays(d, 1))}
                  className={`p-2.5 rounded-xl transition-all duration-300 ${
                    isNightTime() 
                      ? 'text-gray-300 hover:text-white hover:bg-white/5' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-black/5'
                  }`}
                  aria-label="Next day"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              <div className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                isNightTime() 
                  ? 'bg-gray-800/40 backdrop-blur-md shadow-xl shadow-black/10' 
                  : 'bg-white/80 backdrop-blur-md shadow-xl shadow-black/5'
              }`}>
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${
                      isNightTime() ? 'border-gray-700/50' : 'border-gray-200/50'
                    }`}>
                      <th className={`px-4 py-3 text-left text-sm font-medium ${
                        isNightTime() ? 'text-gray-200' : 'text-gray-700'
                      }`}>Prayer</th>
                      <th className={`px-4 py-3 text-left text-sm font-medium ${
                        isNightTime() ? 'text-gray-200' : 'text-gray-700'
                      }`}>Adhan</th>
                      <th className={`px-4 py-3 text-left text-sm font-medium ${
                        isNightTime() ? 'text-gray-200' : 'text-gray-700'
                      }`}>Iqama</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(prayerTimes).map(([name, time]) => (
                      <tr key={name} className={`
                        transition-colors duration-300
                        ${nextPrayer?.name.toLowerCase() === name.toLowerCase() && !nextPrayer.isIqama
                          ? isNightTime()
                            ? 'bg-emerald-600/90 text-white'
                            : 'bg-emerald-600 text-white'
                          : isNightTime() ? 'text-gray-200' : 'text-gray-800'
                      }
                      border-b ${isNightTime() ? 'border-gray-700/50' : 'border-gray-200/50'}
                      hover:bg-black/5
                    `}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getPrayerIcon(name)}
                            <span className="text-sm font-medium">{name.charAt(0).toUpperCase() + name.slice(1)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">{format(time, 'HH:mm')}</td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {name !== 'sunrise' && format(new Date(time.getTime() + (settings.iqamaAdjustments[name] || 0) * 60000), 'HH:mm')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-6 right-6 safe-bottom safe-right">
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className={`p-3 rounded-xl transition-all duration-300 ${
            isNightTime()
              ? 'bg-emerald-600/90 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500/90'
              : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500'
          }`}
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div className="fixed bottom-6 left-6 safe-bottom safe-left">
        <button 
          onClick={() => setIsQiblaOpen(true)}
          className={`p-3 rounded-xl transition-all duration-300 ${
            isNightTime()
              ? 'bg-emerald-600/90 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500/90'
              : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500'
          }`}
          aria-label="Qibla Direction"
        >
          <Compass className="w-5 h-5" />
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
        className="pt-[calc(env(safe-area-inset-top)+48px)]"
      />

      <QiblaDirection
        isOpen={isQiblaOpen}
        onClose={() => setIsQiblaOpen(false)}
        coordinates={coordinates || { latitude: -6.2088, longitude: 106.8456 }}
      />

      <CitySelector
        isOpen={isCitySelectorOpen}
        onClose={() => setIsCitySelectorOpen(false)}
        onCitySelect={handleCitySelect}
      />
    </div>
  );
}

export default App;