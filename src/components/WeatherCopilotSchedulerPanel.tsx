import React, { useState, useEffect } from 'react';
import {
  CloudSun,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  CloudRain,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  Bot,
  Bell,
  X,
  Minimize2,
  Maximize2,
  ChevronDown,
  ChevronUp,
  MapPin,
  RefreshCw,
  Calculator,
  Layers,
  Check,
  ShieldAlert,
  ArrowRight,
  Pin,
  Compass,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { gridStaggerContainer, gridStaggerItem } from '../lib/motionVariants';
import {
  SiteParametersInput,
  RealWorldWeatherInput,
  FormulationTargetOutput,
  HourlyWeatherForecastItem,
  ScheduledCoatingTask,
  PAINT_TYPES_REGISTRY,
  QUALITY_GRADES_REGISTRY,
  calculateSiteFormulationTarget,
  generateHourlyWeatherForecast,
  generateWeatherIntegratedTaskSchedule,
  PaintTypeKey,
  QualityGrade,
} from '../lib/weatherEquationEngine';
import { playClickSound, playAlertChime, playSuccessSound, playToggleSound } from '../lib/soundUtils';

interface WeatherCopilotSchedulerPanelProps {
  siteParams: SiteParametersInput;
  onUpdateSiteParams: (params: Partial<SiteParametersInput>) => void;
  onTargetCalculated?: (target: FormulationTargetOutput) => void;
  onClose?: () => void;
  onMinimize?: () => void;
}

export interface WeatherToastNotification {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  weatherMetric: string;
  read: boolean;
}

export function WeatherCopilotSchedulerPanel({
  siteParams,
  onUpdateSiteParams,
  onTargetCalculated,
  onClose,
  onMinimize,
}: WeatherCopilotSchedulerPanelProps) {
  // Minimize & Corner Snap state
  const [isMinimized, setIsMinimized] = useState(false);
  const [cornerPosition, setCornerPosition] = useState<'bottom-right' | 'top-right' | 'bottom-left'>('bottom-right');
  const [activeTab, setActiveTab] = useState<'weather' | 'scheduler' | 'alerts'>('weather');

  // Calendar Modal State for Future Task Planning
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const now = new Date();
  const [calendarYear, setCalendarYear] = useState(now.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [plannedTaskName, setPlannedTaskName] = useState('Exterior Surface Coating & Spray Application');

  // Weather & Forecast state
  const [weather, setWeather] = useState<RealWorldWeatherInput>({
    temperatureCelsius: 22,
    relativeHumidityPercent: 68,
    dewPointCelsius: 14,
    windSpeedKmH: 14,
    uvIndex: 5,
    rainProbabilityPercent: 15,
    barometricPressureKpa: 101.3,
    locationName: 'Sector 4 Construction Site',
    lat: 51.5074,
    lng: -0.1278,
  });

  const [forecast, setForecast] = useState<HourlyWeatherForecastItem[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledCoatingTask[]>([]);
  const [notifications, setNotifications] = useState<WeatherToastNotification[]>([]);
  const [unreadAlertCount, setUnreadAlertCount] = useState(1);
  const [isRefreshingWeather, setIsRefreshingWeather] = useState(false);

  // Active Toast Popups
  const [activeToast, setActiveToast] = useState<WeatherToastNotification | null>(null);

  // Auto-dismiss weather notification toast after 4.5s without requiring a click
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  // Compute Formulation Target
  const targetOutput = calculateSiteFormulationTarget(siteParams, weather);

  // Initialize Forecast & Tasks
  useEffect(() => {
    const fc = generateHourlyWeatherForecast(weather.lat, weather.lng, weather.locationName);
    setForecast(fc);
    const tasks = generateWeatherIntegratedTaskSchedule(targetOutput, fc);
    setScheduledTasks(tasks);

    if (onTargetCalculated) {
      onTargetCalculated(targetOutput);
    }
  }, [siteParams.siteAreaSqFt, siteParams.siteAreaSqMeters, siteParams.paintTypeKey, siteParams.qualityGrade, siteParams.coatsCount, siteParams.surfacePorosity, weather.temperatureCelsius, weather.relativeHumidityPercent, weather.windSpeedKmH]);

  // Initial Copilot notification check: only trigger if there is an actual active weather warning or critical condition
  useEffect(() => {
    if (targetOutput.feasibilityStatus !== 'optimal' || weather.relativeHumidityPercent > 78 || weather.rainProbabilityPercent > 35) {
      const warningNotice: WeatherToastNotification = {
        id: `weather-alert-${Date.now()}`,
        title: '⚠️ Weather Feasibility Alert',
        message: `High moisture or adverse drying condition detected at ${weather.locationName}. RH is ${weather.relativeHumidityPercent}%, dry-to-touch extended by +${targetOutput.calculatedDryTimeToTouchHours}h.`,
        severity: 'warning',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        weatherMetric: `${weather.temperatureCelsius}°C | RH ${weather.relativeHumidityPercent}%`,
        read: false,
      };
      setNotifications([warningNotice]);
      setActiveToast(warningNotice);
      setUnreadAlertCount(1);
    }
  }, []);

  // Handle Manual Refresh of Weather Data
  const handleRefreshWeather = () => {
    playClickSound();
    setIsRefreshingWeather(true);

    setTimeout(() => {
      // Simulate real-time sensors jitter
      const newHumidity = Math.round(55 + Math.random() * 30);
      const newTemp = Math.round(18 + Math.random() * 10);
      const newWind = Math.round(8 + Math.random() * 18);
      const newRainProb = newHumidity > 80 ? 65 : Math.round(Math.random() * 20);

      const updatedWeather: RealWorldWeatherInput = {
        ...weather,
        relativeHumidityPercent: newHumidity,
        temperatureCelsius: newTemp,
        windSpeedKmH: newWind,
        rainProbabilityPercent: newRainProb,
        dewPointCelsius: Math.round(newTemp - (100 - newHumidity) / 5),
      };

      setWeather(updatedWeather);
      const fc = generateHourlyWeatherForecast(weather.lat, weather.lng, weather.locationName);
      setForecast(fc);

      const newTarget = calculateSiteFormulationTarget(siteParams, updatedWeather);
      const tasks = generateWeatherIntegratedTaskSchedule(newTarget, fc);
      setScheduledTasks(tasks);

      // Only push Copilot Notification Toast if there is a cautionary or noteworthy condition
      if (newHumidity > 78 || newRainProb > 40 || newTarget.feasibilityStatus !== 'optimal') {
        const newNotice: WeatherToastNotification = {
          id: `notice-${Date.now()}`,
          title: newHumidity > 78 ? '⚠️ High Humidity Copilot Alert' : 'Weather Condition Alert',
          message:
            newHumidity > 78
              ? `Relative Humidity spiked to ${newHumidity}%. Copilot extended recoat drying window by +2.5 hrs.`
              : `Weather updated: Rain probability at ${newRainProb}%, Feasibility is ${newTarget.feasibilityStatus}.`,
          severity: 'warning',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          weatherMetric: `${newTemp}°C | ${newHumidity}% RH`,
          read: false,
        };

        setNotifications((prev) => [newNotice, ...prev]);
        setActiveToast(newNotice);
        setUnreadAlertCount((prev) => prev + 1);
        playAlertChime('warning');
      } else {
        playSuccessSound();
      }

      setIsRefreshingWeather(false);
    }, 800);
  };

  return (
    <>
      {/* Active Toast Notification Banner (Centered at Top, Auto-dismissing) */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: -25,
              scale: 0.9,
              transition: { duration: 0.28, ease: 'easeInOut' },
            }}
            transition={{
              type: 'spring',
              stiffness: 420,
              damping: 18,
              mass: 0.8,
            }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] p-3.5 rounded-2xl bg-slate-900/98 border border-amber-500/60 shadow-2xl backdrop-blur-md flex items-start gap-3 font-sans text-xs text-slate-200 select-none pointer-events-auto"
            title="Weather notification"
          >
            <div
              className={`p-1.5 rounded-xl shrink-0 ${
                activeToast.severity === 'warning'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
              }`}
            >
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-white uppercase text-[11px] font-mono tracking-wider flex items-center gap-1 truncate">
                  {activeToast.title}
                </span>
                <span className="text-[9px] font-mono text-slate-400 shrink-0">{activeToast.timestamp}</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-snug">{activeToast.message}</p>
              <div className="flex items-center gap-1 text-[9px] font-mono text-cyan-400/90 pt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>Auto-dismissing alert</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setActiveToast(null);
              }}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Screen Aligned Responsive Weather Copilot Container */}
      <div className="w-full max-w-5xl mx-auto">
        {isMinimized ? (
          /* Minimized Banner State */
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full p-3 rounded-2xl bg-slate-900/95 border border-cyan-500/50 shadow-xl flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-600/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
                <CloudSun className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h4 className="font-mono text-xs font-bold text-white uppercase">Weather Copilot Minimized</h4>
                <p className="font-mono text-[10px] text-cyan-300">
                  {weather.locationName} • {weather.temperatureCelsius}°C • {weather.relativeHumidityPercent}% RH
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setIsMinimized(false);
              }}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Expand Weather UI</span>
            </button>
          </motion.div>
        ) : (
          /* EXPANDED FULLY VISIBLE IN-SCREEN WEATHER DASHBOARD */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-slate-900/95 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-xl flex flex-col overflow-hidden text-slate-200 text-xs font-sans select-none"
          >
            {/* Panel Top Header Bar */}
            <div className="p-3 sm:p-4 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-300">
                  <CloudSun className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider font-mono flex items-center gap-1.5">
                    Weather Copilot & Cure Diagnostics
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono mt-0.5">
                    <MapPin className="w-3 h-3 text-rose-400" />
                    <span>{weather.locationName}</span>
                    <span className="text-cyan-400 font-semibold ml-2">● Live Telemetry Synced</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Pin Calendar Task Planner Button */}
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setIsCalendarModalOpen(true);
                  }}
                  title="Open Calendar & Schedule Task for Future Date"
                  className="px-3 py-1.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-800/80 text-indigo-200 hover:text-white border border-indigo-500/40 transition-colors flex items-center gap-1.5 font-mono text-xs font-semibold cursor-pointer"
                >
                  <Pin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Plan Future Task</span>
                </button>

                {/* Refresh Live Weather */}
                <button
                  type="button"
                  onClick={handleRefreshWeather}
                  disabled={isRefreshingWeather}
                  title="Refresh Live Weather Sensors"
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1 font-mono text-xs cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshingWeather ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                {/* Minimize Button */}
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    if (onMinimize) onMinimize();
                    else setIsMinimized(true);
                  }}
                  title="Minimize Weather Panel"
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>

                {/* Close Button */}
                {onClose && (
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      onClose();
                    }}
                    title="Close Weather Copilot"
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-white border border-slate-700 hover:border-rose-500/40 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 text-slate-300" />
                  </button>
                )}
              </div>
            </div>

            {/* Weather & Feasibility Status Overview Ribbon */}
            <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 uppercase font-bold">Feasibility:</span>
                <span
                  className={`px-2 py-0.5 rounded font-bold uppercase ${
                    targetOutput.feasibilityStatus === 'optimal'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : targetOutput.feasibilityStatus === 'caution'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {targetOutput.feasibilityStatus} ({targetOutput.feasibilityScorePercent}%)
                </span>
              </div>

              <div className="text-slate-300 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-400" />
                <span>Dry to Recoat: {targetOutput.calculatedDryTimeToTouchHours}h</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-3 bg-slate-950 border-b border-slate-800 text-[10px] font-mono font-bold uppercase">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setActiveTab('weather');
                }}
                className={`py-2 text-center border-b-2 transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'weather'
                    ? 'border-indigo-500 text-indigo-400 bg-slate-900/80'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <CloudSun className="w-3 h-3" />
                <span>Weather</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setActiveTab('scheduler');
                }}
                className={`py-2 text-center border-b-2 transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'scheduler'
                    ? 'border-indigo-500 text-indigo-400 bg-slate-900/80'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>Schedule</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setActiveTab('alerts');
                }}
                className={`py-2 text-center border-b-2 transition-all flex items-center justify-center gap-1 relative ${
                  activeTab === 'alerts'
                    ? 'border-indigo-500 text-indigo-400 bg-slate-900/80'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bell className="w-3 h-3" />
                <span>Alerts</span>
                {notifications.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>
            </div>

            {/* Tab Body Contents */}
            <div className="p-3.5 space-y-3.5 overflow-y-auto flex-1">
              {/* TAB 1: REAL-WORLD WEATHER MONITORS */}
              {activeTab === 'weather' && (
                <div className="space-y-3">
                  {/* Weather Sensor Grid */}
                  <motion.div
                    variants={gridStaggerContainer}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                  >
                    <motion.div variants={gridStaggerItem} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                        <span>Temperature</span>
                        <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                      </div>
                      <div className="text-lg font-mono font-bold text-white">{weather.temperatureCelsius}°C</div>
                      <div className="text-[9px] text-slate-400">Dew Point: {weather.dewPointCelsius}°C</div>
                    </motion.div>

                    <motion.div variants={gridStaggerItem} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                        <span>Humidity</span>
                        <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <div className="text-lg font-mono font-bold text-cyan-300">{weather.relativeHumidityPercent}%</div>
                      <div className="text-[9px] text-slate-400">Target: &lt;80%</div>
                    </motion.div>

                    <motion.div variants={gridStaggerItem} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                        <span>Wind Speed</span>
                        <Wind className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <div className="text-lg font-mono font-bold text-white">{weather.windSpeedKmH} km/h</div>
                      <div className="text-[9px] text-slate-400">Drift: +{Math.round((targetOutput.windLossMultiplier - 1) * 100)}%</div>
                    </motion.div>

                    <motion.div variants={gridStaggerItem} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                        <span>UV Index</span>
                        <Sun className="w-3.5 h-3.5 text-amber-300" />
                      </div>
                      <div className="text-lg font-mono font-bold text-amber-200">{weather.uvIndex} / 10</div>
                      <div className="text-[9px] text-slate-400">Color fastness high</div>
                    </motion.div>

                    <motion.div variants={gridStaggerItem} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                        <span>Rain Risk</span>
                        <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <div className="text-lg font-mono font-bold text-blue-300">{weather.rainProbabilityPercent}%</div>
                      <div className="text-[9px] text-slate-400">Window: Clear</div>
                    </motion.div>

                    <motion.div variants={gridStaggerItem} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                        <span>Barometric</span>
                        <Sliders className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <div className="text-lg font-mono font-bold text-white">{weather.barometricPressureKpa} kPa</div>
                      <div className="text-[9px] text-slate-400">Stable pressure</div>
                    </motion.div>
                  </motion.div>

                  {/* Hourly Weather Forecast Bar */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center justify-between">
                      <span>Hourly Weather & Coating Safety Forecast</span>
                      <span className="text-indigo-400">8-Hour Horizon</span>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {forecast.map((fc, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0 min-w-[70px] text-center space-y-1 font-mono"
                        >
                          <div className="text-[10px] font-bold text-slate-300">{fc.timeLabel}</div>
                          <div className="text-xs font-bold text-white">{fc.tempC}°C</div>
                          <div className="text-[9px] text-cyan-300">{fc.humidityPercent}% RH</div>
                          <div
                            className={`text-[8px] font-bold uppercase px-1 py-0.5 rounded ${
                              fc.suitabilityLabel === 'Optimal'
                                ? 'bg-emerald-950 text-emerald-400'
                                : fc.suitabilityLabel === 'Good'
                                ? 'bg-blue-950 text-blue-400'
                                : 'bg-amber-950 text-amber-400'
                            }`}
                          >
                            {fc.suitabilityLabel}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Copilot Field Guidance Box */}
                  <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-[11px] font-mono uppercase">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Copilot AI Site Advice</span>
                    </div>
                    {targetOutput.copilotAdviceNotes.map((note, i) => (
                      <p key={i} className="text-[11px] text-slate-300 leading-snug">
                        • {note}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: WEATHER-INTEGRATED LOCATION TASK SCHEDULER */}
              {activeTab === 'scheduler' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400 font-bold">
                    <span>Task Scheduler (Weather-Synced)</span>
                    <span className="text-emerald-400">Optimal Windows</span>
                  </div>

                  <div className="space-y-2">
                    {scheduledTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[9px] font-bold uppercase text-indigo-400 block">
                              {task.stageLabel}
                            </span>
                            <span className="font-bold text-white text-xs">{task.taskName}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              task.suitabilityStatus === 'Optimal'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}
                          >
                            {task.suitabilityStatus}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800">
                          <div>
                            <span className="text-slate-500 block">Scheduled Window:</span>
                            <span className="font-bold text-cyan-300">{task.scheduledTimeWindow}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Material Target:</span>
                            <span className="font-bold text-white">{task.estimatedMaterialLiters} Liters</span>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-400 leading-snug">
                          💡 <span className="text-slate-300">{task.weatherNotes}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: COPILOT WEATHER ALERTS & TOAST NOTIFICATIONS */}
              {activeTab === 'alerts' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400 font-bold">
                    <span>Weather Copilot Push Alerts</span>
                    <span className="text-indigo-400">{notifications.length} Alerts</span>
                  </div>

                  <div className="space-y-2">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-xl border space-y-1.5 ${
                          n.severity === 'warning'
                            ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                            : 'bg-slate-950 border-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold font-mono">
                          <span className="flex items-center gap-1.5 text-white">
                            <Bot className="w-3.5 h-3.5 text-indigo-400" />
                            {n.title}
                          </span>
                          <span className="text-[9px] text-slate-400">{n.timestamp}</span>
                        </div>

                        <p className="text-[11px] text-slate-300 leading-snug">{n.message}</p>

                        <div className="text-[9px] font-mono text-cyan-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800 inline-block">
                          Trigger Metric: {n.weatherMetric}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Calendar Modal Pop-Up for Future Task Planning & Forecast Check */}
      <AnimatePresence>
        {isCalendarModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-indigo-500/50 rounded-2xl p-5 shadow-2xl space-y-4 text-slate-200 font-sans"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wide">
                      Copilot Task Planner & Calendar
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Select future date & auto-check weather forecast
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setIsCalendarModalOpen(false);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Task Name Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Task Title / Coating Stage
                </label>
                <input
                  type="text"
                  value={plannedTaskName}
                  onChange={(e) => setPlannedTaskName(e.target.value)}
                  placeholder="e.g. Exterior Primer & Topcoat Application"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Calendar Header: Month / Year */}
              <div className="space-y-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">
                      {new Date(calendarYear, calendarMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        if (calendarMonth === 0) {
                          setCalendarMonth(11);
                          setCalendarYear((y) => y - 1);
                        } else {
                          setCalendarMonth((m) => m - 1);
                        }
                      }}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs px-2"
                    >
                      &larr;
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        if (calendarMonth === 11) {
                          setCalendarMonth(0);
                          setCalendarYear((y) => y + 1);
                        } else {
                          setCalendarMonth((m) => m + 1);
                        }
                      }}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs px-2"
                    >
                      &rarr;
                    </button>
                  </div>
                </div>

                {/* Days of Week Header */}
                <div className="grid grid-cols-7 text-center text-[10px] font-mono font-bold text-slate-500 pb-1">
                  <span>Su</span>
                  <span>Mo</span>
                  <span>Tu</span>
                  <span>We</span>
                  <span>Th</span>
                  <span>Fr</span>
                  <span>Sa</span>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
                  {Array.from({ length: new Date(calendarYear, calendarMonth, 1).getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: new Date(calendarYear, calendarMonth + 1, 0).getDate() }).map((_, i) => {
                    const dayNum = i + 1;
                    const isSelected = selectedDay === dayNum;
                    const isToday =
                      now.getFullYear() === calendarYear &&
                      now.getMonth() === calendarMonth &&
                      now.getDate() === dayNum;
                    
                    // Determine simulated weather suitability for this day to highlight unfavorable in red
                    const dayOffset = (new Date(calendarYear, calendarMonth, dayNum).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                    const mockHumidity = Math.round(62 + Math.cos(dayOffset) * 15);
                    const mockRain = mockHumidity > 75 ? Math.round(40 + Math.random() * 40) : Math.round(Math.random() * 20);
                    const isUnfavorable = mockRain > 50 || mockHumidity > 82;

                    return (
                      <button
                        key={`day-${dayNum}`}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setSelectedDay(dayNum);
                        }}
                        className={`p-2 rounded-xl transition-all flex flex-col items-center justify-center font-semibold text-xs ${
                          isSelected
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/50 border border-purple-400'
                            : isUnfavorable
                            ? 'bg-rose-950/40 text-rose-300 border border-rose-500/50 hover:bg-rose-900/50'
                            : isToday
                            ? 'bg-slate-900 text-purple-300 border border-purple-500/60'
                            : 'bg-slate-950/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800/80'
                        }`}
                      >
                        <span>{dayNum}</span>
                        {isUnfavorable && (
                          <span className="w-1 h-1 rounded-full bg-rose-400 mt-0.5 animate-pulse" title="Unfavorable weather alert" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setIsCalendarModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSuccessSound();
                    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(
                      selectedDay
                    ).padStart(2, '0')}`;

                    const dayOffset =
                      (new Date(calendarYear, calendarMonth, selectedDay).getTime() - new Date().getTime()) /
                      (1000 * 3600 * 24);
                    const mockTemp = Math.round(18 + Math.sin(dayOffset) * 6);
                    const mockHumidity = Math.round(62 + Math.cos(dayOffset) * 15);
                    const mockRain =
                      mockHumidity > 75 ? Math.round(40 + Math.random() * 40) : Math.round(Math.random() * 20);
                    const suitability = mockRain > 50 || mockHumidity > 82 ? 'Caution' : 'Optimal';

                    const advice = `Copilot Forecast for ${dateStr}: Projected Temp ${mockTemp}°C, Humidity ${mockHumidity}%, Precipitation Risk ${mockRain}%. ${
                      suitability === 'Optimal'
                        ? 'Desirable weather conditions: favorable curing rate, low moisture risk.'
                        : 'Undesirable weather period: elevated moisture/precipitation risk. Ensure temporary containment or schedule indoor phase.'
                    }`;

                    const newScheduledTask: ScheduledCoatingTask = {
                      id: `task-future-${Date.now()}`,
                      taskName: plannedTaskName.trim() || 'Planned Surface Coating',
                      stageLabel: `Scheduled: ${dateStr}`,
                      scheduledTimeWindow: '09:00 AM - 03:00 PM',
                      durationHours: 6,
                      recommendedTimeSlot: '09:00 AM - 03:00 PM',
                      suitabilityScore: suitability === 'Optimal' ? 88 : 52,
                      suitabilityStatus: suitability === 'Optimal' ? 'Optimal' : 'Caution',
                      targetCoverageM2: siteParams.siteAreaSqMeters || 120,
                      estimatedMaterialLiters: Math.round(siteParams.siteAreaSqFt * 0.05),
                      weatherNotes: advice,
                      status: 'scheduled',
                    };

                    setScheduledTasks((prev) => [newScheduledTask, ...prev]);
                    setActiveTab('scheduler');
                    setIsCalendarModalOpen(false);

                    const toastNotice: WeatherToastNotification = {
                      id: `notice-calendar-${Date.now()}`,
                      title: `Task Scheduled: ${dateStr}`,
                      message: advice,
                      severity: suitability === 'Optimal' ? 'info' : 'warning',
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      weatherMetric: `${dateStr} | ${suitability}`,
                      read: false,
                    };

                    setNotifications((prev) => [toastNotice, ...prev]);
                    setActiveToast(toastNotice);
                    setUnreadAlertCount((prev) => prev + 1);
                  }}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Check Forecast & Schedule</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
