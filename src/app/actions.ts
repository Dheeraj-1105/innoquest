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
import {
  getDoc,
  collection,
  getDocs,
  query,
  limit,
  orderBy,
  doc,
  writeBatch,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

// Helper to get farmer profile from Firestore
async function getFarmerProfile(userId: string) {
  if (!userId) return null;
  try {
    const { firestore } = initializeFirebase();
    const farmerDocRef = doc(firestore, 'farmers', userId);
    const farmerDoc = await getDoc(farmerDocRef);
    if (farmerDoc.exists()) {
      return farmerDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching farmer profile:', error);
    return null;
  }
}

// Helper to get live weather data from OpenWeatherMap API
async function getWeatherData(location: string = 'pune') {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.warn("OpenWeather API key is not set. Using mock weather data.");
    // Fallback to mock data if API key is missing
    return {
      temperature: 28,
      humidity: 75,
      rainfall: 0.5,
      location: 'Pune (Mock)',
      weatherAlerts: ['Chance of light rain']
    };
  }
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url, { cache: 'no-store' }); 
    if (!response.ok) {
      console.error(`Error fetching weather data for ${location}: ${response.statusText}`);
      // Fallback to mock data on API error
      return {
        temperature: 25,
        humidity: 60,
        rainfall: 0,
        location: `${location} (data unavailable)`,
        weatherAlerts: ['Could not fetch live data.']
      };
    }
    const data = await response.json();
    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      rainfall: data.rain ? data.rain['1h'] || 0 : 0, 
      location: data.name,
      weatherAlerts: data.weather.map((w: any) => w.description)
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
     return {
        temperature: 25,
        humidity: 60,
        rainfall: 0,
        location: `${location} (data unavailable)`,
        weatherAlerts: ['Could not fetch live data.']
      };
  }
}

// Helper to get latest market data from Firestore
async function getMarketData() {
  try {
    const { firestore } = initializeFirebase();
    const marketCollectionRef = collection(firestore, 'market_data');
    const marketQuery = query(marketCollectionRef, orderBy('date', 'desc'), limit(5)); // Fetch a few recent prices
    const marketSnapshot = await getDocs(marketQuery);
    if (!marketSnapshot.empty) {
      return marketSnapshot.docs.map(doc => doc.data());
    }
    console.log("No market data found in Firestore.");
    return []; // Return empty array if no data
  } catch (error) {
    console.error('Error fetching market data:', error);
    return []; // Return empty array on error
  }
}

export async function getAiAdvice(
  queryText: string,
  language: string,
  userId: string
): Promise<ChatAssistantOutput> {
  if (!queryText) {
    throw new Error('Query cannot be empty.');
  }

  try {
    const farmerProfile = await getFarmerProfile(userId);
    const location = farmerProfile?.location?.split(',')[0].trim().toLowerCase() || 'pune';
    
    // Fetch data in parallel for efficiency
    const [weatherData, marketData] = await Promise.all([
      getWeatherData(location),
      getMarketData()
    ]);

    const aiInput: ChatAssistantInput = {
      query: queryText,
      language,
      farmerProfile: farmerProfile as ChatAssistantInput['farmerProfile'],
      weather: weatherData,
      market: marketData.length > 0 ? (marketData as ChatAssistantInput['market']) : undefined,
    };

    const response = await chatAssistant(aiInput);
    return response;
  } catch (error: any) {
    console.error('Error in getAiAdvice:', error);
    throw new Error(`Failed to get AI advice: ${error.message}`);
  }
}

export async function getAiAdviceFromVoice(
  audioDataUri: string,
  language: string,
  userId: string
): Promise<ChatAssistantOutput> {
  if (!audioDataUri) {
    throw new Error('Audio data cannot be empty.');
  }

  try {
    const { transcription } = await transcribeVoiceToText({ audioDataUri });

    if (!transcription) {
      throw new Error('Transcription failed.');
    }

    const response = await getAiAdvice(transcription, language, userId);
    return response;
  } catch (error: any) {
    console.error('Error in getAiAdviceFromVoice:', error);
    throw new Error(`Failed to process voice advice: ${error.message}`);
  }
}

export async function getAiDiagnosisForCrop(
  photoDataUri: string,
  language: string
): Promise<DiagnoseCropDiseaseOutput> {
  if (!photoDataUri) {
    throw new Error('Photo data cannot be empty.');
  }

  try {
    const response = await diagnoseCropDisease({ photoDataUri, language });
    return response;
  } catch (error: any) {
    console.error('Error in getAiDiagnosisForCrop:', error);
    throw new Error(`Failed to get crop diagnosis: ${error.message}`);
  }
}

export async function getDashboardWeather(userId: string | undefined) {
    if (!userId) {
        // For logged-out users, provide a default location
        return getWeatherData('pune');
    }
    const farmerProfile = await getFarmerProfile(userId);
    const location = farmerProfile?.location?.split(',')[0].trim().toLowerCase() || 'pune';
    return getWeatherData(location);
}

export async function seedMarketData() {
  try {
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);
    const marketRef = collection(firestore, 'market_data');

    const sampleData = [
      { cropName: "Tomato", region: "Pune", pricePerKg: 35, date: new Date().toISOString() },
      { cropName: "Onion", region: "Nashik", pricePerKg: 28, date: new Date().toISOString() },
      { cropName: "Cotton", region: "Nagpur", pricePerKg: 65, date: new Date().toISOString() },
      { cropName: "Sugarcane", region: "Kolhapur", pricePerKg: 4, date: new Date().toISOString() },
      { cropName: "Soybean", region: "Latur", pricePerKg: 48, date: new Date().toISOString() },
      { cropName: "Rice", region: "Raigad", pricePerKg: 52, date: new Date().toISOString() },
      { cropName: "Wheat", region: "Aurangabad", pricePerKg: 25, date: new Date().toISOString() }
    ];

    sampleData.forEach(item => {
      const docRef = doc(marketRef); // Auto-generate ID
      batch.set(docRef, { ...item, id: docRef.id });
    });

    await batch.commit();
    return { success: true, message: "Market data seeded successfully!" };
  } catch (error: any) {
    console.error("Error seeding market data:", error);
    return { success: false, message: `Failed to seed data: ${error.message}` };
  }
}
