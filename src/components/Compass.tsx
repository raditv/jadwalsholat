import { useEffect, useState } from "react";
import useCompass, { requestPermission, isSafari, OrientationState } from "../utils/useCompass";
import { Compass as CompassIcon } from "lucide-react";

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

  const getRotation = () => {
    if (deviceOrientation === null) return 0;
    // Hitung sudut relatif antara arah perangkat dan arah kiblat
    return (qiblaDirection - deviceOrientation + 360) % 360;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      {deviceOrientation === null ? (
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
          <div
            className="w-64 h-64 relative"
            style={{
              transform: `rotate(${getRotation()}deg)`,
              transition: "transform 0.2s ease-out",
            }}
          >
            <CompassIcon className="w-full h-full text-emerald-600 dark:text-emerald-500" />
          </div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Arah Kiblat: {qiblaDirection.toFixed(2)}°
          </p>
          {deviceOrientation !== null && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Arah Perangkat: {deviceOrientation.toFixed(2)}°
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default CompassWrapper; 