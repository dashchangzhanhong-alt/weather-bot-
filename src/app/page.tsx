'use client';

import { useEffect, useState } from 'react';
import { Thermometer, Compass, Eye, Sparkles, MapPin } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeatherData(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeatherData(37.7749, -122.4194)
      );
    } else {
      fetchWeatherData(37.7749, -122.4194);
    }
  }, []);

  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Error loading weather data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white font-sans">
        <div className="text-center space-y-3">
          <Sparkles className="w-8 h-8 animate-spin mx-auto text-blue-400" />
          <p className="text-lg font-light tracking-wide">
            Detecting Location and Sky Conditions...
          </p>
        </div>
      </div>
    );
  }

  const weather = data?.weather;
  const temp = Math.round(Number(weather?.main?.temp) || 0);
  const feelsLike = Math.round(Number(weather?.main?.feels_like) || 0);
  const tempMax = Math.round(Number(weather?.main?.temp_max) || 0);
  const tempMin = Math.round(Number(weather?.main?.temp_min) || 0);
  const humidity = Number(weather?.main?.humidity) || 0;
  const windSpeed = Number(weather?.wind?.speed) || 0;
  const windDeg = Number(weather?.wind?.deg) || 0;
  const visibilityKm = weather?.visibility ? (Number(weather.visibility) / 1000).toFixed(1) : '10';
  const locationName = String(weather?.name || 'Overhead Sky');
  const description = String(weather?.weather?.[0]?.description || 'Clear Sky');

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-600 via-indigo-900 to-slate-950 text-white p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Main Header */}
        <header className="text-center py-6">
          <div className="flex items-center justify-center gap-2 text-blue-200 mb-1">
            <MapPin className="w-4 h-4" />
            <h1 className="text-3xl font-light tracking-wide">{locationName}</h1>
          </div>
          <p className="text-8xl font-extralight tracking-tighter my-2">
            {temp}°
          </p>
          <p className="text-lg font-medium capitalize text-blue-200">
            {description}
          </p>
          <div className="flex justify-center gap-4 text-sm mt-2 text-blue-100 font-light">
            <span>H: {tempMax}°</span>
            <span>L: {tempMin}°</span>
          </div>
        </header>

        {/* Weather Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-5 flex flex-col justify-between shadow-lg">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-blue-200 font-semibold">
              <Thermometer className="w-4 h-4" /> Feels Like
            </div>
            <p className="text-4xl font-light my-4">{feelsLike}°</p>
            <p className="text-xs text-blue-100">Humidity: {humidity}%</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-5 flex flex-col justify-between shadow-lg">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-blue-200 font-semibold">
              <Compass className="w-4 h-4" /> Wind
            </div>
            <p className="text-4xl font-light my-4">
              {windSpeed} <span className="text-base font-normal">m/s</span>
            </p>
            <p className="text-xs text-blue-100">Direction: {windDeg}°</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-5 flex flex-col justify-between shadow-lg">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-blue-200 font-semibold">
              <Eye className="w-4 h-4" /> Visibility
            </div>
            <p className="text-4xl font-light my-4">
              {visibilityKm} <span className="text-base font-normal">km</span>
            </p>
            <p className="text-xs text-blue-100">Atmospheric clarity</p>
          </div>
        </div>

        {/* Constellation Card */}
        <section className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 shadow-xl">
          <h2 className="text-xl font-light mb-4 flex items-center gap-2 text-blue-100">
            <Sparkles className="w-5 h-5 text-yellow-300" /> Overhead Constellation and Star Chart
          </h2>
          {data?.astronomy?.imageUrl ? (
            <div className="relative w-full h-80 overflow-hidden rounded-2xl border border-white/10 shadow-inner bg-slate-950">
              <img 
                src={data.astronomy.imageUrl} 
                alt="Current Zenith Constellation Map" 
                className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-500"
              />
            </div>
          ) : (
            <div className="h-64 bg-slate-900/60 rounded-2xl flex flex-col items-center justify-center text-center p-6 border border-white/10">
              <p className="text-sm text-slate-300 font-medium mb-1">Live Sky Chart Ready</p>
              <p className="text-xs text-slate-400 max-w-md">
                Add your API credentials in .env.local to render the live overhead star map.
              </p>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}