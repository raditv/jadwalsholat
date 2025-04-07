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
  // Gunakan data sensor dari useCompass, fallback ke deviceOrientation jika belum tersedia
  const compassState = useCompass(100);
  const currentHeading =
    compassState && compassState.degree !== null ? compassState.degree : deviceOrientation || 0;
  // Hitung rotasi jarum penunjuk relatif arah kiblat
  const rotation = (qiblaDirection - currentHeading + 360) % 360;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <CompassDial rotation={rotation} />
      <div className="mt-6 text-center">
        <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
          Arah Kiblat: {qiblaDirection.toFixed(2)}°
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Arah Perangkat: {currentHeading.toFixed(2)}°
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
  rotation: number;
}

const CompassDial = ({ rotation }: CompassDialProps) => {
  // Daftar penanda arah
  const directions = [
    { angle: 0, label: "N" },
    { angle: 45, label: "NE" },
    { angle: 90, label: "E" },
    { angle: 135, label: "SE" },
    { angle: 180, label: "S" },
    { angle: 225, label: "SW" },
    { angle: 270, label: "W" },
    { angle: 315, label: "NW" },
  ];

  return (
    <div className="relative w-64 h-64">
      {/* Lingkaran dial luar */}
      <div className="absolute inset-0 rounded-full border-4 border-gray-300"></div>

      {/* Marker arah */}
      {directions.map((dir) => (
        <div
          key={dir.angle}
          className="absolute"
          style={{
            top: "50%",
            left: "50%",
            transform: `rotate(${dir.angle}deg) translateY(-calc(50% - 20px))`,
            transformOrigin: "center center",
          }}
        >
          <div
            style={{
              transform: `rotate(-${dir.angle}deg)`,
              fontSize: "1rem",
              fontWeight: dir.label === "N" ? "bold" : "normal",
            }}
          >
            {dir.label}
          </div>
        </div>
      ))}

      {/* Jarum penunjuk arah kiblat */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderBottom: "60px solid red",
            transform: `rotate(${rotation}deg)`,
            transition: "transform 0.3s ease-out",
          }}
        ></div>
      </div>

      {/* Titik pusat */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
      </div>
    </div>
  );
};

export default CompassWrapper;
