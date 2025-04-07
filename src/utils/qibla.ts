import { Coordinates } from "adhan";

// Koordinat Ka'bah di Mekah
const KAABA_COORDINATES: Coordinates = {
  latitude: 21.4225,
  longitude: 39.8262
};

export const getQiblaDirection = (coordinates: Coordinates): number => {
  const lat1 = coordinates.latitude * Math.PI / 180;
  const lat2 = KAABA_COORDINATES.latitude * Math.PI / 180;
  const longDiff = (KAABA_COORDINATES.longitude - coordinates.longitude) * Math.PI / 180;

  const y = Math.sin(longDiff);
  const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(longDiff);

  let qiblaDirection = Math.atan2(y, x) * 180 / Math.PI;
  qiblaDirection = (qiblaDirection + 360) % 360;

  return qiblaDirection;
}; 