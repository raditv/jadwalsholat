// Koordinat Ka'bah
const KAABA_COORDS = {
  latitude: 21.4225,
  longitude: 39.8262
};

export const calculateQiblaDirection = (latitude: number, longitude: number): number => {
  const lat1 = latitude * Math.PI / 180;
  const lon1 = longitude * Math.PI / 180;
  const lat2 = KAABA_COORDS.latitude * Math.PI / 180;
  const lon2 = KAABA_COORDS.longitude * Math.PI / 180;

  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  let qibla = Math.atan2(y, x) * 180 / Math.PI;
  qibla = (qibla + 360) % 360;

  return qibla;
}; 