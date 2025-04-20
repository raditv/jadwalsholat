// components/QiblaDirection.tsx
import { useMemo } from "react";
import { X } from "lucide-react";
import { Coordinates } from "adhan";
import { getQiblaDirection } from "../utils/qibla";
import CompassWrapper from "./Compass";

interface QiblaDirectionProps {
  isOpen: boolean;
  onClose: () => void;
  coordinates: Coordinates;
}

export const QiblaDirection = ({ isOpen, onClose, coordinates }: QiblaDirectionProps) => {
  // Hitung arah kiblat hanya saat koordinat berubah
  const qiblaDirection = useMemo(() => {
    if (coordinates) {
      return getQiblaDirection(coordinates);
    }
    return 0;
  }, [coordinates]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Background overlay */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      {/* Panel Konten */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden m-auto">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Arah Kiblat</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Tutup panel arah kiblat"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4">
          {/* Komponen Kompas */}
          <CompassWrapper qiblaDirection={qiblaDirection} />
        </div>
      </div>
    </div>
  );
};
