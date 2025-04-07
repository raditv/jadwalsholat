// utils/useCompass.ts
import { useEffect, useMemo, useRef, useState } from "react";
import throttle from "lodash.throttle";

export type DeviceOrientationPermission = "granted" | "denied" | "default";
export type OrientationState = {
  degree: number;
  accuracy: number;
};

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
      // Untuk iOS dengan webkitCompassHeading
      if (typeof (event as any).webkitCompassHeading !== "undefined") {
        updateAlpha({
          degree: 360 - (event as any).webkitCompassHeading,
          accuracy: (event as any).webkitCompassAccuracy || 0,
        });
      } else if (event.absolute === absolute.current && event.alpha !== null) {
        updateAlpha({ degree: event.alpha, accuracy: 0 });
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
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    try {
      const response = await DeviceOrientationEvent.requestPermission();
      return response;
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
