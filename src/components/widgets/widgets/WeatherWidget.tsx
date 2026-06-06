import { useState, useEffect, memo } from 'react';
import {
  Cloud, CloudRain, Sun, Snowflake, CloudLightning, Wind, Droplets,
  Eye, Thermometer, MapPin, RefreshCw, AlertTriangle
} from 'lucide-react';
import { weatherCodeToDesc, getWeatherIcon, fetchWithFallback } from '../../../utils/helpers';

const CITIES: Record<string, [number, number]> = {
   'New York': [40.71, -74.01], 'London': [51.51, -0.13], 'Tokyo': [35.68, 139.69],
   'Sydney': [-33.87, 151.21], 'Dubai': [25.20, 55.27], 'Paris': [48.86, 2.35],
   'Berlin': [52.52, 13.41], 'Singapore': [1.35, 103.82], 'Nairobi': [-1.29, 36.82],
};

export const WeatherWidget = memo(function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [city, setCity] = useState('New York');
  const [usingGeo, setUsingGeo] = useState(false);

  const fetchWeather = async (lat: number, lon: number, cityName: string) => {
    setLoading(true);
    setError('');
    const data = await fetchWithFallback(
      async () => {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (!res.ok) throw new Error('Weather API failed');
        return res.json();
      },
      null
    );
    if (data) {
      setWeather(data);
      setCity(cityName);
    } else {
      setError('Failed to load weather');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUsingGeo(true);
          fetchWeather(pos.coords.latitude, pos.coords.longitude, 'My Location');
        },
        () => {
          const [lat, lon] = CITIES['New York'];
          fetchWeather(lat, lon, 'New York');
        },
        { timeout: 5000 }
      );
    } else {
      const [lat, lon] = CITIES['New York'];
      fetchWeather(lat, lon, 'New York');
    }
  }, []);

  const handleCityChange = (c: string) => {
    setUsingGeo(false);
    const [lat, lon] = CITIES[c];
    fetchWeather(lat, lon, c);
  };

  const WeatherIcon = ({ code, className }: { code: number; className?: string }) => {
    const icon = getWeatherIcon(code);
    const props = { className: className || 'w-5 h-5' };
    switch (icon) {
      case 'sun': return <Sun {...props} className={`${props.className} text-[#ffcc00]`} />;
      case 'cloud-sun': return <Cloud {...props} className={`${props.className} text-[#00f0ff]`} />;
      case 'cloud-fog': return <Eye {...props} className={`${props.className} text-[#a855f7]`} />;
      case 'cloud-rain': return <CloudRain {...props} className={`${props.className} text-[#00f0ff]`} />;
      case 'snowflake': return <Snowflake {...props} className={`${props.className} text-[#00f0ff]`} />;
      case 'cloud-lightning': return <CloudLightning {...props} className={`${props.className} text-[#ffcc00]`} />;
      default: return <Sun {...props} className={`${props.className} text-[#ffcc00]`} />;
    }
  };

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-[#00f0ff]" />
          <span className="text-xs font-mono text-[#00f0ff]/60 uppercase tracking-widest">Weather</span>
          {usingGeo && <MapPin className="w-3 h-3 text-[#00ff88]" />}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (usingGeo && weather) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude, 'My Location'),
                  () => {}
                );
              } else {
                handleCityChange(city);
              }
            }}
            className="text-white/30 hover:text-[#00f0ff] transition-colors"
            aria-label="Refresh weather"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <select
            value={usingGeo ? '_geo' : city}
            onChange={(e) => {
              if (e.target.value === '_geo') {
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setUsingGeo(true);
                    fetchWeather(pos.coords.latitude, pos.coords.longitude, 'My Location');
                  }
                );
              } else {
                handleCityChange(e.target.value);
              }
            }}
            className="bg-[#0a0a1a] border border-[#1a1a3a] rounded px-2 py-1 text-xs font-mono text-[#00f0ff] focus:outline-none max-w-[110px]"
          >
            <option value="_geo">📍 My Location</option>
            {Object.keys(CITIES).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#00f0ff]/30 border-t-[#00f0ff] rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-8 h-8 text-[#ff3366]/50 mb-2" />
          <span className="text-xs font-mono text-[#ff3366]/60">{error}</span>
          <button onClick={() => handleCityChange(city)} className="mt-2 text-[10px] font-mono text-[#00f0ff]/60 hover:text-[#00f0ff]">Retry</button>
        </div>
      ) : weather ? (
        <>
          <div className="flex items-center gap-4 mb-4">
            <WeatherIcon code={weather.current.weather_code} className="w-12 h-12" />
            <div>
              <div className="text-3xl font-display font-bold text-white">{Math.round(weather.current.temperature_2m)}°C</div>
              <div className="text-xs text-[#00f0ff]/60 font-mono">{weatherCodeToDesc(weather.current.weather_code)}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="flex items-center gap-1 text-[#00f0ff]/60">
              <Droplets className="w-3 h-3" />
              <span>{weather.current.relative_humidity_2m}%</span>
            </div>
            <div className="flex items-center gap-1 text-[#00f0ff]/60">
              <Wind className="w-3 h-3" />
              <span>{weather.current.wind_speed_10m}km/h</span>
            </div>
            <div className="flex items-center gap-1 text-[#00f0ff]/60">
              <Thermometer className="w-3 h-3" />
              <span>Feels {Math.round(weather.current.apparent_temperature)}°</span>
            </div>
          </div>
          {weather.daily && (
            <div className="mt-3 pt-3 border-t border-[#1a1a3a] flex gap-3 overflow-x-auto">
              {weather.daily.time.slice(0, 5).map((t: string, i: number) => (
                <div key={t} className="flex flex-col items-center min-w-[50px]">
                  <span className="text-[10px] text-white/40 font-mono">{new Date(t).toLocaleDateString('en', { weekday: 'short' })}</span>
                  <WeatherIcon code={weather.daily.weather_code[i]} className="w-4 h-4 my-1" />
                  <span className="text-[10px] text-[#00f0ff]/70 font-mono">{Math.round(weather.daily.temperature_2m_max[i])}°</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
});
