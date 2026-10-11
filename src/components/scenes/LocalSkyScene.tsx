import React, { useEffect, useState } from 'react';
import { MeadowScene } from './MeadowScene';

interface SceneProps {
  offset: { x: number; y: number };
  motionEnabled?: boolean;
}

interface WeatherData {
  temp: number;
  weatherCode: number;
  isDay: number;
  isNearSunriseOrSunset: boolean;
  conditionDesc: string;
}

export const LocalSkyScene: React.FC<SceneProps> = ({ offset, motionEnabled = true }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!('geolocation' in navigator)) {
      setErrorMsg('Location not supported by this browser. Showing Meadow.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude.toFixed(4);
          const lon = pos.coords.longitude.toFixed(4);
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&daily=sunrise,sunset&timezone=auto`
          );
          if (!res.ok) throw new Error('Weather fetch failed');
          const data = await res.json();

          if (!isMounted) return;

          const current = data.current || {};
          const daily = data.daily || {};
          const nowMs = Date.now();
          const sunriseMs = daily.sunrise?.[0] ? new Date(daily.sunrise[0]).getTime() : 0;
          const sunsetMs = daily.sunset?.[0] ? new Date(daily.sunset[0]).getTime() : 0;

          // Check if within 45 mins of sunrise or sunset
          const nearSunrise = Math.abs(nowMs - sunriseMs) < 45 * 60 * 1000;
          const nearSunset = Math.abs(nowMs - sunsetMs) < 45 * 60 * 1000;

          const code = current.weather_code ?? 0;
          let desc = 'Clear';
          if (code === 1 || code === 2 || code === 3) desc = 'Partly cloudy';
          else if (code === 45 || code === 48) desc = 'Foggy';
          else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) desc = 'Rain';
          else if (code >= 71 && code <= 77) desc = 'Snow';

          setWeather({
            temp: Math.round(current.temperature_2m ?? 18),
            weatherCode: code,
            isDay: current.is_day ?? 1,
            isNearSunriseOrSunset: nearSunrise || nearSunset,
            conditionDesc: desc,
          });
          setLoading(false);
        } catch {
          if (isMounted) {
            setErrorMsg('Unable to reach weather service. Showing Meadow.');
            setLoading(false);
          }
        }
      },
      (err) => {
        if (isMounted) {
          setErrorMsg(
            err.code === 1
              ? 'Location permission quieted. Showing Meadow.'
              : 'Location unavailable. Showing Meadow.'
          );
          setLoading(false);
        }
      },
      { timeout: 8000 }
    );

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#4a7ff2]/10">
        <div className="text-center px-6">
          <div className="w-6 h-6 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-neutral-600 font-medium">Looking up your local sky...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !weather) {
    return (
      <div className="relative w-full h-full">
        <MeadowScene offset={offset} motionEnabled={motionEnabled} />
        {errorMsg && (
          <div className="absolute top-16 left-4 right-4 z-20 mx-auto max-w-xs bg-white/85 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs text-neutral-600 text-center shadow-sm border border-black/5">
            {errorMsg}
          </div>
        )}
      </div>
    );
  }

  const { temp, weatherCode, isDay, isNearSunriseOrSunset, conditionDesc } = weather;

  // Sky gradient based on time & sun
  let skyBg = '';
  if (isNearSunriseOrSunset) {
    skyBg = 'linear-gradient(180deg, #485c96 0%, #8b688c 35%, #cf8375 75%, #f1a979 100%)';
  } else if (isDay) {
    if (weatherCode >= 2) {
      skyBg = 'linear-gradient(180deg, #627993 0%, #8ea1b4 50%, #b8c7d6 100%)'; // overcast
    } else {
      skyBg = 'linear-gradient(180deg, #3a75c4 0%, #72a5e8 55%, #c5defb 100%)'; // clear day
    }
  } else {
    skyBg = 'linear-gradient(180deg, #090e18 0%, #131b2e 50%, #202b44 100%)'; // night
  }

  const isRain = (weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82);
  const isSnow = weatherCode >= 71 && weatherCode <= 77;
  const isFog = weatherCode === 45 || weatherCode === 48;
  const isCloudy = weatherCode >= 2 && weatherCode <= 3;
  const isClear = weatherCode <= 1;

  const m = motionEnabled ? 1 : 0;
  const farX = offset.x * 0.4 * m;
  const farY = offset.y * 0.4 * m;
  const nearX = offset.x * 1.3 * m;
  const nearY = offset.y * 1.3 * m;

  return (
    <div
      className="absolute inset-0 overflow-hidden select-none pointer-events-none"
      style={{ background: skyBg }}
    >
      {/* Sky status chip in corner */}
      <div className="absolute top-16 left-5 z-20 text-[13px] text-white/90 font-medium tracking-tight drop-shadow-sm flex items-center gap-1.5">
        <span>{temp}°</span>
        <span>·</span>
        <span>{conditionDesc}</span>
      </div>

      {/* Sun or Moon */}
      <div
        className="absolute inset-0 transition-transform duration-75 ease-out will-change-transform"
        style={{ transform: `translate3d(${farX}px, ${farY}px, 0)` }}
      >
        {isClear && (
          <div
            className={`absolute top-[20%] right-[22%] w-20 h-20 rounded-full blur-[1px] ${
              isDay
                ? 'bg-[#fffdf4] shadow-[0_0_90px_35px_rgba(255,250,220,0.8)]'
                : 'bg-[#fefce8] shadow-[0_0_50px_15px_rgba(254,252,232,0.4)]'
            }`}
          />
        )}

        {/* Clouds overlay */}
        {(isCloudy || isRain || isSnow) && (
          <>
            <div className="absolute top-[18%] left-[5%] w-80 h-20 bg-white/20 rounded-full blur-2xl animate-mist" />
            <div className="absolute top-[28%] right-[8%] w-96 h-28 bg-white/15 rounded-full blur-2xl animate-mist" />
          </>
        )}

        {/* Distant skyline / rolling landscape */}
        <svg
          className="absolute bottom-0 w-full h-[36%]"
          viewBox="0 0 1000 300"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 300 L 0 150 Q 300 90 600 130 Q 850 160 1000 100 L 1000 300 Z"
            fill={isDay ? '#486851' : '#0e1814'}
            opacity="0.8"
          />
        </svg>
      </div>

      {/* Weather Particle Overlays */}
      {isRain && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-60">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="rainPattern" width="40" height="80" patternUnits="userSpaceOnUse">
                <line x1="10" y1="5" x2="6" y2="45" stroke="#ffffff" strokeWidth="1.2" opacity="0.65" />
                <line x1="30" y1="35" x2="26" y2="75" stroke="#ffffff" strokeWidth="1.2" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#rainPattern)" />
          </svg>
        </div>
      )}

      {isSnow && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-80">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="snowPattern" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="2.5" fill="#ffffff" opacity="0.75" />
                <circle cx="45" cy="40" r="1.8" fill="#ffffff" opacity="0.6" />
                <circle cx="35" cy="10" r="1.2" fill="#ffffff" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#snowPattern)" />
          </svg>
        </div>
      )}

      {isFog && (
        <div className="absolute inset-0 bg-white/25 backdrop-blur-[2px] animate-mist" />
      )}

      {/* Near Foreground Layer */}
      <div
        className="absolute inset-0 transition-transform duration-75 ease-out will-change-transform flex items-end pointer-events-none"
        style={{ transform: `translate3d(${nearX}px, ${nearY}px, 0)` }}
      >
        <div className="w-full h-24 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
    </div>
  );
};
