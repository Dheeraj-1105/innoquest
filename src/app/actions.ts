
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
