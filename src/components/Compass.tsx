// components/CompassWrapper.tsx
import { useEffect, useState, useCallback } from "react";
import useCompass from "../utils/useCompass";
import { requestPermission, isSafari } from "../utils/useCompass";

interface CompassWrapperProps {
  qiblaDirection: number;
}

const CompassWrapper = ({ qiblaDirection }: CompassWrapperProps) => {
  const [permission, setPermission] = useState<"default" | "granted" | "denied">("default");
  const [deviceOrientation, setDeviceOrientation] = useState<number | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  const handlePermissionRequest = async () => {
    const permissionResult = await requestPermission();
    setPermission(permissionResult);
  };

  useEffect(() => {
    // Cek dukungan sensor orientasi
    const isOrientationSupported = "DeviceOrientationEvent" in window;
    setIsSupported(isOrientationSupported);

    const handleOrientation = (event: DeviceOrientationEvent) => {
      let alpha: number | null = null;
      if (typeof (event as any).webkitCompassHeading !== "undefined") {
        alpha = 360 - (event as any).webkitCompassHeading;
      } else if (event.alpha !== null) {
        alpha = event.alpha;
      }
      if (alpha !== null) {
        setDeviceOrientation(alpha);
      }
    };

    window.addEventListener("deviceorientation", handleOrientation);
    window.addEventListener("deviceorientationabsolute", handleOrientation);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      window.removeEventListener("deviceorientationabsolute", handleOrientation);
    };
  }, []);

  if (isSafari && permission !== "granted") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <button
          onClick={handlePermissionRequest}
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
          Perangkat Anda tidak mendukung sensor orientasi.
          <br />
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
  const compassState = useCompass(100);

  const getRotation = useCallback(() => {
    // Gunakan nilai dari hook useCompass jika tersedia, jika tidak fallback ke deviceOrientation
    const currentHeading = compassState && compassState.degree !== null ? compassState.degree : deviceOrientation || 0;
    return (qiblaDirection - currentHeading + 360) % 360;
  }, [compassState, deviceOrientation, qiblaDirection]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      {deviceOrientation === null && !compassState ? (
        <div className="text-center p-4">
          <p className="text-gray-600 dark:text-gray-400 mb-2">Menunggu data sensor...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Arahkan perangkat Anda ke berbagai arah untuk mengaktifkan sensor.
          </p>
        </div>
      ) : (
        <>
          <div className="relative w-64 h-64">
            {/* Gambar kompas dengan animasi rotasi */}
            <div
              className="absolute inset-0 bg-contain bg-center bg-no-repeat"
              style={{
                backgroundImage: "url(/compass.png)",
                transform: `rotate(${getRotation()}deg)`,
                transition: "transform 0.3s ease-out",
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
            {compassState && compassState.accuracy !== null && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Akurasi: ±{compassState.accuracy.toFixed(2)}°
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
