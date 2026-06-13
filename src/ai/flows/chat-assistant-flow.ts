
'use server';

/**
 * @fileOverview AI-powered chat assistant for farmers using Groq.
 * Provides personalized agricultural advice based on profile, weather, and market data.
 */

import { groq, GROQ_TEXT_MODEL } from '@/ai/groq-client';
import { governmentSchemes } from '@/lib/schemes';

export type ChatAssistantInput = {
  query: string;
  language: string;
  farmerProfile?: {
    name?: string;
    location?: string;
    cropsGrown?: string[];
    preferredLanguage?: string;
  };
  weather?: {
    temperature: number;
    humidity: number;
    rainfall: number;
  };
  market?: Array<{
    cropName: string;
    pricePerKg: number;
  }>;
};

export type ChatAssistantOutput = {
  advice: string;
  language: string;
  weatherSummary?: string;
  marketSummary?: string;
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', hi: 'Hindi', te: 'Telugu', ta: 'Tamil',
};

export async function chatAssistant(input: ChatAssistantInput): Promise<ChatAssistantOutput> {
  const langName = LANGUAGE_NAMES[input.language] || 'English';

  // Build context sections
  const contextParts: string[] = [];

  if (input.farmerProfile) {
    const p = input.farmerProfile;
    const crops = p.cropsGrown?.join(', ') || 'not specified';
    contextParts.push(`Farmer Profile: ${p.name || 'Farmer'} in ${p.location || 'India'}. Growing: ${crops}`);
  }

  if (input.weather) {
    contextParts.push(
      `Current Weather: ${input.weather.temperature}°C, ${input.weather.humidity}% humidity, ${input.weather.rainfall}mm rainfall`
    );
  }

  if (input.market?.length) {
    const prices = input.market.map(m => `${m.cropName}: ₹${m.pricePerKg}/kg`).join(', ');
    contextParts.push(`Market Prices: ${prices}`);
  }

  // Include relevant government schemes if query is about subsidies/loans/schemes
  const queryLower = input.query.toLowerCase();
  const schemeKeywords = ['scheme', 'subsidy', 'subsidies', 'loan', 'government', 'yojana', 'support', 'grant', 'benefit'];
  if (schemeKeywords.some(k => queryLower.includes(k))) {
    const relevant = governmentSchemes.slice(0, 3);
    const schemeInfo = relevant.map(s => `• ${s.title}: ${s.description} (Apply: ${s.link})`).join('\n');
    contextParts.push(`Relevant Government Schemes:\n${schemeInfo}`);
  }

  const contextBlock = contextParts.length > 0
    ? `\nCONTEXT:\n${contextParts.join('\n')}\n`
    : '';

  const systemPrompt = `You are "AgriAdvisor", an expert AI agricultural assistant for Indian farmers.
Always respond in ${langName}. Be practical, empathetic, and specific.
Use simple language farmers can understand. Format your advice clearly.

You MUST respond with a valid JSON object in this exact format:
{
  "advice": "Your detailed agricultural advice here (use \\n for line breaks)",
  "language": "${input.language}",
  "weatherSummary": "One sentence about weather impact on crops (or null)",
  "marketSummary": "One sentence about market opportunity (or null)"
}`;

  const userMessage = `${contextBlock}
FARMER'S QUESTION: "${input.query}"

Provide helpful, actionable advice. Respond ONLY with the JSON object.`;

  const completion = await groq.chat.completions.create({
    model: GROQ_TEXT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 1024,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('No response from AI');

  const parsed = JSON.parse(content);
  return {
    advice: parsed.advice || 'Could not generate advice. Please try again.',
    language: parsed.language || input.language,
    weatherSummary: parsed.weatherSummary || undefined,
    marketSummary: parsed.marketSummary || undefined,
  };
}
