'use server';

import {
  chatAssistant,
  ChatAssistantOutput,
} from '@/ai/flows/chat-assistant-flow';
import { transcribeVoiceToText } from '@/ai/flows/transcribe-voice-to-text-flow';
import {
  diagnoseCropDisease,
  DiagnoseCropDiseaseOutput,
} from '@/ai/flows/diagnose-crop-disease-flow';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  limit,
  orderBy,
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

// Helper to get weather data from Firestore
async function getWeatherData(location: string = 'pune') {
  try {
    const { firestore } = initializeFirebase();
    // In a real application, you might fetch this from OpenWeatherMap API
    // and update Firestore periodically. For now, we read from Firestore.
    const weatherDocRef = doc(firestore, 'weather_data', location.toLowerCase());
    const weatherDoc = await getDoc(weatherDocRef);
    if (weatherDoc.exists()) {
      return weatherDoc.data();
    }
    console.warn(`Weather data for location "${location}" not found.`);
    return null;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

// Helper to get latest market data from Firestore
async function getMarketData() {
  try {
    const { firestore } = initializeFirebase();
    const marketCollectionRef = collection(firestore, 'market_data');
    const marketQuery = query(marketCollectionRef, orderBy('date', 'desc'), limit(10));
    const marketSnapshot = await getDocs(marketQuery);
    if (!marketSnapshot.empty) {
      return marketSnapshot.docs.map(doc => doc.data());
    }
    return null;
  } catch (error) {
    console.error('Error fetching market data:', error);
    return null;
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
    // Use farmer's location for weather, default to 'pune' if not available
    const location = farmerProfile?.location?.split(',')[0].trim().toLowerCase() || 'pune';
    const weatherData = await getWeatherData(location);
    const marketData = await getMarketData();

    const response = await chatAssistant({
      query: queryText,
      language,
      farmerProfile: farmerProfile as any,
      weather: weatherData as any,
      market: marketData as any,
    });
    return response;
  } catch (error) {
    console.error('Error in getAiAdvice:', error);
    throw new Error('Failed to get AI advice.');
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
  } catch (error) {
    console.error('Error in getAiAdviceFromVoice:', error);
    throw new Error('Failed to process voice advice.');
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
  } catch (error) {
    console.error('Error in getAiDiagnosisForCrop:', error);
    throw new Error('Failed to get crop diagnosis.');
  }
}
