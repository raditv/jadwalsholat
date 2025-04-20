// utils/useCompass.ts
import { useEffect, useMemo, useRef, useState } from "react";
import throttle from "lodash.throttle";

export type DeviceOrientationPermission = "granted" | "denied" | "default";
export type OrientationState = {
  degree: number;
  accuracy: number;
};

// Extend DeviceOrientationEvent untuk iOS
interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  requestPermission?: () => Promise<DeviceOrientationPermission>;
}

const useCompass = (interval: number = 20): OrientationState | null => {
  const absolute = useRef<boolean>(false);
  const [state, setState] = useState<OrientationState | null>(null);

  const updateAlpha = useMemo(() => {
    return throttle(
      (newState: OrientationState | null) => {
        setState(newState);
      },
      Math.max(5, interval)
    );
  }, [interval]);

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.absolute) {
        absolute.current = true;
      }
      
      let degree: number | null = null;

      // Untuk iOS dengan webkitCompassHeading
      if (typeof (event as any).webkitCompassHeading !== "undefined") {
        // iOS memberikan sudut searah jarum jam dari utara, sudah benar
        degree = (event as any).webkitCompassHeading;
      } else if (event.absolute === absolute.current && event.alpha !== null) {
        // Android/browser lain memberikan sudut berlawanan arah jarum jam
        // Kita perlu mengkonversi ke format yang sama dengan iOS
        degree = (360 - event.alpha) % 360;
      }

      if (degree !== null) {
        updateAlpha({
          degree,
          accuracy: (event as any).webkitCompassAccuracy || 0,
        });
      }
    };

    window.addEventListener("deviceorientation", handleOrientation);
    window.addEventListener("deviceorientationabsolute", handleOrientation);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      window.removeEventListener("deviceorientationabsolute", handleOrientation);
    };
  }, [updateAlpha]);

  return state;
};

export default useCompass;

export const requestPermission = async (): Promise<DeviceOrientationPermission> => {
  if (
    isSafari &&
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof (DeviceOrientationEvent as unknown as DeviceOrientationEventiOS).requestPermission === "function"
  ) {
    try {
      const response = await (DeviceOrientationEvent as unknown as DeviceOrientationEventiOS).requestPermission?.();
      return response || "denied";
    } catch (error) {
      return "denied";
    }
  }
  return "granted";
};

export const isSafari: boolean = (() => {
  try {
    const ua = navigator.userAgent;
    return ua.includes("Safari/") && !ua.includes("Chrome/") && !ua.includes("Chromium/");
  } catch (error) {
    return false;
  }
})();
