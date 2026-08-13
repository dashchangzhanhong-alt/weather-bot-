'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLiveData(lat?: number, lon?: number) {
      setLoading(true);
      const query = lat && lon ? `?lat=${lat}&lon=${lon}` : '';
      try {
        const res = await fetch(`/api/weather${query}`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error('Failed to fetch weather', err);
      } finally {
        setLoading(false);
      }
    }

    // Request live browser location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchLiveData(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Fallback if user denies location permission
          fetchLiveData();
        }
      );
    } else {
      fetchLiveData();
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p className="text-xl animate-pulse">Capturing live location & star chart...</p>
      </div>
    );
  }

  const temp = Math.round(data?.weather?.main?.temp ?? 0);
  const feelsLike = Math.round(data?.weather?.main?.feels_like ?? 0);
  const description = data?.weather?.weather?.[0]?.description ?? '';
  const windSpeed = data?.weather?.wind?.speed ?? 0;
  const windDeg = data?.weather?.wind?.deg ?? 0;
  const humidity = data?.weather?.main?.humidity ?? 0;
  const visibility = ((data?.weather?.visibility ?? 0) / 1000).toFixed(1);

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-900 via-slate-900 to-black text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Location & Main Temp */}
        <div className="text-center space-y-2">
          <p className="text-xl md:text-2xl font-light text-blue-200">
            📍 {data?.location || 'Live Location'}
          </p>
          <h1 className="text-7xl md:text-8xl font-bold">{temp}°</h1>
          <p className="text-lg md:text-xl capitalize text-slate-300">{description}</p>
        </div>

        {/* Weather Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
            <p className="text-sm text-slate-400 font-medium">FEELS LIKE</p>
            <p className="text-3xl font-semibold mt-2">{feelsLike}°</p>
            <p className="text-xs text-slate-400 mt-1">Humidity: {humidity}%</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
            <p className="text-sm text-slate-400 font-medium">WIND</p>
            <p className="text-3xl font-semibold mt-2">{windSpeed} <span className="text-base font-normal">m/s</span></p>
            <p className="text-xs text-slate-400 mt-1">Direction: {windDeg}°</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
            <p className="text-sm text-slate-400 font-medium">VISIBILITY</p>
            <p className="text-3xl font-semibold mt-2">{visibility} <span className="text-base font-normal">km</span></p>
            <p className="text-xs text-slate-400 mt-1">Atmospheric clarity</p>
          </div>
        </div>

        {/* Live Overhead Star Chart */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-4">
          <h2 className="text-lg font-medium text-blue-200 flex items-center gap-2">
            ✨ Live Overhead Constellation and Star Chart
          </h2>
          {data?.starChartUrl ? (
            <img
              src={data.starChartUrl}
              alt="Live Zenith Constellation Map"
              className="w-full h-auto rounded-xl shadow-2xl border border-white/10 object-cover"
            />
          ) : (
            <div className="w-full h-64 bg-slate-950/60 rounded-xl flex items-center justify-center text-slate-400 text-sm">
              Generating live overhead star chart...
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
