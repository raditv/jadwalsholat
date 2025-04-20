// components/CompassWrapper.tsx
import { useEffect, useState } from "react";
import useCompass, { requestPermission, isSafari } from "../utils/useCompass";

interface CompassWrapperProps {
  qiblaDirection: number; // Arah kiblat dalam derajat
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

export default CompassWrapper;

// -------------------------------------------------------
// Komponen Compass dan Dial yang telah diperbarui

interface CompassProps {
  deviceOrientation: number | null;
  qiblaDirection: number;
}

const Compass = ({ deviceOrientation, qiblaDirection }: CompassProps) => {
  const compassState = useCompass(100);
  const heading = compassState?.degree ?? deviceOrientation ?? 0;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <CompassDial heading={heading} qiblaDirection={qiblaDirection} />
      <div className="mt-6 text-center">
        <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
          Arah Kiblat: {qiblaDirection.toFixed(2)}°
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Arah Perangkat: {heading.toFixed(2)}°
        </p>
        {compassState && compassState.accuracy !== null && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Akurasi: ±{compassState.accuracy.toFixed(2)}°
          </p>
        )}
      </div>
    </div>
  );
};

interface CompassDialProps {
  heading: number;
  qiblaDirection: number;
}

const CompassDial = ({ heading, qiblaDirection }: CompassDialProps) => {
  // Fungsi normalisasi sudut ke rentang 0 - 360 derajat
  const normalize = (angle: number) => ((angle % 360) + 360) % 360;

  // Background kompas berputar untuk menyesuaikan dengan arah mata angin sebenarnya
  // Jika device menghadap timur (90°), background harus berputar -90° agar utara tetap di utara
  const dialRotation = normalize(-heading);
  
  // Jarum berputar sesuai arah device
  // Jika device menghadap timur (90°), jarum juga harus 90°
  const needleRotation = normalize(heading);

  return (
    <div className="relative w-[300px] h-[300px] mx-auto">
      {/* Kompas background - berputar mengikuti arah mata angin */}
      <div 
        className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
        style={{ transform: `rotate(${dialRotation}deg)` }}
      >
        <img 
          src="/compas.png" 
          alt="Compass" 
          className="w-[300px] h-[300px] object-contain"
        />
      </div>

      {/* Jarum kompas berputar sesuai arah device */}
      <div
        className="absolute left-1/2 top-1/2 transition-transform duration-300 ease-out"
        style={{ 
          transform: `translate(-50%, -50%) rotate(${needleRotation}deg)`,
          transformOrigin: "center center",
          width: '40px',
          height: '120px'
        }}
      >
        <img 
          src="/needle.png" 
          alt="Device Direction" 
          className="w-full h-full object-contain"
        />
      </div>

      {/* Titik pusat kompas */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-3 h-3 bg-gray-800 dark:bg-gray-200 rounded-full" />
      </div>
    </div>
  );
};
