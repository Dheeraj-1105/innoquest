'use server';
import { config } from 'dotenv';
config();

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
 * Handles communication between the client and Genkit AI flows.
 */

// Helper to get farmer profile from Firestore using Admin SDK
async function getFarmerProfile(userId: string) {
  if (!userId) return null;
  try {
    const { firestore } = await initializeServerApp();
    const farmerDocRef = firestore.collection('farmers').doc(userId);
    const farmerDoc = await farmerDocRef.get();
    if (farmerDoc.exists) {
      return farmerDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching farmer profile:', error);
    return null;
  }
}

// Helper to get live weather data from OpenWeatherMap API
export async function getWeather(userId: string) {
  const farmerProfile = await getFarmerProfile(userId);
  const location = farmerProfile?.location?.split(',')[0].trim().toLowerCase() || 'pune';
  
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return {
      temperature: 28,
      humidity: 75,
      rainfall: 0.5,
      location: 'Pune (Mock)',
      weatherCondition: 'Haze'
    };
  }
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url, { cache: 'no-store' }); 
    if (!response.ok) return null;
    const data = await response.json();
    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      rainfall: data.rain ? data.rain['1h'] || 0 : 0, 
      location: data.name,
      weatherCondition: data.weather[0]?.main || 'Clear'
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
     return null;
  }
}

// Helper to get latest market data from Firestore
async function getMarketData() {
  try {
    const { firestore } = await initializeServerApp();
    const marketCollectionRef = firestore.collection('market_data');
    const marketQuery = marketCollectionRef.orderBy('date', 'desc').limit(5);
    const marketSnapshot = await marketQuery.get();
    if (!marketSnapshot.empty) {
      return marketSnapshot.docs.map(doc => doc.data());
    }
    return [];
  } catch (error) {
    console.error('Error fetching market data:', error);
    return [];
  }
}

export async function getAiAdvice(
  queryText: string,
  language: string,
  userId: string
): Promise<ChatAssistantOutput> {
  if (!queryText) throw new Error('Query cannot be empty.');

  try {
    const [farmerProfile, marketData] = await Promise.all([
      getFarmerProfile(userId),
      getMarketData()
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
      market: marketData.length > 0 ? marketData.map(md => ({ cropName: md.cropName, pricePerKg: md.pricePerKg })) : undefined,
    };
    
    // Fallback data if no market data is present
    if (!aiInput.market || aiInput.market.length === 0) {
       aiInput.market = [{ cropName: 'Tomato', pricePerKg: 45 }];
    }

    return await chatAssistant(aiInput);
  } catch (error: any) {
    console.error('getAiAdvice error:', error);
    throw new Error(`AI Service Error: ${error.message || 'The assistant is currently unavailable.'}`);
  }
}

export async function getAiAdviceFromVoice(
  audioDataUri: string,
  language: string,
  userId: string
): Promise<ChatAssistantOutput> {
  try {
    const { transcription } = await transcribeVoiceToText({ audioDataUri });
    if (!transcription) throw new Error('Transcription failed.');
    return await getAiAdvice(transcription, language, userId);
  } catch (error: any) {
    throw new Error(`Voice Processing Error: ${error.message}`);
  }
}

export async function getAiDiagnosisForCrop(
  photoDataUri: string,
  language: string
): Promise<DiagnoseCropDiseaseOutput> {
  try {
    return await diagnoseCropDisease({ photoDataUri, language });
  } catch (error: any) {
    throw new Error(`Diagnosis Error: ${error.message}`);
  }
}

export async function getDashboardData(userId: string) {
    const weatherData = await getWeather(userId);
    if (!weatherData) return { weatherData: null, insights: null, marketData: [] };
    
    const [marketData, farmerProfile] = await Promise.all([
      getMarketData(),
      getFarmerProfile(userId)
    ]);

    const insights = await getDashboardInsights({
      location: weatherData.location,
      weather: {
        temperature: weatherData.temperature,
        humidity: weatherData.humidity,
        rainfall: weatherData.rainfall,
        weatherCondition: weatherData.weatherCondition,
      },
      crops: farmerProfile?.cropsGrown || []
    });

    return { weatherData, insights, marketData };
}

export async function seedMarketData(userId: string) {
  try {
    const { firestore } = await initializeServerApp();
    const farmerProfile = await getFarmerProfile(userId);
    const region = farmerProfile?.location?.split(',')[1]?.trim() || 'Maharashtra';
    
    const { crops } = await suggestCrops({ region });
    if (!crops || crops.length === 0) throw new Error("AI failed to suggest crops.");

    const batch = firestore.batch();
    const marketRef = firestore.collection('market_data');
    
    crops.forEach(crop => {
      const docRef = marketRef.doc();
      batch.set(docRef, { ...crop, id: docRef.id, region, date: new Date().toISOString() });
    });

    await batch.commit();
    return { success: true, message: "Market data seeded!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
