
'use server';

import {
  chatAssistant,
  ChatAssistantInput,
  ChatAssistantOutput,
} from '@/ai/flows/chat-assistant-flow';
import { transcribeVoiceToText } from '@/ai/flows/transcribe-voice-to-text-flow';
import {
  diagnoseCropDisease,
  DiagnoseCropDiseaseOutput,
} from '@/ai/flows/diagnose-crop-disease-flow';
import { suggestCrops } from '@/ai/flows/suggest-crops-flow';
import { initializeServerApp } from '@/firebase/server-init';
import { getDashboardInsights } from '@/ai/flows/get-dashboard-insights-flow';

/**
 * @fileOverview Server Actions for AgriAdvisor AI.
 * Handles the logic for AI advisory, weather, and market data fetching.
 */

async function getFarmerProfile(userId: string) {
  if (!userId) return null;
  try {
    const { firestore } = await initializeServerApp();
    const farmerDoc = await firestore.collection('farmers').doc(userId).get();
    return farmerDoc.exists ? farmerDoc.data() : null;
  } catch (error) {
    console.error('getFarmerProfile error:', error);
    return null;
  }
}

export async function getWeather(userId: string) {
  const farmerProfile = await getFarmerProfile(userId);
  const location = farmerProfile?.location?.split(',')[0].trim().toLowerCase() || 'pune';
  const apiKey = process.env.OPENWEATHER_API_KEY;

  // Standard fallback for when API key is not configured or fails
  const mockWeather = {
    temperature: 28, humidity: 75, rainfall: 0.5,
    location: 'Pune (Mock)', weatherCondition: 'Clear'
  };

  if (!apiKey || apiKey === 'YOUR_OPENWEATHER_API_KEY') {
    return mockWeather;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second timeout

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`;
    const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return mockWeather;
    const data = await response.json();
    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      rainfall: data.rain ? data.rain['1h'] || 0 : 0,
      location: data.name,
      weatherCondition: data.weather[0]?.main || 'Clear'
    };
  } catch (error) {
    console.error('getWeather error:', error);
    return mockWeather;
  }
}

async function getMarketData() {
  try {
    const { firestore } = await initializeServerApp();
    const snapshot = await firestore.collection('market_data').orderBy('date', 'desc').limit(5).get();
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('getMarketData error:', error);
    return [];
  }
}

export async function getAiAdvice(
  queryText: string,
  language: string,
  userId: string
): Promise<ChatAssistantOutput> {
  if (!queryText) throw new Error('Query is empty');

  // Fetch context in parallel but with error boundaries
  const [farmerProfile, marketData, weather] = await Promise.all([
    getFarmerProfile(userId).catch(() => null),
    getMarketData().catch(() => []),
    getWeather(userId).catch(() => ({ temperature: 28, humidity: 75, rainfall: 0 }))
  ]);

  const aiInput: ChatAssistantInput = {
    query: queryText,
    language,
    farmerProfile: farmerProfile ? {
      name: farmerProfile.name,
      location: farmerProfile.location,
      cropsGrown: farmerProfile.cropsGrown,
      preferredLanguage: farmerProfile.preferredLanguage,
    } : undefined,
    weather: weather ? {
      temperature: weather.temperature,
      humidity: weather.humidity,
      rainfall: weather.rainfall,
    } : undefined,
    market: marketData.map((md: any) => ({ cropName: md.cropName, pricePerKg: md.pricePerKg })),
  };

  try {
    return await chatAssistant(aiInput);
  } catch (error: any) {
    console.error('chatAssistant flow failure:', error);
    throw new Error(error.message || 'AI assistant encountered an error.');
  }
}

export async function getAiAdviceFromVoice(
  audioDataUri: string,
  language: string,
  userId: string
): Promise<ChatAssistantOutput> {
  const { transcription } = await transcribeVoiceToText({ audioDataUri });
  if (!transcription) throw new Error('Transcription failed. Please try again.');
  return await getAiAdvice(transcription, language, userId);
}

export async function getAiDiagnosisForCrop(
  photoDataUri: string,
  language: string
): Promise<DiagnoseCropDiseaseOutput> {
  try {
    return await diagnoseCropDisease({ photoDataUri, language });
  } catch (error: any) {
    console.error('diagnoseCropDisease error:', error);
    throw new Error('Failed to analyze the image. Please ensure the photo is clear.');
  }
}

export async function getDashboardData(userId: string) {
  const [weatherData, marketData, farmerProfile] = await Promise.all([
    getWeather(userId),
    getMarketData(),
    getFarmerProfile(userId)
  ]);

  let insights = null;
  if (weatherData) {
    try {
      insights = await getDashboardInsights({
        location: weatherData.location,
        weather: {
          temperature: weatherData.temperature,
          humidity: weatherData.humidity,
          rainfall: weatherData.rainfall,
          weatherCondition: weatherData.weatherCondition,
        },
        crops: farmerProfile?.cropsGrown || []
      });
    } catch (e) {
      console.error('Insights generation failed', e);
    }
  }

  return { weatherData, insights, marketData };
}

export async function seedMarketData(userId: string) {
  try {
    const { firestore } = await initializeServerApp();
    const farmerProfile = await getFarmerProfile(userId);
    const region = farmerProfile?.location?.split(',')[1]?.trim() || 'Maharashtra';
    
    const { crops } = await suggestCrops({ region });
    const batch = firestore.batch();
    const marketRef = firestore.collection('market_data');
    
    crops.forEach(crop => {
      const docRef = marketRef.doc();
      batch.set(docRef, { ...crop, id: docRef.id, region, date: new Date().toISOString() });
    });

    await batch.commit();
    return { success: true, message: "Market data seeded with AI suggestions!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function clearChatHistory(userId: string): Promise<{ success: boolean; message: string }> {
  if (!userId) return { success: false, message: 'User not authenticated.' };
  try {
    const { firestore } = await initializeServerApp();
    const snapshot = await firestore.collection(`farmers/${userId}/advisories`).get();
    if (snapshot.empty) return { success: true, message: 'No messages to delete.' };
    // Firestore batch supports up to 500 ops; chat history is small so one batch is fine
    const batch = firestore.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    return { success: true, message: 'Chat history cleared.' };
  } catch (error: any) {
    console.error('clearChatHistory error:', error);
    return { success: false, message: error.message };
  }
}

// ─── NEW WEATHER INTELLIGENCE ACTIONS ────────────────────────────────────────

export type ForecastDay = {
  date: string;
  dayName: string;
  tempMin: number;
  tempMax: number;
  condition: string;
  icon: string;
  humidity: number;
  rainChance: number;
  windSpeed: number;
  rainfall: number;
};

export type UVData = { uvIndex: number; uvCategory: string; uvAdvice: string };
export type AirQualityData = { aqi: number; category: string; pm25: number; pm10: number };

export type SprayAdvisory = {
  canSpray: boolean;
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Avoid';
  reasons: string[];
  bestWindowToday: string;
};

export type IrrigationAdvisory = {
  shouldIrrigate: boolean;
  urgency: 'Skip' | 'Low' | 'Moderate' | 'High';
  reason: string;
  nextRainIn: string;
};

export type CropDiseaseRisk = {
  overallRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  risks: Array<{ disease: string; risk: 'Low' | 'Medium' | 'High'; trigger: string }>;
};

export type WeatherIntelligenceData = {
  currentWeather: Awaited<ReturnType<typeof getWeather>>;
  forecast: ForecastDay[];
  uvData: UVData | null;
  airQuality: AirQualityData | null;
  sprayAdvisory: SprayAdvisory;
  irrigationAdvisory: IrrigationAdvisory;
  diseaseRisk: CropDiseaseRisk;
  aiSummary: string;
};

async function getLocationCoords(location: string): Promise<{ lat: number; lon: number } | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || apiKey === 'YOUR_OPENWEATHER_API_KEY') return null;
  try {
    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    if (!data?.length) return null;
    return { lat: data[0].lat, lon: data[0].lon };
  } catch { return null; }
}

export async function getWeatherForecast(userId: string): Promise<ForecastDay[]> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || apiKey === 'YOUR_OPENWEATHER_API_KEY') return getMockForecast();
  try {
    const farmerProfile = await getFarmerProfile(userId).catch(() => null);
    const location = farmerProfile?.location?.split(',')[0].trim() || 'Pune';
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`,
      { cache: 'no-store' }
    );
    if (!res.ok) return getMockForecast();
    const data = await res.json();
    // Group by day (forecast comes in 3h intervals)
    const dayMap = new Map<string, any[]>();
    data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000).toLocaleDateString('en-IN');
      if (!dayMap.has(date)) dayMap.set(date, []);
      dayMap.get(date)!.push(item);
    });
    const days: ForecastDay[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (const [date, items] of dayMap) {
      if (days.length >= 5) break;
      const temps = items.map((i: any) => i.main.temp);
      const rainItems = items.filter((i: any) => i.rain);
      const d = new Date(items[0].dt * 1000);
      days.push({
        date,
        dayName: days.length === 0 ? 'Today' : days.length === 1 ? 'Tomorrow' : dayNames[d.getDay()],
        tempMin: Math.round(Math.min(...temps)),
        tempMax: Math.round(Math.max(...temps)),
        condition: items[Math.floor(items.length / 2)].weather[0].main,
        icon: items[Math.floor(items.length / 2)].weather[0].icon,
        humidity: Math.round(items.reduce((a: number, i: any) => a + i.main.humidity, 0) / items.length),
        rainChance: Math.round((rainItems.length / items.length) * 100),
        windSpeed: Math.round(items.reduce((a: number, i: any) => a + i.wind.speed, 0) / items.length * 3.6),
        rainfall: rainItems.reduce((a: number, i: any) => a + (i.rain?.['3h'] || 0), 0),
      });
    }
    return days;
  } catch { return getMockForecast(); }
}

function getMockForecast(): ForecastDay[] {
  const days = ['Today', 'Tomorrow', 'Wed', 'Thu', 'Fri'];
  return days.map((day, i) => ({
    date: new Date(Date.now() + i * 86400000).toLocaleDateString('en-IN'),
    dayName: day, tempMin: 22 + i, tempMax: 34 + i, condition: i === 2 ? 'Rain' : 'Clear',
    icon: i === 2 ? '10d' : '01d', humidity: 65 + i * 3, rainChance: i === 2 ? 80 : 10,
    windSpeed: 12 + i, rainfall: i === 2 ? 12 : 0,
  }));
}

export async function getUVAndAirQuality(userId: string): Promise<{ uv: UVData | null; air: AirQualityData | null }> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || apiKey === 'YOUR_OPENWEATHER_API_KEY') return { uv: null, air: null };
  try {
    const farmerProfile = await getFarmerProfile(userId).catch(() => null);
    const location = farmerProfile?.location?.split(',')[0].trim() || 'Pune';
    const coords = await getLocationCoords(location);
    if (!coords) return { uv: null, air: null };
    const { lat, lon } = coords;
    const [uvRes, airRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`, { cache: 'no-store' }),
      fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`, { cache: 'no-store' }),
    ]);
    let uv: UVData | null = null;
    if (uvRes.ok) {
      const uvData = await uvRes.json();
      const idx = uvData.value;
      uv = {
        uvIndex: Math.round(idx),
        uvCategory: idx < 3 ? 'Low' : idx < 6 ? 'Moderate' : idx < 8 ? 'High' : idx < 11 ? 'Very High' : 'Extreme',
        uvAdvice: idx < 3 ? 'Safe for field work' : idx < 6 ? 'Wear a hat, take breaks' : idx < 8 ? 'Limit midday exposure, use sunscreen' : 'Avoid 10am–4pm, stay in shade',
      };
    }
    let air: AirQualityData | null = null;
    if (airRes.ok) {
      const airData = await airRes.json();
      const comp = airData.list?.[0]?.components;
      const aqi = airData.list?.[0]?.main?.aqi;
      const cats = ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
      air = { aqi, category: cats[aqi] || 'Unknown', pm25: Math.round(comp?.pm2_5 || 0), pm10: Math.round(comp?.pm10 || 0) };
    }
    return { uv, air };
  } catch { return { uv: null, air: null }; }
}

function calcSprayAdvisory(weather: any, forecast: ForecastDay[]): SprayAdvisory {
  const wind = weather?.windSpeed ?? 12;
  const humidity = weather?.humidity ?? 65;
  const condition = weather?.weatherCondition ?? 'Clear';
  const rainToday = forecast[0]?.rainChance ?? 0;
  const reasons: string[] = [];
  let score = 100;
  if (wind > 25) { score -= 40; reasons.push('Wind too strong (>' + Math.round(wind) + ' km/h) — spray drift risk'); }
  else if (wind > 15) { score -= 15; reasons.push('Moderate wind — spray early morning'); }
  else reasons.push('Wind speed ideal for spraying');
  if (humidity > 85) { score -= 20; reasons.push('High humidity — slow drying, disease risk'); }
  else if (humidity < 30) { score -= 15; reasons.push('Very low humidity — rapid evaporation'); }
  else reasons.push('Humidity good for even coverage');
  if (condition === 'Rain' || rainToday > 60) { score -= 40; reasons.push('Rain expected — avoid spraying'); }
  else if (rainToday > 30) { score -= 15; reasons.push('Chance of rain — monitor closely'); }
  else reasons.push('No rain expected — safe to spray');
  const rating: SprayAdvisory['rating'] = score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 50 ? 'Fair' : score >= 30 ? 'Poor' : 'Avoid';
  return { canSpray: score >= 50, rating, reasons, bestWindowToday: wind < 15 ? '6:00 AM – 9:00 AM' : '5:30 AM – 7:30 AM' };
}

function calcIrrigationAdvisory(weather: any, forecast: ForecastDay[]): IrrigationAdvisory {
  const humidity = weather?.humidity ?? 65;
  const temp = weather?.temperature ?? 28;
  const rainInNext3Days = forecast.slice(0, 3).find(d => d.rainChance > 50);
  const rainInNext5Days = forecast.slice(0, 5).find(d => d.rainChance > 50);
  if (weather?.rainfall > 5 || forecast[0]?.rainChance > 70)
    return { shouldIrrigate: false, urgency: 'Skip', reason: 'Rain occurring or imminent — skip irrigation to avoid waterlogging', nextRainIn: 'Today' };
  if (rainInNext3Days)
    return { shouldIrrigate: false, urgency: 'Skip', reason: `Rain forecast on ${rainInNext3Days.dayName} (${rainInNext3Days.rainChance}% chance) — save water`, nextRainIn: rainInNext3Days.dayName };
  if (temp > 38 || humidity < 40)
    return { shouldIrrigate: true, urgency: 'High', reason: 'Hot & dry conditions — crops need water urgently', nextRainIn: rainInNext5Days?.dayName ?? 'None in 5 days' };
  if (temp > 32 || humidity < 55)
    return { shouldIrrigate: true, urgency: 'Moderate', reason: 'Warm weather, moderate moisture deficit — irrigate today', nextRainIn: rainInNext5Days?.dayName ?? 'None in 5 days' };
  return { shouldIrrigate: true, urgency: 'Low', reason: 'Conditions stable — light irrigation recommended', nextRainIn: rainInNext5Days?.dayName ?? 'None in 5 days' };
}

function calcDiseaseRisk(weather: any, forecast: ForecastDay[]): CropDiseaseRisk {
  const humidity = weather?.humidity ?? 65;
  const temp = weather?.temperature ?? 28;
  const risks: CropDiseaseRisk['risks'] = [];
  if (humidity > 80 && temp > 20) risks.push({ disease: 'Fungal Blight', risk: humidity > 90 ? 'High' : 'Medium', trigger: `High humidity (${humidity}%)` });
  if (humidity > 75 && temp > 18 && temp < 30) risks.push({ disease: 'Powdery Mildew', risk: 'Medium', trigger: 'Warm & humid conditions' });
  if (forecast.slice(0, 3).some(d => d.rainChance > 60)) risks.push({ disease: 'Downy Mildew', risk: 'Medium', trigger: 'Rain forecast in next 3 days' });
  if (temp > 35) risks.push({ disease: 'Heat Stress', risk: 'High', trigger: `High temperature (${temp}°C)` });
  if (risks.length === 0) risks.push({ disease: 'No major threats', risk: 'Low', trigger: 'Conditions stable' });
  const maxRisk = risks.some(r => r.risk === 'High') ? 'High' : risks.some(r => r.risk === 'Medium') ? 'Medium' : 'Low';
  return { overallRisk: maxRisk as any, risks };
}

export async function getFullWeatherIntelligence(userId: string): Promise<WeatherIntelligenceData> {
  const [currentWeather, forecast, { uv, air }] = await Promise.all([
    getWeather(userId),
    getWeatherForecast(userId),
    getUVAndAirQuality(userId),
  ]);
  const sprayAdvisory = calcSprayAdvisory(currentWeather, forecast);
  const irrigationAdvisory = calcIrrigationAdvisory(currentWeather, forecast);
  const diseaseRisk = calcDiseaseRisk(currentWeather, forecast);
  // Quick AI summary
  let aiSummary = '';
  try {
    const result = await chatAssistant({
      query: `Based on: ${currentWeather.temperature}°C, ${currentWeather.humidity}% humidity, ${currentWeather.weatherCondition} weather, and ${forecast[0]?.rainChance}% rain chance today. Give me ONE short paragraph of the most important farming action for today.`,
      language: 'en',
      weather: { temperature: currentWeather.temperature, humidity: currentWeather.humidity, rainfall: currentWeather.rainfall },
    });
    aiSummary = result.advice;
  } catch { aiSummary = 'Monitor your crops closely today and adjust irrigation based on current weather conditions.'; }
  return { currentWeather, forecast, uvData: uv, airQuality: air, sprayAdvisory, irrigationAdvisory, diseaseRisk, aiSummary };
}

