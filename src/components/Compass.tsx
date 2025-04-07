import { useEffect, useState } from "react";
import useCompass, { requestPermission, isSafari, OrientationState } from "../utils/useCompass";

interface CompassWrapperProps {
  qiblaDirection: number;
}

const CompassWrapper = ({ qiblaDirection }: CompassWrapperProps) => {
  const [permission, setPermission] = useState<"default" | "granted" | "denied">("default");
  const [deviceOrientation, setDeviceOrientation] = useState<number | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  const handleClick = () => {
    requestPermission().then((_permission) => {
      setPermission(_permission);
    });
  };

  useEffect(() => {
    // Cek apakah perangkat mendukung sensor orientasi
    const checkDeviceSupport = () => {
      return 'DeviceOrientationEvent' in window || 
             'ondeviceorientation' in window || 
             'ondeviceorientationabsolute' in window;
    };

    setIsSupported(checkDeviceSupport());

    const handleOrientation = (event: DeviceOrientationEvent) => {
      // Coba dapatkan nilai alpha (azimuth) dari berbagai properti
      let alpha = null;
      
      // Coba dapatkan dari webkitCompassHeading (iOS)
      if (typeof (event as any).webkitCompassHeading !== 'undefined') {
        alpha = 360 - (event as any).webkitCompassHeading;
      } 
      // Coba dapatkan dari alpha (standar)
      else if (event.alpha !== null) {
        alpha = event.alpha;
      }
      // Coba dapatkan dari beta dan gamma (Android)
      else if (event.beta !== null && event.gamma !== null) {
        // Perhitungan sederhana untuk Android
        alpha = Math.atan2(event.gamma, event.beta) * (180 / Math.PI);
        alpha = (alpha + 360) % 360;
      }
      
      if (alpha !== null) {
        setDeviceOrientation(alpha);
      }
    };

    // Coba berbagai event untuk kompatibilitas
    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('deviceorientationabsolute', handleOrientation);
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
    };
  }, []);

  if (isSafari && permission !== "granted") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <button 
          onClick={handleClick}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Izinkan Akses Sensor
        </button>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400 text-center p-4">
          Perangkat Anda tidak mendukung sensor orientasi.<br />
          Pastikan Anda menggunakan perangkat mobile dengan sensor kompas.
        </p>
      </div>
    );
  }

  return <Compass deviceOrientation={deviceOrientation} qiblaDirection={qiblaDirection} />;
};

interface CompassProps {
  deviceOrientation: number | null;
  qiblaDirection: number;
}

const Compass = ({ deviceOrientation, qiblaDirection }: CompassProps) => {
  const [compass, setCompass] = useState<OrientationState | null>(null);
  const _compass = useCompass(100);

  useEffect(() => {
    setCompass(_compass);
  }, [_compass]);

  // Hitung sudut relatif antara arah perangkat dan arah kiblat
  const getRotation = () => {
    if (deviceOrientation === null) return 0;
    
    // Jika menggunakan compass dari hook
    if (compass && compass.degree !== null) {
      // Hitung selisih antara arah kiblat dan arah perangkat
      return (qiblaDirection - compass.degree + 360) % 360;
    }
    
    // Jika menggunakan deviceOrientation
    return (qiblaDirection - deviceOrientation + 360) % 360;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      {deviceOrientation === null && compass === null ? (
        <div className="text-center p-4">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Menunggu data sensor...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Arahkan perangkat Anda ke berbagai arah untuk mengaktifkan sensor.
          </p>
        </div>
      ) : (
        <>
          <div className="relative w-64 h-64">
            {/* Gambar kompas */}
            <div
              className="absolute inset-0 bg-contain bg-center bg-no-repeat"
              style={{
                backgroundImage: "url(/compass.png)",
                transform: `rotate(${getRotation()}deg)`,
                transition: "transform 0.2s ease-out",
              }}
            />
            
            {/* Indikator arah kiblat */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-32 bg-red-500 transform origin-bottom" />
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
              Arah Kiblat: {qiblaDirection.toFixed(2)}°
            </p>
            {deviceOrientation !== null && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Arah Perangkat: {deviceOrientation.toFixed(2)}°
              </p>
            )}
            {compass && compass.accuracy !== null && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Akurasi: ±{compass.accuracy.toFixed(2)}°
              </p>
            )}
          </div>
          
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Cara Menggunakan:</strong>
            </p>
            <ol className="text-sm text-gray-600 dark:text-gray-400 mt-1 list-decimal list-inside">
              <li>Kalibrasi kompas jika diperlukan</li>
              <li>Arahkan perangkat ke arah yang ditunjukkan</li>
              <li>Pastikan perangkat dalam posisi datar</li>
            </ol>
          </div>
        </>
      )}
    </div>
  );
};

export default CompassWrapper; 