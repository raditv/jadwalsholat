import React from 'react';
import { X, Clock, Bell, Minus, Plus, Settings2 } from 'lucide-react';
import { CalculationMethod, AsrCalculation, TimeAdjustments } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  calculationMethod: CalculationMethod;
  onMethodChange: (method: CalculationMethod) => void;
  asrCalculation: AsrCalculation;
  onAsrCalculationChange: (method: AsrCalculation) => void;
  iqamaAdjustments: Record<string, number>;
  onIqamaAdjustmentChange: (prayer: string, minutes: number) => void;
  timeAdjustments: TimeAdjustments;
  onTimeAdjustmentChange: (prayer: string, minutes: number) => void;
  notificationsEnabled: boolean;
  onNotificationToggle: () => void;
}

const CALCULATION_METHODS: { value: CalculationMethod; label: string }[] = [
  { value: 'KemenagRI', label: 'Kemenag RI (Indonesia)' },
  { value: 'MuslimWorldLeague', label: 'Muslim World League' },
  { value: 'Egyptian', label: 'Egyptian General Authority' },
  { value: 'Karachi', label: 'University of Islamic Sciences, Karachi' },
  { value: 'UmmAlQura', label: 'Umm Al-Qura University, Makkah' },
  { value: 'Dubai', label: 'Dubai' },
  { value: 'MoonsightingCommittee', label: 'Moonsighting Committee' },
  { value: 'NorthAmerica', label: 'Islamic Society of North America' },
  { value: 'Kuwait', label: 'Kuwait' },
  { value: 'Qatar', label: 'Qatar' },
  { value: 'Singapore', label: 'Singapore' },
];

const ASR_CALCULATIONS: { value: AsrCalculation; label: string }[] = [
  { value: 'Standard', label: 'Standard (Shafi\'i, Maliki, Hanbali)' },
  { value: 'Hanafi', label: 'Hanafi' },
];

const PRAYER_NAMES = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export function SettingsPanel({
  isOpen,
  onClose,
  calculationMethod,
  onMethodChange,
  asrCalculation,
  onAsrCalculationChange,
  iqamaAdjustments,
  onIqamaAdjustmentChange,
  timeAdjustments,
  onTimeAdjustmentChange,
  notificationsEnabled,
  onNotificationToggle,
}: SettingsPanelProps) {
  if (!isOpen) return null;

  const handleIqamaIncrement = (prayer: string) => {
    const currentValue = iqamaAdjustments[prayer.toLowerCase()] || 0;
    onIqamaAdjustmentChange(prayer.toLowerCase(), Math.min(currentValue + 1, 60));
  };

  const handleIqamaDecrement = (prayer: string) => {
    const currentValue = iqamaAdjustments[prayer.toLowerCase()] || 0;
    onIqamaAdjustmentChange(prayer.toLowerCase(), Math.max(currentValue - 1, 0));
  };

  const handleTimeIncrement = (prayer: string) => {
    const currentValue = timeAdjustments[prayer.toLowerCase() as keyof TimeAdjustments] || 0;
    onTimeAdjustmentChange(prayer.toLowerCase(), Math.min(currentValue + 1, 30));
  };

  const handleTimeDecrement = (prayer: string) => {
    const currentValue = timeAdjustments[prayer.toLowerCase() as keyof TimeAdjustments] || 0;
    onTimeAdjustmentChange(prayer.toLowerCase(), Math.max(currentValue - 1, -30));
  };

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div 
        className={`fixed inset-y-0 right-0 w-96 max-w-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-full overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-full"
                aria-label="Close settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Calculation Method */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Calculation Method
                </label>
                <select
                  value={calculationMethod}
                  onChange={(e) => onMethodChange(e.target.value as CalculationMethod)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm
                    focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50
                    hover:border-gray-300 transition-colors cursor-pointer"
                >
                  {CALCULATION_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Asr Calculation Method */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Asr Calculation Method
                </label>
                <select
                  value={asrCalculation}
                  onChange={(e) => onAsrCalculationChange(e.target.value as AsrCalculation)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm
                    focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50
                    hover:border-gray-300 transition-colors cursor-pointer"
                >
                  {ASR_CALCULATIONS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Adjustments */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Settings2 className="w-4 h-4 text-emerald-600" />
                  Time Adjustments (minutes)
                </h3>
                <div className="space-y-2">
                  {PRAYER_NAMES.map((prayer) => (
                    <div key={`time-${prayer}`} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm text-gray-700">{prayer}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTimeDecrement(prayer)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700
                            hover:bg-emerald-200 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {timeAdjustments[prayer.toLowerCase() as keyof TimeAdjustments] || 0}
                        </span>
                        <button
                          onClick={() => handleTimeIncrement(prayer)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700
                            hover:bg-emerald-200 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Iqama Adjustments */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Iqama Delays (minutes)
                </h3>
                <div className="space-y-2">
                  {PRAYER_NAMES.filter(prayer => prayer !== 'Sunrise').map((prayer) => (
                    <div key={`iqama-${prayer}`} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm text-gray-700">{prayer}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleIqamaDecrement(prayer)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700
                            hover:bg-emerald-200 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {iqamaAdjustments[prayer.toLowerCase()] || 0}
                        </span>
                        <button
                          onClick={() => handleIqamaIncrement(prayer)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700
                            hover:bg-emerald-200 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notifications */}
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-gray-700">Prayer Notifications</span>
                </div>
                <button
                  onClick={onNotificationToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                    notificationsEnabled ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}