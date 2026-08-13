import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Default fallback coordinates (Kuala Lumpur) if location is denied
  const lat = searchParams.get('lat') || '3.1390';
  const lon = searchParams.get('lon') || '101.6869';

  const weatherApiKey = process.env.OPENWEATHER_API_KEY;
  const astronomyAppId = process.env.ASTRONOMY_APP_ID;
  const astronomySecret = process.env.ASTRONOMY_APP_SECRET;

  try {
    // 1. Fetch live OpenWeather weather data
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${weatherApiKey}`
    );
    const weatherData = await weatherRes.json();

    // 2. Fetch official city/district name using OpenWeather Reverse Geocoding API
    let cityName = weatherData.name;
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${weatherApiKey}`
    );
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      if (geoData && geoData.length > 0) {
        // Prefers state/city name over small local station sub-names
        cityName = geoData[0].state || geoData[0].name || weatherData.name;
      }
    }

    // 3. Dynamic star chart generated using live timestamp and location
    let starChartUrl = null;
    if (astronomyAppId && astronomySecret) {
      const authHeader = `Basic ${btoa(`${astronomyAppId}:${astronomySecret}`)}`;
      const currentDate = new Date().toISOString().split('T')[0];

      const astroRes = await fetch('https://api.astronomyapi.com/api/v2/studio/star-chart', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          style: 'navy',
          observer: {
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
            date: currentDate,
          },
          view: {
            type: 'area',
            parameters: {
              position: {
                equatorial: {
                  rightAscension: 0,
                  declination: 0,
                },
              },
              zoom: 3,
            },
          },
        }),
      });

      if (astroRes.ok) {
        const astroData = await astroRes.json();
        starChartUrl = astroData?.data?.imageUrl || null;
      }
    }

    return NextResponse.json({
      location: cityName,
      weather: weatherData,
      starChartUrl: starChartUrl,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch live weather or star chart data' }, { status: 500 });
  }
}
