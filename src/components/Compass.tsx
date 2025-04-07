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

  // Dial diputar negatif terhadap heading agar bagian atas selalu sesuai dengan arah perangkat
  const dialRotation = normalize(-heading);
  // Net rotation untuk jarum menunjuk ke qibla (jarum dirotasi secara independen)
  const arrowRotation = normalize(qiblaDirection);

  // Daftar marker arah
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
    <div className="compass-dial">
      {/* Dial yang berputar mengikuti heading perangkat */}
      <div
        className="compass-dial-outer transition-transform duration-300 ease-out"
        style={{ transform: `rotate(${dialRotation}deg)` }}
      ></div>

      {/* Marker arah */}
      {directions.map((dir) => (
        <div
          key={dir.angle}
          className="compass-marker"
          style={{
            top: "50%",
            left: "50%",
            transform: `rotate(${dir.angle}deg) translateY(-calc(50% - 20px))`,
            transformOrigin: "center center",
            fontSize: "1rem",
            fontWeight: dir.label === "N" ? "bold" : "normal",
          }}
        >
          <div style={{ transform: `rotate(-${dir.angle}deg)` }}>{dir.label}</div>
        </div>
      ))}

      {/* Jarum penunjuk arah kiblat */}
      <div
        className="compass-arrow"
        style={{ transform: `rotate(${arrowRotation}deg)` }}
      >
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderBottom: "60px solid red",
          }}
        />
      </div>

      {/* Titik pusat kompas */}
      <div className="compass-center">
        <div className="w-4 h-4 bg-gray-800 dark:bg-gray-200 rounded-full" />
      </div>
    </div>
  );
};
