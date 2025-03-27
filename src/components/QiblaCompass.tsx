import React, { useState, useEffect, useRef } from 'react';
import { Compass, AlertCircle, RotateCcw, CheckCircle2, X } from 'lucide-react';
import { calculateQiblaDirection } from '../utils/qibla';

interface QiblaCompassProps {
  isNightTime: boolean;
  coordinates: { latitude: number; longitude: number; } | null;
}

export const QiblaCompass = ({ isNightTime, coordinates }: QiblaCompassProps) => {
  const [direction, setDirection] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [showPermissionRequest, setShowPermissionRequest] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationOffset, setCalibrationOffset] = useState(0);
  const [showCalibrationSuccess, setShowCalibrationSuccess] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const compassRef = useRef<HTMLDivElement>(null);
  const orientationHandlerRef = useRef<((event: DeviceOrientationEvent) => void) | null>(null);

  useEffect(() => {
    if (!coordinates) return;

    const qiblaDirection = calculateQiblaDirection(coordinates.latitude, coordinates.longitude);
    setDirection(qiblaDirection);

    const checkDeviceSupport = async () => {
      if (!window.DeviceOrientationEvent) {
        setError('Perangkat Anda tidak mendukung sensor orientasi');
        return;
      }

      if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
        setPermission('granted');
        return;
      }

      setShowPermissionRequest(true);
    };

    checkDeviceSupport();

    return () => {
      if (orientationHandlerRef.current) {
        window.removeEventListener('deviceorientation', orientationHandlerRef.current);
      }
    };
  }, [coordinates]);

  useEffect(() => {
    if (permission !== 'granted') return;

    orientationHandlerRef.current = (event: DeviceOrientationEvent) => {
      if (!event.alpha) return;

      const calibratedDirection = (event.alpha - calibrationOffset + 360) % 360;
      setDirection(calibratedDirection);
    };

    window.addEventListener('deviceorientation', orientationHandlerRef.current);
    
    return () => {
      if (orientationHandlerRef.current) {
        window.removeEventListener('deviceorientation', orientationHandlerRef.current);
      }
    };
  }, [permission, calibrationOffset]);

  const requestPermission = async () => {
    try {
      const permission = await (DeviceOrientationEvent as any).requestPermission();
      if (permission === 'granted') {
        setPermission('granted');
        setShowPermissionRequest(false);
      } else {
        setPermission('denied');
        setError('Izin akses sensor ditolak. Silakan aktifkan di pengaturan perangkat Anda.');
      }
    } catch (error) {
      setPermission('denied');
      setError('Gagal mendapatkan izin akses sensor');
    }
  };

  const startCalibration = () => {
    setIsCalibrating(true);
    setShowCalibrationSuccess(false);
  };

  const finishCalibration = () => {
    if (!compassRef.current) return;
    
    const transform = window.getComputedStyle(compassRef.current).transform;
    const matrix = new DOMMatrix(transform);
    const angle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
    
    setCalibrationOffset(angle);
    setIsCalibrating(false);
    setShowCalibrationSuccess(true);
    
    const timeoutId = setTimeout(() => setShowCalibrationSuccess(false), 2000);
    return () => clearTimeout(timeoutId);
  };

  const CompassContent = () => {
    if (error) {
      return (
        <div className="flex items-center gap-3 text-red-500 mb-4">
          <AlertCircle className="w-6 h-6" />
          <h2 className="text-lg font-medium">Error</h2>
        </div>
      );
    }

    if (showPermissionRequest) {
      return (
        <>
          <div className="flex items-center gap-3 mb-4">
            <Compass className="w-6 h-6 text-emerald-500" />
            <h2 className="text-lg font-medium">Izin Akses Sensor</h2>
          </div>
          <p className="text-sm mb-4">
            Aplikasi membutuhkan akses ke sensor orientasi perangkat Anda untuk menentukan arah kiblat.
          </p>
          <button
            onClick={requestPermission}
            className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Izinkan Akses
          </button>
        </>
      );
    }

    return (
      <>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Compass className="w-6 h-6 text-emerald-500" />
            <h2 className="text-lg font-medium">Arah Kiblat</h2>
          </div>
          <button
            onClick={isCalibrating ? finishCalibration : startCalibration}
            className={`p-2 rounded-full transition-colors ${
              isCalibrating 
                ? 'bg-emerald-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title={isCalibrating ? 'Selesai Kalibrasi' : 'Kalibrasi Kompas'}
          >
            {isCalibrating ? <CheckCircle2 className="w-5 h-5" /> : <RotateCcw className="w-5 h-5" />}
          </button>
        </div>

        <div className="relative w-full aspect-square max-w-[300px] mx-auto">
          <div 
            ref={compassRef}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `rotate(${direction}deg)`,
              transition: isCalibrating ? 'none' : 'transform 0.3s ease-out'
            }}
          >
            <div className="relative w-48 h-48">
              {/* Lingkaran kompas */}
              <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700">
                {/* Garis-garis arah mata angin */}
                <div className="absolute inset-0">
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                    <div
                      key={angle}
                      className="absolute w-1 h-4 bg-gray-300 dark:bg-gray-600"
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: `rotate(${angle}deg) translateY(-24px)`,
                        transformOrigin: 'center 24px'
                      }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Jarum kompas */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-2 h-24">
                  {/* Jarum utara (merah) */}
                  <div className="absolute inset-0 bg-red-500 rounded-full transform -translate-y-12" />
                  {/* Jarum selatan (hitam) */}
                  <div className="absolute inset-0 bg-gray-900 rounded-full transform translate-y-12" />
                  {/* Kepala jarum */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isCalibrating && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm">
                Arahkan perangkat ke arah kiblat
              </div>
            </div>
          )}

          {showCalibrationSuccess && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm animate-fade-out">
                Kalibrasi berhasil!
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isCalibrating 
              ? 'Putar perangkat Anda hingga jarum menunjuk ke arah kiblat'
              : 'Jarum menunjukkan arah kiblat'}
          </p>
        </div>
      </>
    );
  };

  return (
    <>
      {/* Tombol kompas */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed top-8 right-8 p-4 rounded-full shadow-lg transition-all duration-300 ${
          isNightTime 
            ? 'bg-gray-800/50 hover:bg-gray-700/50' 
            : 'bg-white/80 hover:bg-white'
        } backdrop-blur-sm`}
        aria-label="Buka Kompas Kiblat"
      >
        <Compass className={`w-8 h-8 ${isNightTime ? 'text-emerald-400' : 'text-emerald-600'}`} />
      </button>

      {/* Popup kompas */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`relative w-full max-w-md p-6 rounded-2xl shadow-xl ${
            isNightTime ? 'bg-gray-800/90' : 'bg-white/90'
          }`}>
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Tutup Kompas"
            >
              <X className="w-5 h-5" />
            </button>
            <CompassContent />
          </div>
        </div>
      )}
    </>
  );
}; 